import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
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