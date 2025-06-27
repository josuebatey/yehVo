import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const { toast } = useToast()

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast({
        title: "Connection Restored",
        description: "You're back online!",
      })
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast({
        title: "Connection Lost",
        description: "You're currently offline. Some features may not work.",
        variant: "destructive"
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [toast])

  if (isOnline) return null

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-destructive text-destructive-foreground p-2">
      <div className="container flex items-center justify-center space-x-2">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">You're offline</span>
      </div>
    </div>
  )
}