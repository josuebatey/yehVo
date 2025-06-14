import algosdk from 'algosdk'
import { microAlgosToAlgos, algosToMicroAlgos } from '@/lib/utils'

const ALGORAND_NODE_URL = import.meta.env.VITE_ALGORAND_NODE_URL || 'https://testnet-api.algonode.cloud'
const ALGORAND_INDEXER_URL = import.meta.env.VITE_ALGORAND_INDEXER_URL || 'https://testnet-idx.algonode.cloud'
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
      const accountInfo = await this.algodClient.accountInformation(address).do()
      return accountInfo.amount
    } catch (error) {
      console.error('Error getting balance:', error)
      return 0
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
    recipientAddress: string,
    amountMicroAlgos: number,
    note?: string
  ): Promise<string> {
    try {
      const senderAccount = algosdk.mnemonicToSecretKey(
        algosdk.secretKeyToMnemonic(senderPrivateKey)
      )

      // Get suggested transaction parameters
      const suggestedParams = await this.algodClient.getTransactionParams().do()

      // Create payment transaction
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAccount.addr,
        to: recipientAddress,
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
      console.error('Error sending payment:', error)
      throw new Error('Failed to send payment')
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
        console.error('Error waiting for confirmation:', error)
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
      console.error('Error getting transaction history:', error)
      return []
    }
  }

  /**
   * Get current Algorand price in USD
   */
  async getAlgorandPrice(): Promise<AlgorandPrice> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd')
      const data = await response.json()
      
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
      return algosdk.isValidAddress(address)
    } catch {
      return false
    }
  }
}

export const algorandService = new AlgorandService()