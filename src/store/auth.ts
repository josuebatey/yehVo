import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../services/supabase";
import { algorandService, type AlgorandWallet } from "../services/algorand";
import { revenueCatService } from "../services/revenuecat";

interface User {
  id: string;
  email: string;
  algorandAddress: string;
  isPro: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  wallet: AlgorandWallet | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  upgradeToProUser: () => Promise<boolean>;
  completeUserSetup: (user: User) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      wallet: null,
      isLoading: false,
      isAuthenticated: false,

      signUp: async (email, password) => {
        set({ isLoading: true });
        try {
          // 1. Create Supabase auth user
          const { data: authData, error: authError } =
            await supabase.auth.signUp({ email, password });

          if (authError) throw authError;
          if (!authData.user) throw new Error("User creation failed");

          // 2. Check if email verification is required
          if (!authData.user.confirmed_at) {
            set({ isLoading: false });
            throw new Error("EMAIL_VERIFICATION_REQUIRED");
          }
          // 3. User is already confirmed, proceed with setup
          await get().completeUserSetup(authData.user as any);
          
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Helper method to complete user setup after email verification
      completeUserSetup: async (user: User) => {
        try {
          if (!user || !user.id || !user.email) {
            throw new Error("Invalid user data");
          }

          // 1. Remove duplicate user if exists
          const { data: existingUser, error: existingUserError } =
            await supabase
              .from("users")
              .select("*")
              .eq("id", user.id)
              .maybeSingle();
          if (existingUserError) throw existingUserError;
          if (existingUser) {
            const { error: deleteError } = await supabase
              .from("users")
              .delete()
              .eq("id", existingUser.id);
            if (deleteError) throw deleteError;
          }

          // 2. Create Algorand wallet
          const wallet = algorandService.createWallet();

          // 3. Encrypt wallet seed
          const { data: encryptedSeed, error: encryptError } =
            await supabase.rpc("encrypt_seed", {
              seed: wallet.mnemonic,
            });
          if (encryptError) {
            console.warn(
              "Seed encryption failed, storing as-is:",
              encryptError
            );
          }

          // 4. Store user data in database
          const { data:insertedUser,error: dbError } = await supabase.from("users").insert({
            id: user.id,
            email: user.email,
            algorand_address: wallet.address,
            encrypted_seed: encryptedSeed || wallet.mnemonic,
          });

          console.log("INSERTED USER", insertedUser);

          if (dbError) {
            console.error("Database error:", dbError);
            throw new Error("Failed to create user profile. Please try again.");
          }

          // 5. Initialize RevenueCat
          try {
            await revenueCatService.initialize(user.id);
          } catch (rcError) {
            console.warn("RevenueCat initialization failed:", rcError);
            // Don't fail the signup if RevenueCat fails
          }

          // 6. Set state
          set({
            user: {
              id: user.id,
              email: user.email,
              algorandAddress: wallet.address,
              isPro: false,
              createdAt: (user as any).created_at || new Date().toISOString(),
            },
            wallet,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error("User setup failed:", error);
          throw error;
        }
      },

      signIn: async (email, password) => {
        set({ isLoading: true });
        try {
          // 1. Sign in with Supabase
          const { data: authData, error: authError } =
            await supabase.auth.signInWithPassword({ email, password });
          if (authError) throw authError;
          if (!authData.user) throw new Error("Sign in failed");

          // 2. Get user data from database
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", authData.user.id)
            .single();

          console.log("USER ERROR", userError);
          
          let finalUserData = userData;
          
          // 3. If user doesn't exist in database, create the profile
          if (userError && userError.code === 'PGRST116') {
            console.log("User profile not found, creating one...");
            try {
              if (!authData.user) {
                throw new Error("No authenticated user found");
              }
              await get().completeUserSetup(authData.user as any);
              
              // Fetch the newly created user data
              const { data: newUserData, error: fetchError } = await supabase
                .from("users")
                .select("*")
                .eq("id", authData.user.id)
                .single();
              
              if (fetchError) throw fetchError;
              finalUserData = newUserData;
            } catch (setupError) {
              console.error("Failed to create user profile:", setupError);
              throw new Error("Failed to create user profile. Please try registering again.");
            }
          } else if (userError) {
            throw userError;
          }

          if (!finalUserData) {
            throw new Error("No user profile found. Please contact support or try registering again.");
          }

          // 4. Decrypt wallet seed
          let decryptedSeed: string;
          try {
            const { data: seed, error: decryptError } = await supabase.rpc(
              "decrypt_seed",
              {
                encrypted_seed: finalUserData.encrypted_seed,
              }
            );
            if (decryptError) throw decryptError;
            decryptedSeed = seed;
          } catch (error) {
            console.warn("Seed decryption failed, using as-is:", error);
            decryptedSeed = finalUserData.encrypted_seed;
          }

          // 5. Restore wallet
          const wallet = algorandService.restoreWallet(decryptedSeed);

          // 6. Initialize RevenueCat and check Pro status
          try {
            if (authData.user) {
              await revenueCatService.initialize(authData.user.id);
              const isPro = await revenueCatService.isProUser();
            }
          } catch (rcError) {
            console.warn("RevenueCat initialization failed:", rcError);
            // Don't fail signin if RevenueCat fails
          }

          // 7. Set state
          set({
            user: {
              id: finalUserData.id,
              email: finalUserData.email,
              algorandAddress: finalUserData.algorand_address,
              isPro: finalUserData.is_pro || false,
              createdAt: finalUserData.created_at,
            },
            wallet,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        try {
          await supabase.auth.signOut();
          set({
            user: null,
            wallet: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      initializeAuth: async () => {
        set({ isLoading: true });
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          
          if (session?.user) {
            console.log("Found existing session for user:", session.user.id);
            
            // Get user data from database
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();
              
            if (userError) {
              console.error("Failed to fetch user data:", userError);
              // If user doesn't exist in our database, sign them out
              await supabase.auth.signOut();
              set({ isLoading: false });
              return;
            }

            // Decrypt wallet seed
            let decryptedSeed: string;
            try {
              const { data: seed, error: decryptError } = await supabase.rpc(
                "decrypt_seed",
                {
                  encrypted_seed: userData.encrypted_seed,
                }
              );
              if (decryptError) throw decryptError;
              decryptedSeed = seed;
            } catch (error) {
              console.warn("Seed decryption failed, using as-is:", error);
              decryptedSeed = userData.encrypted_seed;
            }

            // Restore wallet
            const wallet = algorandService.restoreWallet(decryptedSeed);

            // Initialize RevenueCat and check Pro status
            try {
              await revenueCatService.initialize(session.user.id);
              const isPro = await revenueCatService.isProUser();
            } catch (rcError) {
              console.warn("RevenueCat initialization failed:", rcError);
            }

            set({
              user: {
                id: userData.id,
                email: userData.email,
                algorandAddress: userData.algorand_address,
                isPro: userData.is_pro || false,
                createdAt: userData.created_at,
              },
              wallet,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            console.log("No existing session found");
            set({ isLoading: false });
          }
        } catch (error) {
          console.error("Auth initialization failed:", error);
          set({ 
            user: null,
            wallet: null,
            isAuthenticated: false,
            isLoading: false 
          });
        }
      },

      upgradeToProUser: async () => {
        const { user } = get();
        if (!user) return false;
        try {
          const offerings = await revenueCatService.getOfferings();
          if (offerings.length === 0) return false;
          const proPackage = offerings[0].availablePackages[0];
          const success = await revenueCatService.purchasePackage(
            proPackage.identifier
          );
          if (success) {
            // Update user in database
            await supabase
              .from("users")
              .update({ is_pro: true })
              .eq("id", user.id);
            // Update local state
            set({ user: { ...user, isPro: true } });
            return true;
          }
          return false;
        } catch (error) {
          console.error("Pro upgrade failed:", error);
          return false;
        }
      },
    }),
    {
      name: "voicepay-auth",
      partialize: (state) => ({
        user: state.user,
        wallet: state.wallet,
        isAuthenticated: state.isAuthenticated,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          
          try {
            const parsed = JSON.parse(str);
            // Convert privateKey array back to Uint8Array if it exists
            if (parsed.state?.wallet?.privateKey && Array.isArray(parsed.state.wallet.privateKey)) {
              parsed.state.wallet.privateKey = new Uint8Array(parsed.state.wallet.privateKey);
            }
            return parsed;
          } catch (error) {
            console.error('Error parsing stored auth data:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            // Convert Uint8Array to regular array for JSON serialization
            const serializable = {
              ...value,
              state: {
                ...value.state,
                wallet: value.state.wallet ? {
                  ...value.state.wallet,
                  privateKey: Array.from(value.state.wallet.privateKey)
                } : null
              }
            };
            localStorage.setItem(name, JSON.stringify(serializable));
          } catch (error) {
            console.error('Error storing auth data:', error);
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);