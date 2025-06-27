import React, { useState } from 'react'
import { Shield, Eye, EyeOff, Key, Download, AlertTriangle } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Switch } from './ui/switch'
import { useAuthStore } from '../store/auth'
import { useToast } from '../hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'

export function SecuritySettings() {
  const [showSeed, setShowSeed] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const { wallet } = useAuthStore()
  const { toast } = useToast()

  const handleExportSeed = () => {
    if (!wallet) return

    const element = document.createElement('a')
    const file = new Blob([wallet.mnemonic], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = 'voicepay-seed-phrase.txt'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)

    toast({
      title: "Seed Phrase Exported",
      description: "Your seed phrase has been downloaded. Keep it safe!",
    })
  }

  const handleCopySeed = async () => {
    if (!wallet) return

    try {
      await navigator.clipboard.writeText(wallet.mnemonic)
      toast({
        title: "Seed Phrase Copied",
        description: "Your seed phrase has been copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy seed phrase.",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Shield className="h-4 w-4 mr-2" />
          Security Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Security Settings</span>
          </DialogTitle>
          <DialogDescription>
            Manage your wallet security and backup options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seed Phrase Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>Seed Phrase Backup</span>
              </CardTitle>
              <CardDescription>
                Your seed phrase is the master key to your wallet. Keep it safe and never share it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-semibold mb-1">Important Security Notice</p>
                    <p>Never share your seed phrase with anyone. VoicePay will never ask for it.</p>
                  </div>
                </div>
              </div>

              {wallet && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Input
                      type={showSeed ? 'text' : 'password'}
                      value={wallet.mnemonic}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSeed(!showSeed)}
                    >
                      {showSeed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleCopySeed} className="flex-1">
                      Copy Seed Phrase
                    </Button>
                    <Button variant="outline" onClick={handleExportSeed} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Export to File
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Security Features</CardTitle>
              <CardDescription>
                Additional security options for your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Biometric Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Use fingerprint or face recognition for quick access
                  </p>
                </div>
                <Switch
                  checked={biometricEnabled}
                  onCheckedChange={setBiometricEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-lock Wallet</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically lock wallet after 5 minutes of inactivity
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Transaction Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified of all incoming and outgoing transactions
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Recovery Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recovery Options</CardTitle>
              <CardDescription>
                Set up recovery methods in case you lose access to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                Set Recovery Email
              </Button>
              <Button variant="outline" className="w-full">
                Add Recovery Phone
              </Button>
              <Button variant="outline" className="w-full">
                Generate Recovery Codes
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}