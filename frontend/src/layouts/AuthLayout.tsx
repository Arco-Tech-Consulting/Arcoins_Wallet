import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-surface px-4 py-10">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight text-on-surface">
            Arcoins Wallet
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Tu billetera digital multi-moneda
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
