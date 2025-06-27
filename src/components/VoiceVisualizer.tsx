import React, { useEffect, useRef } from 'react'
import { cn } from '../lib/utils'

interface VoiceVisualizerProps {
  isListening: boolean
  className?: string
}

export function VoiceVisualizer({ isListening, className }: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const width = canvas.width
      const height = canvas.height
      
      ctx.clearRect(0, 0, width, height)
      
      if (isListening) {
        // Draw animated voice waves
        const centerY = height / 2
        const time = Date.now() * 0.005
        
        ctx.strokeStyle = 'hsl(var(--primary))'
        ctx.lineWidth = 2
        
        for (let i = 0; i < 5; i++) {
          ctx.beginPath()
          const amplitude = 10 + Math.sin(time + i * 0.5) * 8
          const frequency = 0.02 + i * 0.005
          
          for (let x = 0; x < width; x++) {
            const y = centerY + Math.sin(x * frequency + time + i) * amplitude
            if (x === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
          }
          
          ctx.globalAlpha = 0.7 - i * 0.1
          ctx.stroke()
        }
        
        ctx.globalAlpha = 1
      }
      
      if (isListening) {
        animationRef.current = requestAnimationFrame(draw)
      }
    }

    if (isListening) {
      draw()
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isListening])

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={60}
      className={cn(
        "rounded-lg bg-muted/50",
        isListening ? "opacity-100" : "opacity-0",
        "transition-opacity duration-300",
        className
      )}
    />
  )
}