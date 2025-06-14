import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/services/supabase'
import { algorandService, type AlgorandWallet } from '@/services/algorand'
import { revenueCatService } from '@/services/revenuecat'

interface User {
  id: string
  email: string
  algorandAddress: string
  isPro: boolean
  createdAt: string
}

interface AuthState {
  user: User | null
  wallet: AlgorandWallet | null
  isLoading: boolean
  isAuthenticated: boolean
  
  // Actions
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initializeAuth: () => Promise<void>
  upgradeToProUser: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      wallet: null,
      isLoading: false,
      isAuthenticated: false,

      signUp: async (email: string, password: string) => {
        set({ isLoading: true })
        
        try {
          // Create Supabase auth user
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
          })

          if (authError) throw authError
          if (!authData.user) throw new Error('User creation failed')

          // Create Algorand wallet
          const wallet = algorandService.createWallet()

          // Encrypt and store wallet seed
          const { data: encryptedSeed, error: encryptError } = await supabase.rpc('encrypt_seed', {
            seed: wallet.mnemonic
          })

          if (encryptError) {
            console.warn('Seed encryption failed, storing as-is:', encryptError)
          }

          // Store user data in database
          const { error: dbError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: authData.user.email!,
              algorand_address: wallet.address,
              encrypted_seed: encryptedSeed || wallet.mnemonic
            })

          if (dbError) throw dbError

          // Initialize RevenueCat
          await revenueCatService.initialize(authData.user.id)

          const user: User = {
            id: authData.user.id,
            email: authData.user.email!,
            algorandAddress: wallet.address,
            isPro: false,
            createdAt: authData.user.created_at!
          }

          set({ 
            user, 
            wallet, 
            isAuthenticated: true, 
            isLoading: false 
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true })
        
        try {
          // Sign in with Supabase
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
          })

          if (authError) throw authError
          if (!authData.user) throw new Error('Sign in failed')

          // Get user data from database
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .single()

          if (userError) throw userError

          // Decrypt wallet seed
          let decryptedSeed: string
          try {
            const { data: seed, error: decryptError } = await supabase.rpc('decrypt_seed', {
              encrypted_seed: userData.encrypted_seed
            })
            
            if (decryptError) throw decryptError
            decryptedSeed = seed
          } catch (error) {
            console.warn('Seed decryption failed, using as-is:', error)
            decryptedSeed = userData.encrypted_seed
          }

          // Restore wallet
          const wallet = algorandService.restoreWallet(decryptedSeed)

          // Initialize RevenueCat
          await revenueCatService.initialize(authData.user.id)

          // Check Pro status
          const isPro = await revenueCatService.isProUser()

          const user: User = {
            id: userData.id,
            email: userData.email,
            algorandAddress: userData.algorand_address,
            isPro: isPro || userData.is_pro,
            createdAt: userData.created_at
          }

          set({ 
            user, 
            wallet, 
            isAuthenticated: true, 
            isLoading: false 
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      signOut: async () => {
        set({ isLoading: true })
        
        try {
          await supabase.auth.signOut()
          set({ 
            user: null, 
            wallet: null, 
            isAuthenticated: false, 
            isLoading: false 
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      initializeAuth: async () => {
        set({ isLoading: true })
        
        try {
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user) {
            // Get user data from database
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (userError) throw userError

            // Decrypt wallet seed
            let decryptedSeed: string
            try {
              const { data: seed, error: decryptError } = await supabase.rpc('decrypt_seed', {
                encrypted_seed: userData.encrypted_seed
              })
              
              if (decryptError) throw decryptError
              decryptedSeed = seed
            } catch (error) {
              console.warn('Seed decryption failed, using as-is:', error)
              decryptedSeed = userData.encrypted_seed
            }

            // Restore wallet
            const wallet = algorandService.restoreWallet(decryptedSeed)

            // Initialize RevenueCat
            await revenueCatService.initialize(session.user.id)

            // Check Pro status
            const isPro = await revenueCatService.isProUser()

            const user: User = {
              id: userData.id,
              email: userData.email,
              algorandAddress: userData.algorand_address,
              isPro: isPro || userData.is_pro,
              createdAt: userData.created_at
            }

            set({ 
              user, 
              wallet, 
              isAuthenticated: true, 
              isLoading: false 
            })
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          console.error('Auth initialization failed:', error)
          set({ isLoading: false })
        }
      },

      upgradeToProUser: async () => {
        const { user } = get()
        if (!user) return false

        try {
          const offerings = await revenueCatService.getOfferings()
          if (offerings.length === 0) return false

          const proPackage = offerings[0].availablePackages[0]
          const success = await revenueCatService.purchasePackage(proPackage.identifier)

          if (success) {
            // Update user in database
            await supabase
              .from('users')
              .update({ is_pro: true })
              .eq('id', user.id)

            // Update local state
            set({ 
              user: { ...user, isPro: true }
            })

            return true
          }

          return false
        } catch (error) {
          console.error('Pro upgrade failed:', error)
          return false
        }
      }
    }),
    {
      name: 'voicepay-auth',
      partialize: (state) => ({
        user: state.user,
        wallet: state.wallet,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)