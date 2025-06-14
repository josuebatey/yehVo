import React, { useState, useEffect } from 'react'
import { Crown, Check, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { revenueCatService } from '@/services/revenuecat'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/hooks/use-toast'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  onUpgrade: () => void
}

export function PaywallModal({ isOpen, onClose, onUpgrade }: PaywallModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [offerings, setOfferings] = useState<any[]>([])
  const { upgradeToProUser } = useAuthStore()
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadOfferings()
    }
  }, [isOpen])

  const loadOfferings = async () => {
    try {
      const data = await revenueCatService.getOfferings()
      setOfferings(data)
    } catch (error) {
      console.error('Failed to load offerings:', error)
    }
  }

  const handleUpgrade = async () => {
    setIsLoading(true)
    
    try {
      const success = await upgradeToProUser()
      
      if (success) {
        toast({
          title: "Upgrade Successful!",
          description: "You now have access to Pro features including unlimited sends."
        })
        onUpgrade()
        onClose()
      } else {
        toast({
          title: "Upgrade Failed",
          description: "There was an issue processing your upgrade. Please try again.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Upgrade Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const proFeatures = [
    "Unlimited voice payments",
    "Higher send limits ($1000+)",
    "Priority customer support",
    "Advanced transaction analytics",
    "Custom voice commands",
    "Enhanced security features"
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
              <Crown className="h-6 w-6 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Upgrade to VoicePay Pro
          </DialogTitle>
          <DialogDescription className="text-center">
            You've reached the $10 limit for free users. Upgrade to Pro for unlimited voice payments.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-2 border-primary">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              <span>Pro Plan</span>
            </CardTitle>
            <CardDescription>
              <span className="text-3xl font-bold">$9.99</span>
              <span className="text-muted-foreground">/month</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {proFeatures.map((feature, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="flex space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Maybe Later
              </Button>
              <Button
                onClick={handleUpgrade}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Cancel anytime. No hidden fees. Secure payment processing.
        </p>
      </DialogContent>
    </Dialog>
  )
}