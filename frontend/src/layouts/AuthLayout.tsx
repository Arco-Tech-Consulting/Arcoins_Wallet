import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Arcoins Wallet
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Tu billetera digital multi-moneda
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}