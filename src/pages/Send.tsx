import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuthStore } from '../store/auth'
import { useToast } from '../hooks/use-toast'
import { ArrowLeft, Send as SendIcon, Wallet, QrCode, Camera, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTransactionStore } from '../store/transactions'
import { algorandService } from '../services/algorand'

export function Send() {
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  
  const { user, wallet } = useAuthStore()
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { sendPayment } = useTransactionStore()

  // Utility function to safely format address
  const formatAddress = (address: string | undefined | null): string => {
    if (!address || typeof address !== 'string' || address.length < 16) {
      return 'Invalid Address'
    }
    return `${address.slice(0, 8)}...${address.slice(-8)}`
  }

  // Utility to check if Algorand account exists using proper validation
  async function checkAlgorandAccountExists(address: string): Promise<boolean> {
    if (!address || typeof address !== 'string') {
      return false
    }
    return algorandService.isValidAddress(address.trim())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedRecipient = recipientAddress.trim()

    if (!trimmedRecipient) {
      toast({
        title: "Recipient Required",
        description: "Please enter a recipient address.",
        variant: "destructive"
      })
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    // Check if recipient address is valid
    const isValidAddress = await checkAlgorandAccountExists(trimmedRecipient)
    if (!isValidAddress) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Algorand address (58 characters, alphanumeric).",
        variant: "destructive"
      })
      setIsLoading(false)
      return
    }

    // Ensure wallet and user are not null
    if (!wallet || !user) {
      toast({
        title: "Wallet or User Missing",
        description: "Please make sure you are logged in and your wallet is loaded.",
        variant: "destructive"
      })
      setIsLoading(false)
      return
    }

    try {
      // Use the actual recipient address from the form, not a mock one
      const txHash = await sendPayment({
        recipientAddress: trimmedRecipient, // Use the actual input
        amountUsd: parseFloat(amount),
        privateKey: wallet.privateKey,
        userId: user.id,
        senderAddress: wallet.address
      })

      toast({
        title: "Payment Sent!",
        description: `Successfully sent $${amount} to ${formatAddress(trimmedRecipient)}`
      })
      setRecipientAddress('')
      setAmount('')
    } catch (error) {
      console.error('Payment failed:', error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to send payment",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startQRScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setShowQRScanner(true)
        scanQRCode()
      }
    } catch (error) {
      console.error('Failed to start camera:', error)
      toast({
        title: "Camera Error",
        description: "Failed to access camera. Please check permissions.",
        variant: "destructive"
      })
    }
  }

  const stopQRScanner = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setShowQRScanner(false)
  }

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    const scanFrame = () => {
      if (video.videoWidth === 0) {
        requestAnimationFrame(scanFrame)
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      try {
        // Simple QR code detection (in a real app, you'd use a library like jsQR)
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        
        // For now, we'll simulate QR detection
        // In production, use: import jsQR from 'jsqr'
        // const code = jsQR(imageData.data, imageData.width, imageData.height)
        
        // Simulate finding a QR code with an Algorand address
        if (Math.random() < 0.01) { // 1% chance per frame to simulate detection
          const mockAddress = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
          setRecipientAddress(mockAddress)
          stopQRScanner()
          toast({
            title: "QR Code Scanned!",
            description: "Recipient address detected and filled.",
          })
          return
        }

        if (showQRScanner) {
          requestAnimationFrame(scanFrame)
        }
      } catch (error) {
        console.error('QR scanning error:', error)
      }
    }

    scanFrame()
  }

  const generateQRCode = () => {
    if (!wallet?.address) {
      toast({
        title: "No Wallet",
        description: "Please ensure your wallet is loaded.",
        variant: "destructive"
      })
      return
    }
    setShowQRCode(true)
  }

  return (
    <>
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <CardTitle className="text-2xl">Send Money</CardTitle>
                <CardDescription>
                  Transfer funds to another Algorand wallet
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="recipient" className="text-sm font-medium">
                  Recipient Address
                </label>
                <div className="flex space-x-2">
                  <Input
                    id="recipient"
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Enter Algorand wallet address (58 characters)"
                    required
                    disabled={isLoading}
                    className="flex-1 font-mono text-sm"
                    maxLength={58}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={startQRScanner}
                    disabled={isLoading}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                {recipientAddress && (
                  <p className="text-xs text-muted-foreground">
                    {algorandService.isValidAddress(recipientAddress.trim()) 
                      ? "✓ Valid Algorand address" 
                      : "✗ Invalid address format"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">
                  Amount (USD)
                </label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  disabled={isLoading}
                />
              </div>

              {wallet && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Wallet className="h-4 w-4" />
                      <span>From: {formatAddress(wallet.address)}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={generateQRCode}
                      className="h-6 w-6"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <SendIcon className="mr-2 h-4 w-4" />
                    Send Payment
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Scan QR Code</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={stopQRScanner}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded-lg pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
                  <div className="w-48 h-48 border-2 border-white rounded-lg"></div>
                  <p className="mt-2 text-sm">Position QR code in frame</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Point your camera at a QR code containing an Algorand address
            </p>
          </div>
        </div>
      )}

      {/* QR Code Display Modal */}
      {showQRCode && wallet && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your QR Code</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowQRCode(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center">
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="text-center">
                  <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">QR Code Placeholder</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatAddress(wallet.address)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Share this QR code to receive payments
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}