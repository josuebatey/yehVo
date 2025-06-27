export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp: number
}

class AnalyticsService {
  private events: AnalyticsEvent[] = []
  private isEnabled = true

  track(eventName: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return

    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now()
    }

    this.events.push(event)
    
    // In production, send to analytics service
    console.log('Analytics Event:', event)
  }

  // Common events
  trackVoiceCommand(command: string, success: boolean) {
    this.track('voice_command', { command, success })
  }

  trackTransaction(type: 'send' | 'receive', amount: number) {
    this.track('transaction', { type, amount })
  }

  trackPageView(page: string) {
    this.track('page_view', { page })
  }

  trackError(error: string, context?: string) {
    this.track('error', { error, context })
  }

  trackUserAction(action: string, context?: Record<string, any>) {
    this.track('user_action', { action, ...context })
  }

  // Get analytics data
  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  clearEvents() {
    this.events = []
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }
}

export const analytics = new AnalyticsService()