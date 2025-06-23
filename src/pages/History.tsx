import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { History as HistoryIcon, ArrowLeft, Send, TrendingUp, Info } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { useTransactionStore } from '../store/transactions'
import { formatCurrency, formatDate, formatAddress } from '../lib/utils'

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Sent', value: 'send' },
  { label: 'Received', value: 'receive' },
]

export function History() {
  const navigate = useNavigate()
  const { user, wallet } = useAuthStore()
  const { transactions, isLoading } = useTransactionStore()
  const [filter, setFilter] = useState<'all' | 'send' | 'receive'>('all')

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

  const filteredTxs = filter === 'all' ? transactions : transactions.filter(tx => tx.type === filter)

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-2 sm:p-4 bg-background">
      <div className="w-full max-w-3xl space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2 sm:mb-4 gap-2 sm:gap-0">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} aria-label="Back to Dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center space-x-2">
              <HistoryIcon className="h-6 w-6 text-primary" />
              <span>Transaction History</span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">View all your sent and received transactions</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-2">
          {FILTERS.map(tab => (
            <Button
              key={tab.value}
              variant={filter === tab.value ? 'default' : 'outline'}
              className="rounded-full px-3 py-1 text-xs sm:px-4 sm:py-1.5 sm:text-sm"
              onClick={() => setFilter(tab.value as any)}
              aria-pressed={filter === tab.value}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-primary" />
              <span>{filter === 'all' ? 'All Transactions' : filter === 'send' ? 'Sent' : 'Received'}</span>
            </CardTitle>
            <CardDescription>Your complete transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Loading transactions...</p>
              </div>
            ) : filteredTxs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Info className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground font-medium">No {filter === 'all' ? '' : filter + ' '}transactions yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Start by sending or receiving money.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="min-w-[500px] w-full text-xs sm:text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-2 px-2 whitespace-nowrap">Type</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">Amount</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">To/From</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">Date</th>
                      <th className="text-left py-2 px-2 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxs.map((tx) => (
                      <tr key={tx.id || tx.txHash} className="hover:bg-accent/40 transition-colors">
                        <td className="py-2 px-2 capitalize flex items-center gap-1">
                          {tx.type === 'send' ? (
                            <Send className="h-4 w-4 text-red-500" aria-label="Sent" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-green-600" aria-label="Received" />
                          )}
                          <span className={tx.type === 'send' ? 'text-red-600' : 'text-green-600'}>
                            {tx.type === 'send' ? 'Sent' : 'Received'}
                          </span>
                        </td>
                        <td className={
                          'py-2 px-2 font-semibold ' +
                          (tx.type === 'send' ? 'text-red-600' : 'text-green-600')
                        }>
                          {tx.type === 'send' ? '-' : '+'}{formatCurrency(tx.amountUsd)}
                        </td>
                        <td className="py-2 px-2">
                          <span
                            className="font-mono cursor-pointer underline decoration-dotted"
                            title={tx.type === 'send' ? tx.recipientAddress : tx.senderAddress}
                          >
                            {formatAddress(tx.type === 'send' ? tx.recipientAddress : tx.senderAddress)}
                          </span>
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">{formatDate(new Date(tx.createdAt))}</td>
                        <td className="py-2 px-2">
                          <span className={
                            'inline-block rounded-full px-2 py-0.5 text-xs font-medium ' +
                            (tx.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : tx.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-700')
                          }>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 