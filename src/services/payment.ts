export interface PaymentWallet {
  id: string
  address: string
  balance: number
  balanceUsd: number
}

export interface Transaction {
  id: string
  userId: string
  txHash: string
  amount: number
  amountUsd: number
  recipientAddress: string
  senderAddress: string
  type: 'send' | 'receive'
  status: 'pending' | 'confirmed' | 'failed'
  createdAt: string
  confirmedAt: string | null
}

export interface SendPaymentParams {
  recipientAddress: string
  amountUsd: number
  userId: string
  senderAddress: string
}

class PaymentService {
  private exchangeRate = 0.25 // Mock exchange rate: 1 COIN = $0.25

  /**
   * Create a new wallet
   */
  createWallet(): PaymentWallet {
    const address = this.generateAddress()
    return {
      id: crypto.randomUUID(),
      address,
      balance: 0,
      balanceUsd: 0
    }
  }

  /**
   * Generate a mock wallet address
   */
  private generateAddress(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let address = ''
    for (let i = 0; i < 58; i++) {
      address += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return address
  }

  /**
   * Validate wallet address format
   */
  isValidAddress(address: string): boolean {
    if (!address || typeof address !== 'string') return false
    return /^[A-Z2-7]{58}$/.test(address.trim())
  }

  /**
   * Get wallet balance (mock implementation)
   */
  async getBalance(address: string): Promise<number> {
    // Mock balance - in real implementation, this would query a blockchain or database
    return Math.floor(Math.random() * 1000000) // Random balance between 0-1M coins
  }

  /**
   * Convert coins to USD
   */
  coinsToUsd(coins: number): number {
    return coins * this.exchangeRate
  }

  /**
   * Convert USD to coins
   */
  usdToCoins(usd: number): number {
    return usd / this.exchangeRate
  }

  /**
   * Send payment (mock implementation)
   */
  async sendPayment(params: SendPaymentParams): Promise<string> {
    const { recipientAddress, amountUsd, userId, senderAddress } = params

    // Validate inputs
    if (!this.isValidAddress(recipientAddress)) {
      throw new Error('Invalid recipient address')
    }

    if (!this.isValidAddress(senderAddress)) {
      throw new Error('Invalid sender address')
    }

    if (amountUsd <= 0) {
      throw new Error('Amount must be positive')
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Generate mock transaction hash
    const txHash = this.generateTransactionHash()

    // Simulate 95% success rate
    if (Math.random() < 0.05) {
      throw new Error('Transaction failed due to network error')
    }

    return txHash
  }

  /**
   * Generate mock transaction hash
   */
  private generateTransactionHash(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let hash = ''
    for (let i = 0; i < 64; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return hash
  }

  /**
   * Get transaction history (mock implementation)
   */
  async getTransactionHistory(address: string, limit = 10): Promise<Transaction[]> {
    // Mock transaction history
    const transactions: Transaction[] = []
    const now = Date.now()

    for (let i = 0; i < Math.min(limit, 5); i++) {
      const isReceive = Math.random() > 0.5
      const amount = Math.floor(Math.random() * 100) + 1
      
      transactions.push({
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        txHash: this.generateTransactionHash(),
        amount,
        amountUsd: this.coinsToUsd(amount),
        recipientAddress: isReceive ? address : this.generateAddress(),
        senderAddress: isReceive ? this.generateAddress() : address,
        type: isReceive ? 'receive' : 'send',
        status: 'confirmed',
        createdAt: new Date(now - i * 24 * 60 * 60 * 1000).toISOString(),
        confirmedAt: new Date(now - i * 24 * 60 * 60 * 1000 + 30000).toISOString()
      })
    }

    return transactions
  }

  /**
   * Get current exchange rate
   */
  getExchangeRate(): number {
    return this.exchangeRate
  }

  /**
   * Add funds to wallet (for testing)
   */
  async addTestFunds(address: string, amountUsd: number): Promise<void> {
    // This would typically interact with a testnet faucet
    console.log(`Added $${amountUsd} test funds to ${address}`)
  }
}

export const paymentService = new PaymentService()