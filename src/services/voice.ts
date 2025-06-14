export interface VoiceCommand {
  action: 'send' | 'balance' | 'history' | 'receive' | 'unknown'
  amount?: number
  recipient?: string
  currency?: string
}

export interface SpeechRecognitionResult {
  transcript: string
  confidence: number
}

class VoiceService {
  private recognition: SpeechRecognition | null = null
  private synthesis: SpeechSynthesis
  private isListening = false

  constructor() {
    this.synthesis = window.speechSynthesis
    this.initializeSpeechRecognition()
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition()
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition()
    }

    if (this.recognition) {
      this.recognition.continuous = false
      this.recognition.interimResults = false
      this.recognition.lang = 'en-US'
    }
  }

  /**
   * Start listening for voice commands
   */
  async startListening(): Promise<SpeechRecognitionResult> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'))
        return
      }

      if (this.isListening) {
        reject(new Error('Already listening'))
        return
      }

      this.isListening = true

      this.recognition.onresult = (event) => {
        const result = event.results[0]
        const transcript = result[0].transcript
        const confidence = result[0].confidence

        resolve({ transcript, confidence })
        this.isListening = false
      }

      this.recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`))
        this.isListening = false
      }

      this.recognition.onend = () => {
        this.isListening = false
      }

      try {
        this.recognition.start()
      } catch (error) {
        this.isListening = false
        reject(error)
      }
    })
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  /**
   * Parse voice command from transcript
   */
  parseVoiceCommand(transcript: string): VoiceCommand {
    const text = transcript.toLowerCase().trim()

    // Send money patterns
    const sendPatterns = [
      /send\s+(\$?[\d.]+)\s*(?:dollars?|usd)?\s+to\s+(.+)/i,
      /pay\s+(.+?)\s+(\$?[\d.]+)\s*(?:dollars?|usd)?/i,
      /transfer\s+(\$?[\d.]+)\s*(?:dollars?|usd)?\s+to\s+(.+)/i
    ]

    for (const pattern of sendPatterns) {
      const match = text.match(pattern)
      if (match) {
        const amount = parseFloat(match[1].replace('$', ''))
        const recipient = match[2].trim()
        
        return {
          action: 'send',
          amount,
          recipient,
          currency: 'USD'
        }
      }
    }

    // Balance check patterns
    if (/(?:what'?s|show|check|get)\s+(?:my\s+)?balance/i.test(text) ||
        /how\s+much\s+(?:money\s+)?(?:do\s+)?i\s+have/i.test(text)) {
      return { action: 'balance' }
    }

    // Transaction history patterns
    if (/(?:show|get|check)\s+(?:my\s+)?(?:transaction\s+)?history/i.test(text) ||
        /what\s+(?:are\s+)?my\s+(?:recent\s+)?transactions/i.test(text)) {
      return { action: 'history' }
    }

    // Receive patterns
    if (/(?:show|get|display)\s+(?:my\s+)?(?:receive\s+)?(?:address|qr)/i.test(text) ||
        /how\s+(?:can\s+)?(?:do\s+)?(?:people\s+)?(?:send\s+)?(?:me\s+)?money/i.test(text)) {
      return { action: 'receive' }
    }

    return { action: 'unknown' }
  }

  /**
   * Speak text using ElevenLabs API or fallback to browser TTS
   */
  async speak(text: string, useElevenLabs = true): Promise<void> {
    if (useElevenLabs && import.meta.env.VITE_ELEVENLABS_API_KEY) {
      try {
        await this.speakWithElevenLabs(text)
        return
      } catch (error) {
        console.warn('ElevenLabs TTS failed, falling back to browser TTS:', error)
      }
    }

    // Fallback to browser TTS
    return this.speakWithBrowserTTS(text)
  }

  /**
   * Speak using ElevenLabs API
   */
  private async speakWithElevenLabs(text: string): Promise<void> {
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    })

    if (!response.ok) {
      throw new Error('ElevenLabs API request failed')
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        resolve()
      }
      audio.onerror = reject
      audio.play()
    })
  }

  /**
   * Speak using browser TTS
   */
  private async speakWithBrowserTTS(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8

      utterance.onend = () => resolve()
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`))

      this.synthesis.speak(utterance)
    })
  }

  /**
   * Check if speech recognition is supported
   */
  isSpeechRecognitionSupported(): boolean {
    return this.recognition !== null
  }

  /**
   * Check if speech synthesis is supported
   */
  isSpeechSynthesisSupported(): boolean {
    return 'speechSynthesis' in window
  }

  /**
   * Get current listening state
   */
  getIsListening(): boolean {
    return this.isListening
  }
}

export const voiceService = new VoiceService()