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
   * Derive address from private key
   */
  private deriveAddressFromPrivateKey(privateKey: Uint8Array): string {
    try {
      // Extract the public key from the private key (last 32 bytes)
      const publicKey = privateKey.slice(32, 64)
      return algosdk.encodeAddress(publicKey)
    } catch (error) {
      throw new Error('Failed to derive address from private key')
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
      // Validate private key
      if (!senderPrivateKey || !(senderPrivateKey instanceof Uint8Array)) {
        throw new Error('Invalid private key: must be a Uint8Array')
      }

      if (senderPrivateKey.length !== 64) {
        throw new Error('Invalid private key: must be 64 bytes long')
      }

      // Derive the authoritative sender address from the private key
      const derivedSenderAddress = this.deriveAddressFromPrivateKey(senderPrivateKey)

      // Validate the derived address
      if (!this.isValidAddress(derivedSenderAddress)) {
        throw new Error('Failed to derive valid sender address from private key')
      }

      // If senderAddress is provided, verify it matches the derived address
      if (senderAddress && senderAddress.trim() !== derivedSenderAddress) {
        console.warn('Provided sender address does not match derived address, using derived address')
      }

      // Validate recipient address
      if (!recipientAddress || typeof recipientAddress !== 'string' || recipientAddress.trim().length === 0) {
        throw new Error('Recipient address is required and must be a valid string')
      }

      const cleanRecipientAddress = recipientAddress.trim()
      if (!this.isValidAddress(cleanRecipientAddress)) {
        throw new Error(`Invalid recipient address format: ${cleanRecipientAddress}`)
      }

      // Validate amount
      if (!amountMicroAlgos || typeof amountMicroAlgos !== 'number' || amountMicroAlgos <= 0) {
        throw new Error('Amount must be a positive number')
      }

      console.log('Sending payment with validated params:', {
        senderAddress: derivedSenderAddress,
        recipientAddress: cleanRecipientAddress,
        amountMicroAlgos
      })

      // Get suggested transaction parameters
      const suggestedParams = await this.algodClient.getTransactionParams().do()

      // Create payment transaction using the derived sender address
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: derivedSenderAddress,
        to: cleanRecipientAddress,
        amount: amountMicroAlgos,
        note: note ? new TextEncoder().encode(note) : undefined,
        suggestedParams
      })

      // Sign transaction
      const signedTxn = txn.signTxn(senderPrivateKey)

      // Submit transaction
      const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do()

      // Wait for confirmation
      await this.waitForConfirmation(txId)

      console.log('Payment successful:', {
        txId,
        from: derivedSenderAddress,
        to: cleanRecipientAddress,
        amount: amountMicroAlgos
      })

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
        } else if (error.message.includes('private key') || error.message.includes('derive')) {
          // Re-throw private key and derivation errors as-is
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
      
      // Check character set (Algorand uses base32 encoding)
      const validChars = /^[A-Z2-7]+$/
      if (!validChars.test(trimmedAddress)) {
        return false
      }
      
      // Use algosdk validation as final check
      return algosdk.isValidAddress(trimmedAddress)
    } catch (error) {
      console.error('Address validation error:', error)
      return false
    }
  }
}

export const algorandService = new AlgorandService()