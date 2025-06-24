import { Send, QrCode, History } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import React from 'react'

export function QuickActionsPill({ className = '' }: { className?: string }) {
  const navigate = useNavigate()
  return (
    <div className={`flex flex-wrap gap-x-4 gap-y-4 w-full justify-center ${className}`}>
      <button
        onClick={() => navigate('/send')}
        className="flex items-center gap-2 px-6 py-3 rounded-full bg-muted text-primary font-semibold text-base hover:bg-primary/10 transition-all duration-150 shadow-sm"
      >
        <Send className="h-5 w-5" />
        Send
      </button>
      <button
        onClick={() => navigate('/receive')}
        className="flex items-center gap-2 px-6 py-3 rounded-full bg-muted text-primary font-semibold text-base hover:bg-primary/10 transition-all duration-150 shadow-sm"
      >
        <QrCode className="h-5 w-5" />
        Receive
      </button>
      <button
        onClick={() => navigate('/history')}
        className="flex items-center gap-2 px-6 py-3 rounded-full bg-muted text-primary font-semibold text-base hover:bg-primary/10 transition-all duration-150 shadow-sm"
      >
        <History className="h-5 w-5" />
        History
      </button>
    </div>
  )
} 