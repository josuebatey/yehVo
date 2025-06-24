import React, { useState, useCallback } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { voiceService, type VoiceCommand } from '../services/voice'
import { useToast } from '../hooks/use-toast'
import { cn } from '../lib/utils'

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
      const command = voiceService.parseVoiceCommand(result.transcript)
      if (command.action === 'unknown') {
        toast({
          title: "Command Not Recognized",
          description: `I heard: "${result.transcript}". Try saying something like "send 5 dollars to Alice" or "check my balance".`
        })
        await voiceService.speak("I didn't understand that command. Try saying something like 'send 5 dollars to Alice' or 'check my balance'.")
      } else {
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

  // Button icon based on state
  const buttonIcon = () => {
    if (isProcessing) return <Loader2 className="h-5 w-5 animate-spin text-white" />
    if (isListening) return <MicOff className="h-5 w-5 text-red-500" />
    return <Mic className="h-5 w-5 text-white" />
  }

  return (
    <Button
      size="icon"
      onClick={handleVoiceInput}
      disabled={disabled || isProcessing}
      className={cn(
        // Base: circular, red bg, white icon
        "relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white shadow-md transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300",
        // Listening: red outline, ghost style, subtle shadow
        isListening && "bg-red-100 border-2 border-red-500 text-red-500 shadow-lg scale-105",
        // Processing: dimmed
        isProcessing && "opacity-80 cursor-wait",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
      tabIndex={0}
      aria-label="Hold to Speak"
      onMouseDown={() => !disabled && !isProcessing && handleVoiceInput()}
      onTouchStart={() => !disabled && !isProcessing && handleVoiceInput()}
    >
      {buttonIcon()}
      {/* Notification dot (top-right) when listening, smaller for compact button */}
      {isListening && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-400 rounded-full border-2 border-white shadow-md" />
      )}
      {/* Spinner overlay when processing */}
      {isProcessing && (
        <span className="absolute inset-0 flex items-center justify-center bg-red-500/60 rounded-full">
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        </span>
      )}
    </Button>
  )
}