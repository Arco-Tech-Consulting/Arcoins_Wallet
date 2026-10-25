import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from './Spinner'
import { buttonClasses, type ButtonVariant } from './buttonStyles'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${buttonClasses(variant)} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner className="size-4" /> : null}
      {children}
    </button>
  )
}

interface ButtonLinkProps {
  to: string
  variant?: ButtonVariant
  className?: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
  children: ReactNode
}

export function ButtonLink({
  to,
  variant = 'primary',
  className = '',
  onClick,
  children,
}: ButtonLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`${buttonClasses(variant)} ${className}`}
    >
      {children}
    </Link>
  )
}
