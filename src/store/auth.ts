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

          // 2. Require email verification
          if (!authData.user.confirmed_at) {
            set({ isLoading: false });
            throw new Error("EMAIL_VERIFICATION_REQUIRED");
          }

          // 3. Remove duplicate user if exists
          const { data: existingUser, error: existingUserError } =
            await supabase
              .from("users")
              .select("*")
              .eq("id", authData.user.id)
              .maybeSingle();
          if (existingUserError) throw existingUserError;
          if (existingUser) {
            const { error: deleteError } = await supabase
              .from("users")
              .delete()
              .eq("id", existingUser.id);
            if (deleteError) throw deleteError;
          }

          // 4. Create Algorand wallet
          const wallet = algorandService.createWallet();

          // 5. Encrypt wallet seed
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

          // 6. Store user data in database
          const { error: dbError } = await supabase.from("users").insert({
            id: authData.user.id,
            email: authData.user.email!,
            algorand_address: wallet.address,
            encrypted_seed: encryptedSeed || wallet.mnemonic,
          });
          if (dbError) throw dbError;

          console.log(authData);

          // 7. Initialize RevenueCat
          await revenueCatService.initialize(authData.user.id);

          // 8. Set state
          set({
            user: {
              id: authData.user.id,
              email: authData.user.email!,
              algorandAddress: wallet.address,
              isPro: false,
              createdAt: authData.user.created_at!,
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

      signIn: async (email, password) => {
        set({ isLoading: true });
        try {
          // 1. Sign in with Supabase Auth
          const { data: authData, error: authError } =
            await supabase.auth.signInWithPassword({ email, password });
          if (authError) throw authError;
          if (!authData.user) throw new Error("Sign in failed");

          // 2. Try to get user data from database
          let { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", authData.user.id)
            .single();

          // 3. If not found, create the user profile
          if (userError && userError.code === "PGRST116") {
            // Create Algorand wallet
            const wallet = algorandService.createWallet();

            // Encrypt wallet seed
            const { data: encryptedSeed, error: encryptError } =
              await supabase.rpc("encrypt_seed", { seed: wallet.mnemonic });
            if (encryptError) {
              console.warn(
                "Seed encryption failed, storing as-is:",
                encryptError
              );
            }

            // Insert user profile
            const { data: insertedUser, error: insertError } = await supabase
              .from("users")
              .insert({
                id: authData.user.id,
                email: authData.user.email!,
                algorand_address: wallet.address,
                encrypted_seed: encryptedSeed || wallet.mnemonic,
              })
              .select()
              .single();
            if (insertError) throw insertError;
            userData = insertedUser;
          } else if (userError) {
            throw userError;
          }

          // 4. Decrypt wallet seed
          let decryptedSeed: string;
          try {
            const { data: seed, error: decryptError } = await supabase.rpc(
              "decrypt_seed",
              { encrypted_seed: userData.encrypted_seed }
            );
            if (decryptError) throw decryptError;
            decryptedSeed = seed;
          } catch (error) {
            console.warn("Seed decryption failed, using as-is:", error);
            decryptedSeed = userData.encrypted_seed;
          }

          // 5. Restore wallet
          const wallet = algorandService.restoreWallet(decryptedSeed);

          // 6. Initialize RevenueCat and check Pro status
          await revenueCatService.initialize(authData.user.id);
          const isPro = await revenueCatService.isProUser();

          // 7. Set state
          set({
            user: {
              id: userData.id,
              email: userData.email,
              algorandAddress: userData.algorand_address,
              isPro: isPro || userData.is_pro,
              createdAt: userData.created_at,
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
            // Get user data from database
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();
            if (userError) throw userError;

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
            await revenueCatService.initialize(session.user.id);
            const isPro = await revenueCatService.isProUser();

            set({
              user: {
                id: userData.id,
                email: userData.email,
                algorandAddress: userData.algorand_address,
                isPro: isPro || userData.is_pro,
                createdAt: userData.created_at,
              },
              wallet,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error("Auth initialization failed:", error);
          set({ isLoading: false });
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
    }
  )
);
