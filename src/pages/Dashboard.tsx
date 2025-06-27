import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, Send, QrCode, History, TrendingUp, Crown, RefreshCw, Bell, Copy, Settings } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { VoiceButton } from '../components/VoiceButton'
import { PaywallModal } from '../components/PaywallModal'
import { TavusAvatar } from '../components/TavusAvatar'
import { SecuritySettings } from '../components/SecuritySettings'
import { VoiceVisualizer } from '../components/VoiceVisualizer'
import { TransactionConfirmation } from '../components/TransactionConfirmation'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useAuthStore } from '../store/auth'
import { useTransactionStore } from '../store/transactions'
import { voiceService, type VoiceCommand } from '../services/voice'
import { formatCurrency, formatDate, formatAddress } from '../lib/utils'
import { useToast } from '../hooks/use-toast'
import { QuickActionsPill } from '../components/QuickActionsPill'

export function Dashboard() {
  const navigate = useNavigate()
  const { user, wallet } = useAuthStore()
  const { 
    transactions, 
    balance, 
    balanceUsd, 
    fetchTransactions, 
    fetchBalance,
    sendPayment,
    startRealtimeUpdates,
    stopRealtimeUpdates,
    startPolling,
    stopPolling,
    isLoading
  } = useTransactionStore()
  const { toast } = useToast()
  
  const [showPaywall, setShowPaywall] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [lastTransactionCount, setLastTransactionCount] = useState(0)
  const [newReceivedCount, setNewReceivedCount] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<any>(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (user && wallet) {
      fetchTransactions(user.id)
      fetchBalance(wallet.address)
      
      // Start real-time updates
      startRealtimeUpdates(user.id)
      
      // Also start polling as a fallback (every 10 seconds)
      startPolling(user.id, wallet.address)
    }

    // Cleanup function
    return () => {
      stopRealtimeUpdates()
      stopPolling()
    }
  }, [user, wallet, navigate, fetchTransactions, fetchBalance, startRealtimeUpdates, stopRealtimeUpdates, startPolling, stopPolling])

  // Check for new transactions and show notifications
  useEffect(() => {
    if (transactions.length > lastTransactionCount && lastTransactionCount > 0) {
      const newTransactions = transactions.slice(0, transactions.length - lastTransactionCount)
      const receivedTransactions = newTransactions.filter(tx => tx.type === 'receive')
      if (receivedTransactions.length > 0) {
        setNewReceivedCount(prev => prev + receivedTransactions.length)
      }
      receivedTransactions.forEach(tx => {
        toast({
          title: "Payment Received! 💰",
          description: `You received ${formatCurrency(tx.amountUsd)} from ${formatAddress(tx.senderAddress)}`,
        })
        voiceService.speak(`You received ${formatCurrency(tx.amountUsd)}!`)
      })
    }
    setLastTransactionCount(transactions.length)
  }, [transactions, lastTransactionCount, toast, newReceivedCount])

  const handleRefresh = async () => {
    if (user && wallet) {
      await fetchTransactions(user.id)
      await fetchBalance(wallet.address)
      setNewReceivedCount(0) // Clear notification count
      toast({
        title: "Refreshed!",
        description: "Transaction history and balance updated.",
      })
    }
  }

  const handleVoiceCommand = async (command: VoiceCommand) => {
    setIsListening(false)
    try {
      switch (command.action) {
        case 'send':
          if (command.amount && command.recipient) {
            await handleSendPayment(command.recipient, command.amount)
          } else {
            await voiceService.speak("I need both an amount and recipient to send money. Try saying 'send 5 dollars to Alice'.")
          }
          break

        case 'balance':
          await voiceService.speak(`Your current balance is ${formatCurrency(balanceUsd)}.`)
          break

        case 'history':
          const recentTx = transactions[0]
          if (recentTx) {
            await voiceService.speak(`Your most recent transaction was a ${recentTx.type} of ${formatCurrency(recentTx.amountUsd)} on ${formatDate(new Date(recentTx.createdAt))}.`)
          } else {
            await voiceService.speak("You don't have any transactions yet.")
          }
          break

        case 'receive':
          navigate('/receive')
          await voiceService.speak("Opening your receive page where you can share your address.")
          break

        default:
          await voiceService.speak("I didn't understand that command. Try asking about your balance, sending money, or viewing your transaction history.")
      }
    } catch (error) {
      console.error('Voice command error:', error)
      await voiceService.speak("Sorry, I encountered an error processing that command.")
    }
  }

  const handleSendPayment = async (recipient: string, amountUsd: number) => {
    if (!user || !wallet) return

    // Check if user needs to upgrade for amounts over $10
    if (!user.isPro && amountUsd > 10) {
      setShowPaywall(true)
      await voiceService.speak("You've reached the 10 dollar limit for free users. Please upgrade to Pro to send larger amounts.")
      return
    }

    setIsProcessingPayment(true)

    try {
      await voiceService.speak(`Sending ${formatCurrency(amountUsd)} to ${recipient}. Please wait...`)

      // For demo purposes, we'll use a mock recipient address
      // In a real app, you'd resolve the recipient name to an address
      const recipientAddress = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

      const txHash = await sendPayment({
        recipientAddress,
        amountUsd,
        privateKey: wallet.privateKey,
        userId: user.id,
        senderAddress: wallet.address
      })

      setLastTransaction({
        txHash,
        amount: amountUsd,
        recipient: recipientAddress
      })
      setShowConfirmation(true)

      await voiceService.speak(`Payment successful! I've sent ${formatCurrency(amountUsd)} to ${recipient}. The transaction ID is ${txHash.slice(0, 8)}.`)
    } catch (error) {
      console.error('Payment failed:', error)
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive"
      })
      await voiceService.speak("Sorry, the payment failed. Please check your balance and try again.")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  if (!user || !wallet) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading your wallet..." />
      </div>
    )
  }

  if (showConfirmation && lastTransaction) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <TransactionConfirmation
          txHash={lastTransaction.txHash}
          amount={lastTransaction.amount}
          recipient={lastTransaction.recipient}
          onClose={() => setShowConfirmation(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.email}
            {user.isPro && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <Crown className="h-3 w-3 mr-1" />
                Pro
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {newReceivedCount > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <Bell className="h-4 w-4" />
              </Button>
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {newReceivedCount}
              </div>
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <SecuritySettings />
          <VoiceButton 
            onCommand={handleVoiceCommand}
            disabled={isProcessingPayment}
          />
        </div>
      </div>

      {/* Voice Visualizer */}
      {isListening && (
        <div className="flex justify-center">
          <VoiceVisualizer isListening={isListening} />
        </div>
      )}

      {/* Balance Card as Golden Debit Card */}
      <div className="w-full flex justify-center ">
        <div
          className=" relative w-full max-w-md aspect-[16/9] rounded-2xl shadow-xl flex flex-col justify-between p-4 sm:p-6 sm:pb-10 bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-600 dark:from-yellow-500 dark:via-yellow-400 dark:to-yellow-700 text-yellow-900 dark:text-yellow-900 min-w-0"
          style={{ backgroundImage: 'linear-gradient(135deg, #FFD700 0%, #FFF7AE 60%, #B8860B 100%)' }}
        >
          {/* Motif: subtle lines or watermark */}
          <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" viewBox="0 0 400 225" fill="none">
            <defs>
              <linearGradient id="goldLines" x1="0" y1="0" x2="400" y2="225" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fff" stopOpacity="0.2" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="400" height="225" fill="url(#goldLines)" />
            <path d="M20 40 Q200 100 380 40" stroke="#fff" strokeOpacity="0.15" strokeWidth="8" fill="none" />
            <circle cx="320" cy="180" r="40" fill="#fff" fillOpacity="0.07" />
          </svg>
          {/* Top Row: Chip/Icon and Badge */}
          <div className="flex items-center justify-between z-10 ">
            {/* Chip Icon */}
            <div className="flex items-center">
              <svg width="36" height="24" viewBox="0 0 36 24" fill="none" className="mr-2">
                <rect x="2" y="4" width="32" height="16" rx="4" fill="#fff" fillOpacity="0.7" />
                <rect x="8" y="8" width="20" height="8" rx="2" fill="#FFD700" fillOpacity="0.7" />
              </svg>
              <span className="font-semibold text-lg tracking-wide">VoicePay</span>
            </div>
            {/* Debit Badge */}
            <span className="px-3 py-1 rounded-full bg-yellow-900/80 text-yellow-100 text-xs font-bold tracking-widest shadow">DEBIT</span>
          </div>
          {/* Center: Balance */}
          <div className="flex-1 flex flex-col justify-center items-start z-10 mt-6 mb-2 ">
            <div className="text-4xl font-extrabold tracking-tight mb-1 drop-shadow-sm">{formatCurrency(balanceUsd)}</div>
            <div className="text-base font-medium text-yellow-900/80 dark:text-yellow-900/90 mb-2">{balance.toFixed(6)} ALGO</div>
          </div>
          {/* Bottom: Card Number (wallet address) */}
          <div className="flex items-center justify-between z-10 min-w-0">
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center min-w-0">
                <span className="border text-xs font-mono tracking-widest text-yellow-900/70 dark:text-yellow-900/80 break-all min-w-0">
                  {wallet?.address ? formatAddress(wallet.address) : 'Loading...'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="p-1 text-yellow-900/70 hover:text-yellow-900/100"
                  aria-label="Copy address"
                  onClick={async () => {
                    if (wallet?.address) {
                      await navigator.clipboard.writeText(wallet.address)
                      toast({
                        title: 'Address Copied',
                        description: 'Your Algorand address has been copied to clipboard.'
                      })
                    }
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <span className="text-xs text-yellow-900/60 break-words">Card Number</span>
            </div>
            <Wallet className="h-7 w-7 text-yellow-900/80 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActionsPill className="mb-8" />

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Recent Transactions</span>
          </CardTitle>
          <CardDescription>
            Your last 5 transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner text="Loading transactions..." />
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id}  className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      tx.type === 'send' 
                        ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' 
                        : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                    }`}>
                      {tx.type === 'send' ? (
                        <Send className="h-4 w-4" />
                      ) : (
                        <TrendingUp className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {tx.type === 'send' ? 'Sent' : 'Received'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(new Date(tx.createdAt))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      tx.type === 'send' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {tx.type === 'send' ? '-' : '+'}{formatCurrency(tx.amountUsd)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatAddress(tx.type === 'send' ? tx.recipientAddress : tx.senderAddress)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Start by sending or receiving money</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={() => {
          // Refresh user data after upgrade
          window.location.reload()
        }}
      />

      {/* Tavus Avatar */}
      <TavusAvatar />
    </div>
  )
}