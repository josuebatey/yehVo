import algosdk from 'algosdk'
import { microAlgosToAlgos, algosToMicroAlgos } from '../lib/utils'

const ALGORAND_NODE_URL = import.meta.env.VITE_ALGORAND_NODE_URL
const ALGORAND_INDEXER_URL = import.meta.env.VITE_ALGORAND_INDEXER_URL
const ALGORAND_NODE_TOKEN = import.meta.env.VITE_ALGORAND_NODE_TOKEN || ''

export interface AlgorandWallet {
  address: string
  mnemonic: string
  privateKey: Uint8Array
}

export interface Transaction {
  txHash: string
  amount: number
  sender: string
  receiver: string
  timestamp: number
  type: 'send' | 'receive'
  status: 'pending' | 'confirmed' | 'failed'
}

export interface AlgorandPrice {
  usd: number
  lastUpdated: number
}

class AlgorandService {
  private algodClient: algosdk.Algodv2
  private indexerClient: algosdk.Indexer

  constructor() {
    this.algodClient = new algosdk.Algodv2(ALGORAND_NODE_TOKEN, ALGORAND_NODE_URL, '')
    this.indexerClient = new algosdk.Indexer(ALGORAND_NODE_TOKEN, ALGORAND_INDEXER_URL, '')
  }

  /**
   * Create a new Algorand wallet
   */
  createWallet(): AlgorandWallet {
    const account = algosdk.generateAccount()
    const mnemonic = algosdk.secretKeyToMnemonic(account.sk)
    
    return {
      address: account.addr,
      mnemonic,
      privateKey: account.sk
    }
  }

  /**
   * Restore wallet from mnemonic
   */
  restoreWallet(mnemonic: string): AlgorandWallet {
    const privateKey = algosdk.mnemonicToSecretKey(mnemonic)
    
    return {
      address: privateKey.addr,
      mnemonic,
      privateKey: privateKey.sk
    }
  }

