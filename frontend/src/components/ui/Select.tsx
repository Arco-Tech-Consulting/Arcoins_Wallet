import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function Select({ label, className = '', id, children, ...rest }: SelectProps) {
  const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={selectId} className="text-sm font-medium text-on-surface-variant">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={`w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-base text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm ${className}`}
        {...rest}
      >
        {children}
      </select>
    </div>
  )
}
