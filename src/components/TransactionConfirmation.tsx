import React from 'react'
import { CheckCircle, ExternalLink, Copy } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { formatCurrency, formatAddress } from '../lib/utils'
import { useToast } from '../hooks/use-toast'

interface TransactionConfirmationProps {
  txHash: string
  amount: number
  recipient: string
  onClose: () => void
}

export function TransactionConfirmation({ 
  txHash, 
  amount, 
  recipient, 
  onClose 
}: TransactionConfirmationProps) {
  const { toast } = useToast()

  const handleCopyTxHash = async () => {
    try {
      await navigator.clipboard.writeText(txHash)
      toast({
        title: "Transaction ID Copied",
        description: "Transaction hash has been copied to clipboard."
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy transaction hash.",
        variant: "destructive"
      })
    }
  }

  const handleViewOnExplorer = () => {
    const explorerUrl = `https://testnet.algoexplorer.io/tx/${txHash}`
    window.open(explorerUrl, '_blank')
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <CardTitle className="text-green-600">Payment Sent!</CardTitle>
        <CardDescription>
          Your transaction has been successfully processed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-semibold">{formatCurrency(amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">To:</span>
            <span className="font-mono text-sm">{formatAddress(recipient)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Transaction ID:</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm">{formatAddress(txHash)}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyTxHash}
                className="h-6 w-6"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={handleViewOnExplorer}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Explorer
          </Button>
          <Button onClick={onClose} className="flex-1">
            Done
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}