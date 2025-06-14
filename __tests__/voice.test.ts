import { describe, it, expect, vi, beforeEach } from 'vitest'
import { voiceService } from '../src/services/voice'

describe('VoiceService', () => {
  describe('parseVoiceCommand', () => {
    it('should parse send money commands', () => {
      const testCases = [
        {
          input: 'send 5 dollars to Alice',
          expected: { action: 'send', amount: 5, recipient: 'Alice', currency: 'USD' }
        },
        {
          input: 'send $10 to Bob',
          expected: { action: 'send', amount: 10, recipient: 'Bob', currency: 'USD' }
        },
        {
          input: 'pay Charlie 15 dollars',
          expected: { action: 'send', amount: 15, recipient: 'Charlie', currency: 'USD' }
        },
        {
          input: 'transfer 20 USD to David',
          expected: { action: 'send', amount: 20, recipient: 'David', currency: 'USD' }
        }
      ]

      testCases.forEach(({ input, expected }) => {
        const result = voiceService.parseVoiceCommand(input)
        expect(result).toEqual(expected)
      })
    })

    it('should parse balance check commands', () => {
      const testCases = [
        'what\'s my balance',
        'show my balance',
        'check my balance',
        'how much money do I have',
        'how much do I have'
      ]

      testCases.forEach(input => {
        const result = voiceService.parseVoiceCommand(input)
        expect(result).toEqual({ action: 'balance' })
      })
    })

    it('should parse transaction history commands', () => {
      const testCases = [
        'show my transaction history',
        'get my history',
        'what are my recent transactions',
        'show my transactions'
      ]

      testCases.forEach(input => {
        const result = voiceService.parseVoiceCommand(input)
        expect(result).toEqual({ action: 'history' })
      })
    })

    it('should parse receive commands', () => {
      const testCases = [
        'show my receive address',
        'get my QR code',
        'how can people send me money',
        'display my address'
      ]

      testCases.forEach(input => {
        const result = voiceService.parseVoiceCommand(input)
        expect(result).toEqual({ action: 'receive' })
      })
    })

    it('should return unknown for unrecognized commands', () => {
      const testCases = [
        'hello world',
        'what time is it',
        'play music',
        'random text'
      ]

      testCases.forEach(input => {
        const result = voiceService.parseVoiceCommand(input)
        expect(result).toEqual({ action: 'unknown' })
      })
    })

    it('should handle case insensitive input', () => {
      const result = voiceService.parseVoiceCommand('SEND 5 DOLLARS TO ALICE')
      expect(result).toEqual({
        action: 'send',
        amount: 5,
        recipient: 'ALICE',
        currency: 'USD'
      })
    })

    it('should handle extra whitespace', () => {
      const result = voiceService.parseVoiceCommand('  send   5   dollars   to   Alice  ')
      expect(result).toEqual({
        action: 'send',
        amount: 5,
        recipient: 'Alice',
        currency: 'USD'
      })
    })

    it('should parse decimal amounts', () => {
      const result = voiceService.parseVoiceCommand('send 5.50 dollars to Alice')
      expect(result).toEqual({
        action: 'send',
        amount: 5.50,
        recipient: 'Alice',
        currency: 'USD'
      })
    })
  })

  describe('speech recognition support', () => {
    it('should detect speech recognition support', () => {
      // Mock webkitSpeechRecognition
      Object.defineProperty(window, 'webkitSpeechRecognition', {
        value: function() {},
        writable: true
      })

      expect(voiceService.isSpeechRecognitionSupported()).toBe(true)
    })

    it('should detect lack of speech recognition support', () => {
      // Remove speech recognition
      delete (window as any).webkitSpeechRecognition
      delete (window as any).SpeechRecognition

      expect(voiceService.isSpeechRecognitionSupported()).toBe(false)
    })
  })

  describe('speech synthesis support', () => {
    it('should detect speech synthesis support', () => {
      Object.defineProperty(window, 'speechSynthesis', {
        value: {},
        writable: true
      })

      expect(voiceService.isSpeechSynthesisSupported()).toBe(true)
    })
  })
})