  /**
   * Get account balance in microAlgos
   */
  async getBalance(address: string): Promise<number> {
    try {
      const accountInfo = await this.algodClient.accountInformation(address).do();
      return accountInfo.amount;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get account balance in Algos
   */
  async getBalanceInAlgos(address: string): Promise<number> {
    const microAlgos = await this.getBalance(address)
    return microAlgosToAlgos(microAlgos)
  }

  /**
   * Send payment transaction
   */
  async sendPayment(
    senderPrivateKey: Uint8Array,
    senderAddress: string,
    recipientAddress: string,
    amountMicroAlgos: number,
    note?: string
  ): Promise<string> {
    try {
      // Enhanced input validation
      if (!senderPrivateKey) {
        throw new Error('Sender private key is required')
      }
      
      if (!(senderPrivateKey instanceof Uint8Array)) {
        throw new Error('Sender private key must be a Uint8Array')
      }

      if (!senderAddress || typeof senderAddress !== 'string' || senderAddress.trim().length === 0) {
        throw new Error('Sender address is required and must be a valid string')
      }

      if (!recipientAddress || typeof recipientAddress !== 'string' || recipientAddress.trim().length === 0) {
        throw new Error('Recipient address is required and must be a valid string')
      }

      if (!amountMicroAlgos || typeof amountMicroAlgos !== 'number' || amountMicroAlgos <= 0) {
        throw new Error('Amount must be a positive number')
      }

      // Validate Algorand addresses
      if (!this.isValidAddress(senderAddress.trim())) {
        throw new Error('Invalid sender address format')
      }

      if (!this.isValidAddress(recipientAddress.trim())) {
        throw new Error('Invalid recipient address format')
      }

      // Trim addresses to ensure no whitespace issues
      const cleanSenderAddress = senderAddress.trim()
      const cleanRecipientAddress = recipientAddress.trim()

      console.log('Sending payment with params:', {
        senderAddress: cleanSenderAddress,
        recipientAddress: cleanRecipientAddress,
        amountMicroAlgos,
        privateKeyLength: senderPrivateKey.length
      })

      // Get suggested transaction parameters
      const suggestedParams = await this.algodClient.getTransactionParams().do()

      // Create payment transaction with clean addresses
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: cleanSenderAddress,
        to: cleanRecipientAddress,
        amount: amountMicroAlgos,
        note: note ? new Uint8Array(Buffer.from(note)) : undefined,
        suggestedParams
      })

      // Sign transaction
      const signedTxn = txn.signTxn(senderPrivateKey)

      // Submit transaction
      const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do()

      // Wait for confirmation
      await this.waitForConfirmation(txId)

      return txId
    } catch (error) {
      console.error('Payment error details:', error)
      
      // Provide more specific error messages based on the error type
      if (error instanceof Error) {
        // Check for common Algorand error patterns
        if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient funds to complete the transaction')
        } else if (error.message.includes('invalid address') || error.message.includes('Address must not be null')) {
          throw new Error('Invalid wallet address. Please check your wallet setup.')
        } else if (error.message.includes('network')) {
          throw new Error('Network error: Unable to connect to Algorand network')
        } else if (error.message.includes('timeout')) {
          throw new Error('Transaction timeout: Please try again')
        } else if (error.message.includes('fee')) {
          throw new Error('Transaction fee error: Insufficient funds for fees')
        } else if (error.message.includes('required')) {
          // Re-throw validation errors as-is
          throw error
        } else {
          // Re-throw with the original error message for better debugging
          throw new Error(`Payment failed: ${error.message}`)
        }
      } else {
        throw new Error('Payment failed: Unknown error occurred')
      }
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(txId: string, maxRounds = 10): Promise<void> {
    const status = await this.algodClient.status().do()
    let lastRound = status['last-round']

    for (let i = 0; i < maxRounds; i++) {
      try {
        const pendingInfo = await this.algodClient.pendingTransactionInformation(txId).do()
        
        if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
          return
        }
        
        lastRound++
        await this.algodClient.statusAfterBlock(lastRound).do()
      } catch (error) {
        throw new Error('Transaction confirmation timeout')
      }
    }
    
    throw new Error('Transaction not confirmed within expected rounds')
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(address: string, limit = 10): Promise<Transaction[]> {
    try {
      const response = await this.indexerClient
        .searchForTransactions()
        .address(address)
        .limit(limit)
        .do()

      return response.transactions.map((tx: any) => ({
        txHash: tx.id,
        amount: microAlgosToAlgos(tx['payment-transaction']?.amount || 0),
        sender: tx.sender,
        receiver: tx['payment-transaction']?.receiver || '',
        timestamp: tx['round-time'] * 1000,
        type: tx.sender === address ? 'send' : 'receive',
        status: 'confirmed'
      }))
    } catch (error) {
      return []
    }
  }

  /**
   * Get current Algorand price in USD
   */
  async getAlgorandPrice(): Promise<AlgorandPrice> {
    // MOCKED: Always return a fixed price for development
    return {
      usd: 0.20,
      lastUpdated: Date.now()
    };
    /*
    // Use a public CORS proxy for development
    try {
      const response = await fetch('https://corsproxy.io/?https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd');
      const data = await response.json();
      if (!data || !data.algorand || typeof data.algorand.usd !== 'number') {
        console.error('Unexpected Coingecko response:', data);
        throw new Error('Invalid price data from Coingecko');
      }
      return {
        usd: data.algorand.usd,
        lastUpdated: Date.now()
      }
    } catch (error) {
      console.error('Error getting Algorand price:', error)
      // Fallback price
      return {
        usd: 0.20,
        lastUpdated: Date.now()
      }
    }
    */
  }

  /**
   * Convert USD to microAlgos
   */
  async usdToMicroAlgos(usdAmount: number): Promise<number> {
    const price = await this.getAlgorandPrice()
    const algos = usdAmount / price.usd
    return algosToMicroAlgos(algos)
  }

  /**
   * Convert microAlgos to USD
   */
  async microAlgosToUsd(microAlgos: number): Promise<number> {
    const price = await this.getAlgorandPrice()
    const algos = microAlgosToAlgos(microAlgos)
    return algos * price.usd
  }

  /**
   * Validate Algorand address
   */
  isValidAddress(address: string): boolean {
    try {
      if (!address || typeof address !== 'string') {
        return false
      }
      
      const trimmedAddress = address.trim()
      
      // Check length (Algorand addresses are exactly 58 characters)
      if (trimmedAddress.length !== 58) {
        return false
      }
      
      // Use algosdk validation
      return algosdk.isValidAddress(trimmedAddress)
    } catch {
      return false
    }
  }
}

export const algorandService = new AlgorandService()