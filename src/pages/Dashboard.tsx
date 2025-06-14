import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, Send, QrCode, History, TrendingUp, Crown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { VoiceButton } from '@/components/VoiceButton'
import { PaywallModal } from '@/components/PaywallModal'
import { TavusAvatar } from '@/components/TavusAvatar'
import { useAuthStore } from '@/store/auth'
import { useTransactionStore } from '@/store/transactions'
import { voiceService, type VoiceCommand } from '@/services/voice'
import { formatCurrency, formatDate, formatAddress } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export function Dashboard() {
  const navigate = useNavigate()
  const { user, wallet } = useAuthStore()
  const { 
    transactions, 
    balance, 
    balanceUsd, 
    fetchTransactions, 
    fetchBalance,
    sendPayment 
  } = useTransactionStore()
  const { toast } = useToast()
  
  const [showPaywall, setShowPaywall] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    if (user && wallet) {
      fetchTransactions(user.id)
      fetchBalance(wallet.address)
    }
  }, [user, wallet, navigate, fetchTransactions, fetchBalance])

  const handleVoiceCommand = async (command: VoiceCommand) => {
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

      const txHash = await sendPayment(recipientAddress, amountUsd, wallet.privateKey, user.id)

      toast({
        title: "Payment Sent!",
        description: `Successfully sent ${formatCurrency(amountUsd)} to ${recipient}`
      })

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your wallet...</p>
        </div>
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
        <VoiceButton 
          onCommand={handleVoiceCommand}
          disabled={isProcessingPayment}
        />
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-5 w-5" />
            <span>Your Balance</span>
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            {formatAddress(wallet.address)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-3xl font-bold">{formatCurrency(balanceUsd)}</div>
            <div className="text-sm text-primary-foreground/80">
              {balance.toFixed(6)} ALGO
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/send')}
          className="h-20 flex-col space-y-2"
        >
          <Send className="h-6 w-6" />
          <span>Send Money</span>
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/receive')}
          className="h-20 flex-col space-y-2"
        >
          <QrCode className="h-6 w-6" />
          <span>Receive Money</span>
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate('/history')}
          className="h-20 flex-col space-y-2"
        >
          <History className="h-6 w-6" />
          <span>Transaction History</span>
        </Button>
      </div>

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
          {transactions.length > 0 ? (
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