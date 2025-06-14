import React from 'react'
import { Zap } from 'lucide-react'

export function BoltBadge() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <a
        href="https://bolt.new"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center space-x-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Zap className="h-4 w-4" />
        <span>Built on Bolt</span>
      </a>
    </div>
  )
}