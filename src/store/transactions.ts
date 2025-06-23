import { create } from 'zustand'
import { supabase } from '../services/supabase'
import { algorandService } from '../services/algorand'

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

interface ISendPayment {
  recipientAddress: string
  amountUsd: number
  privateKey: Uint8Array
  userId: string
  senderAddress: string
}

interface TransactionState {
  transactions: Transaction[]
  balance: number
  balanceUsd: number
  isLoading: boolean
  wallet: any // Assuming wallet is stored in the state
  currentUserId: string | null
  subscription: any | null
  pollingInterval: NodeJS.Timeout | null
  
  // Actions
  fetchTransactions: (userId: string) => Promise<void>
  fetchBalance: (address: string) => Promise<void>
  sendPayment: (sendPayment: ISendPayment) => Promise<string>
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>
  updateTransactionStatus: (txHash: string, status: Transaction['status']) => Promise<void>
  startRealtimeUpdates: (userId: string) => void
  stopRealtimeUpdates: () => void
  startPolling: (userId: string, address: string) => void
  stopPolling: () => void
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  balance: 0,
  balanceUsd: 0,
  isLoading: false,
  wallet: null,
  currentUserId: null,
  subscription: null,
  pollingInterval: null,

  fetchTransactions: async (userId: string) => {
    set({ isLoading: true })
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      console.log("Transaction DATA", data);

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

      console.log('Fetching transactions for user:', userId);

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

  startRealtimeUpdates: (userId: string) => {
    const { subscription } = get()
    
    console.log('Starting real-time updates for user:', userId)
    
    // Stop existing subscription if any
    if (subscription) {
      console.log('Stopping existing subscription')
      subscription.unsubscribe()
    }

    // Start new subscription
    const newSubscription = supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Real-time transaction update received:', payload)
          console.log('Payload event type:', payload.eventType)
          console.log('Payload new record:', payload.new)
          
          // Refresh transactions when we get an update
          get().fetchTransactions(userId)
          
          // Also refresh balance if we have a wallet
          const { wallet } = get()
          if (wallet?.address) {
            get().fetchBalance(wallet.address)
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status)
      })

    set({ subscription: newSubscription, currentUserId: userId })
    console.log('Real-time subscription started for user:', userId)
  },

  stopRealtimeUpdates: () => {
    const { subscription } = get()
    if (subscription) {
      subscription.unsubscribe()
      set({ subscription: null, currentUserId: null })
    }
  },

  startPolling: (userId: string, address: string) => {
    // Stop existing polling if any
    get().stopPolling()
    
    // Start polling every 10 seconds
    const interval = setInterval(async () => {
      await get().fetchTransactions(userId)
      await get().fetchBalance(address)
    }, 10000) // 10 seconds

    set({ pollingInterval: interval })
  },

  stopPolling: () => {
    const { pollingInterval } = get()
    if (pollingInterval) {
      clearInterval(pollingInterval)
      set({ pollingInterval: null })
    }
  },

  sendPayment: async ({recipientAddress, amountUsd, privateKey, userId, senderAddress}: ISendPayment) => {
    try {
      // Convert USD to microAlgos
      const amountMicroAlgos = await algorandService.usdToMicroAlgos(amountUsd)
      
      // Send transaction
      const txHash = await algorandService.sendPayment(
        privateKey,
        recipientAddress,
        amountMicroAlgos,
        `VoicePay transfer of $${amountUsd}`
      )

      // Store transaction in database for sender
      const { error: senderInsertError } = await supabase
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

      if (senderInsertError) {
        console.error('Failed to store sender transaction:', senderInsertError)
      } else {
        console.log('Sender transaction inserted successfully')
      }

      // Look up receiver's user ID by Algorand address
      console.log('Looking up receiver user for address:', recipientAddress)
      const { data: receiverUser, error: receiverLookupError } = await supabase
        .from('users')
        .select('id')
        .eq('algorand_address', recipientAddress)
        .maybeSingle();
      
      if (receiverLookupError) {
        console.error('Failed to look up receiver user:', receiverLookupError)
      } else if (receiverUser && receiverUser.id) {
        // Store transaction in database for receiver
        const { error: receiverInsertError } = await supabase
          .from('transactions')
          .insert({
            user_id: receiverUser.id,
            tx_hash: txHash,
            amount_micro_algos: amountMicroAlgos,
            amount_usd: amountUsd,
            recipient_address: recipientAddress,
            sender_address: senderAddress,
            type: 'receive',
            status: 'confirmed'
          })
        if (receiverInsertError) {
          console.error('Failed to store receiver transaction:', receiverInsertError)
        } else {
          console.log('Receiver transaction inserted successfully for user:', receiverUser.id)
        }
      } else {
        console.warn('No receiver user found for address:', recipientAddress, '. The receiver will not see this transaction in their history.')
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