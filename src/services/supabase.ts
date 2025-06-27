import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Enhanced error checking for development
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[SET]' : '[MISSING]')
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Check for placeholder values
if (supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('your-anon-key')) {
  console.error('Supabase environment variables contain placeholder values.')
  console.error('Please update your .env file with actual Supabase credentials.')
  console.error('Visit https://supabase.com to create a project and get your credentials.')
  throw new Error('Supabase environment variables contain placeholder values. Please update your .env file with actual credentials.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          algorand_address: string
          encrypted_seed: string
          total_sent: number
          total_received: number
          is_pro: boolean
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          updated_at?: string
          algorand_address: string
          encrypted_seed: string
          total_sent?: number
          total_received?: number
          is_pro?: boolean
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          algorand_address?: string
          encrypted_seed?: string
          total_sent?: number
          total_received?: number
          is_pro?: boolean
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          tx_hash: string
          amount_micro_algos: number
          amount_usd: number
          recipient_address: string
          sender_address: string
          type: 'send' | 'receive'
          status: 'pending' | 'confirmed' | 'failed'
          created_at: string
          confirmed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          tx_hash: string
          amount_micro_algos: number
          amount_usd: number
          recipient_address: string
          sender_address: string
          type: 'send' | 'receive'
          status?: 'pending' | 'confirmed' | 'failed'
          created_at?: string
          confirmed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          tx_hash?: string
          amount_micro_algos?: number
          amount_usd?: number
          recipient_address?: string
          sender_address?: string
          type?: 'send' | 'receive'
          status?: 'pending' | 'confirmed' | 'failed'
          created_at?: string
          confirmed_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}