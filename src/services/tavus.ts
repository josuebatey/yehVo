interface TavusConversation {
  conversationId: string
  status: 'active' | 'ended'
}

interface TavusMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

class TavusService {
  private apiKey: string
  private baseUrl = 'https://tavusapi.com/v2'

  constructor() {
    this.apiKey = import.meta.env.VITE_TAVUS_API_KEY || ''
  }

  async createConversation(replicaId: string): Promise<TavusConversation> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({
          replica_id: replicaId,
          persona_id: 'default'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create conversation')
      }

      const data = await response.json()
      return {
        conversationId: data.conversation_id,
        status: 'active'
      }
    } catch (error) {
      console.error('Tavus conversation creation failed:', error)
      throw error
    }
  }

  async sendMessage(conversationId: string, message: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        body: JSON.stringify({
          message
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      return data.response
    } catch (error) {
      console.error('Tavus message failed:', error)
      throw error
    }
  }

  async getConversationUrl(conversationId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/url`, {
        headers: {
          'x-api-key': this.apiKey
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get conversation URL')
      }

      const data = await response.json()
      return data.conversation_url
    } catch (error) {
      console.error('Failed to get Tavus URL:', error)
      throw error
    }
  }

  async endConversation(conversationId: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/conversations/${conversationId}/end`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey
        }
      })
    } catch (error) {
      console.error('Failed to end conversation:', error)
    }
  }

  // Mock implementation for demo purposes
  async mockFinancialQuery(query: string, userBalance: number, recentTransactions: any[]): Promise<string> {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes('balance')) {
      return `Your current balance is $${userBalance.toFixed(2)}. You're doing great with your savings!`
    }

    if (lowerQuery.includes('spend') || lowerQuery.includes('spent')) {
      const totalSpent = recentTransactions
        .filter(tx => tx.type === 'send')
        .reduce((sum, tx) => sum + tx.amount_usd, 0)

      if (lowerQuery.includes('week')) {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        const weeklySpent = recentTransactions
          .filter(tx => tx.type === 'send' && new Date(tx.created_at).getTime() > weekAgo)
          .reduce((sum, tx) => sum + tx.amount_usd, 0)
        
        return `You've spent $${weeklySpent.toFixed(2)} this week. ${weeklySpent > 50 ? 'Consider tracking your expenses more closely.' : 'Great job staying within budget!'}`
      }

      return `Your total spending is $${totalSpent.toFixed(2)}. ${totalSpent > 100 ? 'You might want to review your spending habits.' : 'You\'re managing your money well!'}`
    }

    if (lowerQuery.includes('transaction') || lowerQuery.includes('payment')) {
      const recentCount = recentTransactions.length
      return `You have ${recentCount} recent transactions. Your most recent was ${recentTransactions[0] ? `a ${recentTransactions[0].type} of $${recentTransactions[0].amount_usd.toFixed(2)}` : 'none yet'}.`
    }

    return "I can help you with questions about your balance, spending, and transaction history. What would you like to know?"
  }
}

export const tavusService = new TavusService()