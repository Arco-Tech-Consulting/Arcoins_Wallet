import type { ReactNode } from 'react'

interface CardProps {
  className?: string
  children: ReactNode
}

export function Card({ className = '', children }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-ink-200 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}