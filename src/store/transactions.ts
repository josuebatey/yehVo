import { create } from 'zustand'
import { supabase } from '@/services/supabase'
import { algorandService } from '@/services/algorand'

interface Transaction {
  id: string
  userId: string
  txHash: string
  amountMicroAlgos: number
  amountUsd: number
  recipientAddress: string
  senderAddress: string
  type: 'send' | 'receive'
  status: 'pending' | 'confirmed' | 'failed'
  createdAt: string
  confirmedAt: string | null
}

interface TransactionState {
  transactions: Transaction[]
  balance: number
  balanceUsd: number
  isLoading: boolean
  
  // Actions
  fetchTransactions: (userId: string) => Promise<void>
  fetchBalance: (address: string) => Promise<void>
  sendPayment: (recipientAddress: string, amountUsd: number, privateKey: Uint8Array, userId: string) => Promise<string>
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>
  updateTransactionStatus: (txHash: string, status: Transaction['status']) => Promise<void>
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  balance: 0,
  balanceUsd: 0,
  isLoading: false,

  fetchTransactions: async (userId: string) => {
    set({ isLoading: true })
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const transactions: Transaction[] = data.map(tx => ({
        id: tx.id,
        userId: tx.user_id,
        txHash: tx.tx_hash,
        amountMicroAlgos: tx.amount_micro_algos,
        amountUsd: tx.amount_usd,
        recipientAddress: tx.recipient_address,
        senderAddress: tx.sender_address,
        type: tx.type,
        status: tx.status,
        createdAt: tx.created_at,
        confirmedAt: tx.confirmed_at
      }))

      set({ transactions, isLoading: false })
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      set({ isLoading: false })
    }
  },

  fetchBalance: async (address: string) => {
    try {
      const balanceMicroAlgos = await algorandService.getBalance(address)
      const balance = balanceMicroAlgos / 1_000_000 // Convert to Algos
      const balanceUsd = await algorandService.microAlgosToUsd(balanceMicroAlgos)

      set({ balance, balanceUsd })
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    }
  },

  sendPayment: async (recipientAddress: string, amountUsd: number, privateKey: Uint8Array, userId: string) => {
    try {
      // Convert USD to microAlgos
      const amountMicroAlgos = await algorandService.usdToMicroAlgos(amountUsd)
      
      // Get sender address
      const senderAddress = algorandService.restoreWallet(
        algorandService.restoreWallet(
          Buffer.from(privateKey).toString('hex')
        ).mnemonic
      ).address

      // Send transaction
      const txHash = await algorandService.sendPayment(
        privateKey,
        recipientAddress,
        amountMicroAlgos,
        `VoicePay transfer of $${amountUsd}`
      )

      // Store transaction in database
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          tx_hash: txHash,
          amount_micro_algos: amountMicroAlgos,
          amount_usd: amountUsd,
          recipient_address: recipientAddress,
          sender_address: senderAddress,
          type: 'send',
          status: 'confirmed'
        })

      if (error) {
        console.error('Failed to store transaction:', error)
      }

      // Refresh transactions and balance
      await get().fetchTransactions(userId)
      await get().fetchBalance(senderAddress)

      return txHash
    } catch (error) {
      console.error('Payment failed:', error)
      throw error
    }
  },

  addTransaction: async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: transaction.userId,
          tx_hash: transaction.txHash,
          amount_micro_algos: transaction.amountMicroAlgos,
          amount_usd: transaction.amountUsd,
          recipient_address: transaction.recipientAddress,
          sender_address: transaction.senderAddress,
          type: transaction.type,
          status: transaction.status
        })

      if (error) throw error

      // Refresh transactions
      await get().fetchTransactions(transaction.userId)
    } catch (error) {
      console.error('Failed to add transaction:', error)
      throw error
    }
  },

  updateTransactionStatus: async (txHash: string, status: Transaction['status']) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status,
          confirmed_at: status === 'confirmed' ? new Date().toISOString() : null
        })
        .eq('tx_hash', txHash)

      if (error) throw error

      // Update local state
      set(state => ({
        transactions: state.transactions.map(tx =>
          tx.txHash === txHash 
            ? { ...tx, status, confirmedAt: status === 'confirmed' ? new Date().toISOString() : null }
            : tx
        )
      }))
    } catch (error) {
      console.error('Failed to update transaction status:', error)
      throw error
    }
  }
}))