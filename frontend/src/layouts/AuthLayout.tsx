import { Outlet } from 'react-router-dom'
import { Brand } from '@/components/ui/Brand'

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-surface px-4 py-10">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative w-full max-w-md">
        <h1 className="sr-only">Arcoins Wallet</h1>
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Brand markClassName="size-10" />
          <p className="text-sm text-on-surface-variant">
            Tu billetera digital multi-moneda
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
