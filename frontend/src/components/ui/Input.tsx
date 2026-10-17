import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...rest }: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-on-surface-variant">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`w-full rounded-lg border bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none transition-colors placeholder:text-outline focus:ring-2 ${
          error
            ? 'border-error focus:border-error focus:ring-error/20'
            : 'border-outline-variant focus:border-primary focus:ring-primary/20'
        } ${className}`}
        {...rest}
      />
      {error ? <span className="text-xs text-error">{error}</span> : null}
    </div>
  )
}