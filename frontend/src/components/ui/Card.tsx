import type { ReactNode } from 'react'

interface CardProps {
  className?: string
  children: ReactNode
}

export function Card({ className = '', children }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-outline-variant/40 bg-surface-container-low p-6 shadow-lg shadow-black/20 ${className}`}
    >
      {children}
    </div>
  )
}