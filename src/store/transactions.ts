import { create } from 'zustand'
import { supabase } from '../services/supabase'
import { paymentService } from '../services/payment'

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
  userId: string
  senderAddress: string
}

interface TransactionState {
  transactions: Transaction[]
  balance: number
  balanceUsd: number
  isLoading: boolean
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
  addTestFunds: (address: string, amountUsd: number) => Promise<void>
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  balance: 0,
  balanceUsd: 0,
  isLoading: false,
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
      set({ isLoading: false })
    }
  },

  fetchBalance: async (address: string) => {
    try {
      const balance = await paymentService.getBalance(address)
      const balanceUsd = paymentService.coinsToUsd(balance)

      set({ balance, balanceUsd })
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    }
  },

  addTestFunds: async (address: string, amountUsd: number) => {
    try {
      await paymentService.addTestFunds(address, amountUsd)
      
      // Update balance
      await get().fetchBalance(address)
      
      // Add a mock receive transaction
      const txHash = crypto.randomUUID()
      const coins = paymentService.usdToCoins(amountUsd)
      
      // Store in database if user is logged in
      const { currentUserId } = get()
      if (currentUserId) {
        await supabase
          .from('transactions')
          .insert({
            user_id: currentUserId,
            tx_hash: txHash,
            amount_micro_algos: Math.round(coins * 1000000), // Convert to micro units
            amount_usd: amountUsd,
            recipient_address: address,
            sender_address: 'TESTNET_FAUCET_' + crypto.randomUUID().slice(0, 8),
            type: 'receive',
            status: 'confirmed'
          })
        
        // Refresh transactions
        await get().fetchTransactions(currentUserId)
      }
    } catch (error) {
      console.error('Failed to add test funds:', error)
      throw error
    }
  },

  startRealtimeUpdates: (userId: string) => {
    const { subscription } = get()
    
    // Stop existing subscription if any
    if (subscription) {
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
          // Refresh transactions when we get an update
          get().fetchTransactions(userId)
        }
      )
      .subscribe()

    set({ subscription: newSubscription, currentUserId: userId })
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

  sendPayment: async ({recipientAddress, amountUsd, userId, senderAddress}: ISendPayment) => {
    try {
      // Validate inputs
      if (!recipientAddress || typeof recipientAddress !== 'string' || recipientAddress.trim().length === 0) {
        throw new Error('Recipient address is required and must be a valid string')
      }

      if (!amountUsd || typeof amountUsd !== 'number' || amountUsd <= 0) {
        throw new Error('Amount must be a positive number')
      }

      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new Error('User ID is required and must be a valid string')
      }

      if (!senderAddress || typeof senderAddress !== 'string' || senderAddress.trim().length === 0) {
        throw new Error('Sender address is required and must be a valid string')
      }

      // Validate addresses
      const cleanRecipientAddress = recipientAddress.trim()
      const cleanSenderAddress = senderAddress.trim()

      if (!paymentService.isValidAddress(cleanRecipientAddress)) {
        throw new Error('Invalid recipient address format')
      }

      if (!paymentService.isValidAddress(cleanSenderAddress)) {
        throw new Error('Invalid sender address format')
      }

      console.log('Sending payment with validated params:', {
        recipientAddress: cleanRecipientAddress,
        senderAddress: cleanSenderAddress,
        amountUsd,
        userId
      })

      // Send transaction
      const txHash = await paymentService.sendPayment({
        recipientAddress: cleanRecipientAddress,
        amountUsd,
        userId,
        senderAddress: cleanSenderAddress
      })

      // Convert to coins for storage
      const coins = paymentService.usdToCoins(amountUsd)

      // Store transaction in database for sender
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          tx_hash: txHash,
          amount_micro_algos: Math.round(coins * 1000000), // Convert to micro units
          amount_usd: amountUsd,
          recipient_address: cleanRecipientAddress,
          sender_address: cleanSenderAddress,
          type: 'send',
          status: 'confirmed'
        })

      // Look up receiver's user ID by wallet address
      const { data: receiverUser, error: receiverError } = await supabase
        .from('users')
        .select('id')
        .eq('algorand_address', cleanRecipientAddress)
        .maybeSingle();

      // If the receiver is a registered user, insert a transaction for them as well
      if (receiverUser && receiverUser.id) {
        const { error: insertError } = await supabase
          .from('transactions')
          .insert({
            user_id: receiverUser.id,
            tx_hash: txHash,
            amount_micro_algos: Math.round(coins * 1000000),
            amount_usd: amountUsd,
            recipient_address: cleanRecipientAddress,
            sender_address: cleanSenderAddress,
            type: 'receive',
            status: 'confirmed'
          })
        
        if (insertError) {
          console.error('Error inserting receiver transaction:', insertError)
        }
      }

      // Refresh transactions and balance
      await get().fetchTransactions(userId)
      await get().fetchBalance(cleanSenderAddress)

      return txHash
    } catch (error) {
      console.error('Send payment error:', error)
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
      throw error
    }
  }
}))