interface SpinnerProps {
  className?: string
}

export function Spinner({ className = 'size-5' }: SpinnerProps) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      role="status"
      aria-label="Cargando"
    />
  )
}