export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-container text-on-primary-container hover:brightness-110',
  secondary: 'bg-surface-container-high text-on-surface hover:bg-surface-bright',
  ghost:
    'bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
  danger: 'bg-error-container text-on-error-container hover:brightness-110',
}

export function buttonClasses(variant: ButtonVariant = 'primary'): string {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-[colors,transform] duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${variantStyles[variant]}`
}
