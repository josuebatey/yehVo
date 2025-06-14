import React, { useEffect, useState } from 'react'
import { Copy, QrCode, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth'
import { voiceService } from '@/services/voice'
import { formatAddress } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import QRCode from 'qrcode'

export function Receive() {
  const { user, wallet } = useAuthStore()
  const { toast } = useToast()
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    if (wallet?.address) {
      generateQRCode(wallet.address)
    }
  }, [wallet?.address])

  const generateQRCode = async (address: string) => {
    try {
      const url = await QRCode.toDataURL(address, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeUrl(url)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    }
  }

  const handleCopyAddress = async () => {
    if (!wallet?.address) return

    try {
      await navigator.clipboard.writeText(wallet.address)
      toast({
        title: "Address Copied",
        description: "Your Algorand address has been copied to clipboard."
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy address to clipboard.",
        variant: "destructive"
      })
    }
  }

  const handleSpeakAddress = async () => {
    if (!wallet?.address || isSpeaking) return

    setIsSpeaking(true)
    try {
      const formattedAddress = wallet.address
        .split('')
        .join(' ')
        .replace(/(.{8})/g, '$1, ')

      await voiceService.speak(`Your Algorand address is: ${formattedAddress}`)
    } catch (error) {
      toast({
        title: "Speech Failed",
        description: "Failed to speak your address.",
        variant: "destructive"
      })
    } finally {
      setIsSpeaking(false)
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
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Receive Money</h1>
        <p className="text-muted-foreground">
          Share your address or QR code to receive payments
        </p>
      </div>

      {/* QR Code Card */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <QrCode className="h-5 w-5" />
            <span>QR Code</span>
          </CardTitle>
          <CardDescription>
            Scan this QR code to send money to your wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {qrCodeUrl ? (
            <div className="p-4 bg-white rounded-lg">
              <img 
                src={qrCodeUrl} 
                alt="Wallet QR Code" 
                className="w-64 h-64"
              />
            </div>
          ) : (
            <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Generating QR code...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Algorand Address</CardTitle>
          <CardDescription>
            Share this address to receive payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={wallet.address}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyAddress}
              title="Copy address"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleSpeakAddress}
              disabled={isSpeaking}
              title="Speak address"
            >
              <Volume2 className={`h-4 w-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Formatted address:</p>
            <p className="font-mono break-all">
              {formatAddress(wallet.address)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>How to Receive Money</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
              <p>Share your QR code or Algorand address with the sender</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                2
              </div>
              <p>The sender can scan your QR code or enter your address manually</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                3
              </div>
              <p>You'll receive the payment directly to your VoicePay wallet</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                4
              </div>
              <p>Check your dashboard to see incoming transactions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}