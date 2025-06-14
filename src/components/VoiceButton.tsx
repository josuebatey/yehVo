import React, { useState, useCallback } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { voiceService, type VoiceCommand } from '@/services/voice'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface VoiceButtonProps {
  onCommand: (command: VoiceCommand) => void
  disabled?: boolean
  className?: string
}

export function VoiceButton({ onCommand, disabled = false, className }: VoiceButtonProps) {
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleVoiceInput = useCallback(async () => {
    if (!voiceService.isSpeechRecognitionSupported()) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive"
      })
      return
    }

    if (isListening || isProcessing) {
      voiceService.stopListening()
      setIsListening(false)
      return
    }

    try {
      setIsListening(true)
      
      const result = await voiceService.startListening()
      
      setIsListening(false)
      setIsProcessing(true)

      // Parse the voice command
      const command = voiceService.parseVoiceCommand(result.transcript)
      
      // Provide feedback
      if (command.action === 'unknown') {
        toast({
          title: "Command Not Recognized",
          description: `I heard: "${result.transcript}". Try saying something like "send 5 dollars to Alice" or "check my balance".`
        })
        await voiceService.speak("I didn't understand that command. Try saying something like 'send 5 dollars to Alice' or 'check my balance'.")
      } else {
        // Execute the command
        onCommand(command)
      }
    } catch (error) {
      console.error('Voice input error:', error)
      toast({
        title: "Voice Input Failed",
        description: error instanceof Error ? error.message : "Failed to process voice input",
        variant: "destructive"
      })
    } finally {
      setIsListening(false)
      setIsProcessing(false)
    }
  }, [isListening, isProcessing, onCommand, toast])

  const buttonIcon = () => {
    if (isProcessing) return <Loader2 className="h-6 w-6 animate-spin" />
    if (isListening) return <MicOff className="h-6 w-6" />
    return <Mic className="h-6 w-6" />
  }

  const buttonText = () => {
    if (isProcessing) return "Processing..."
    if (isListening) return "Listening..."
    return "Hold to Speak"
  }

  return (
    <Button
      size="lg"
      onClick={handleVoiceInput}
      disabled={disabled || isProcessing}
      className={cn(
        "relative overflow-hidden transition-all duration-200",
        isListening && "recording-pulse bg-red-500 hover:bg-red-600",
        className
      )}
      onMouseDown={() => !disabled && !isProcessing && handleVoiceInput()}
      onTouchStart={() => !disabled && !isProcessing && handleVoiceInput()}
    >
      <div className="flex items-center space-x-2">
        {buttonIcon()}
        <span>{buttonText()}</span>
      </div>
      
      {isListening && (
        <div className="absolute inset-0 bg-red-500/20 animate-pulse" />
      )}
    </Button>
  )
}