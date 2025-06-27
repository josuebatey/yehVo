import React, { useState } from 'react'
import { HelpCircle, Mic, X } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'

const voiceCommands = [
  {
    category: "Payments",
    commands: [
      { phrase: "Send 5 dollars to Alice", description: "Send money to a contact" },
      { phrase: "Pay Bob 10 dollars", description: "Alternative payment command" },
      { phrase: "Transfer 20 USD to Charlie", description: "Transfer funds" }
    ]
  },
  {
    category: "Account Info",
    commands: [
      { phrase: "What's my balance", description: "Check your current balance" },
      { phrase: "Show my balance", description: "Display account balance" },
      { phrase: "How much money do I have", description: "Get balance information" }
    ]
  },
  {
    category: "Transaction History",
    commands: [
      { phrase: "Show my transaction history", description: "View recent transactions" },
      { phrase: "What are my recent transactions", description: "Get transaction list" },
      { phrase: "Show my transactions", description: "Display transaction history" }
    ]
  },
  {
    category: "Receiving Money",
    commands: [
      { phrase: "Show my receive address", description: "Display your wallet address" },
      { phrase: "Get my QR code", description: "Show QR code for receiving" },
      { phrase: "How can people send me money", description: "Get receiving instructions" }
    ]
  }
]

export function VoiceCommandHelp() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-4 right-20 z-40">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mic className="h-5 w-5 text-primary" />
            <span>Voice Commands Guide</span>
          </DialogTitle>
          <DialogDescription>
            Learn how to use voice commands to control VoicePay
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="p-4 bg-primary/5 rounded-lg">
            <h3 className="font-semibold mb-2">How to Use Voice Commands</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Press and hold the microphone button</li>
              <li>Speak your command clearly</li>
              <li>Release the button when finished</li>
              <li>Wait for VoicePay to process your request</li>
            </ol>
          </div>

          {voiceCommands.map((category, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{category.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.commands.map((command, cmdIndex) => (
                    <div key={cmdIndex} className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <Mic className="h-4 w-4 text-primary flex-shrink-0" />
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          "{command.phrase}"
                        </code>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">
                        {command.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h3 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">
              Tips for Better Recognition
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
              <li>Speak clearly and at a normal pace</li>
              <li>Use a quiet environment when possible</li>
              <li>Hold the device close to your mouth</li>
              <li>Wait for the beep before speaking</li>
              <li>Use exact phrases for best results</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}