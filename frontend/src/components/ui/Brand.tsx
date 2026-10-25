import { useId } from 'react'

interface BrandMarkProps {
  className?: string
}

export function BrandMark({ className = 'size-8' }: BrandMarkProps) {
  const gradientId = useId()

  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4d8eff" />
          <stop offset="1" stopColor="#4edea3" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path
        d="M11 23.5 16 9l5 14.5M13.2 18.8h5.6"
        fill="none"
        stroke="#0f131d"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface BrandProps {
  markClassName?: string
  className?: string
}

export function Brand({ markClassName = 'size-8', className = '' }: BrandProps) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <BrandMark className={markClassName} />
      <span className="font-display text-lg font-bold tracking-tight">
        <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Arcoins
        </span>{' '}
        <span className="text-on-surface">Wallet</span>
      </span>
    </span>
  )
}
