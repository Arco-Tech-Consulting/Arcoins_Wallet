import { Link } from 'react-router-dom'
import { Brand } from '@/components/ui/Brand'
import { COMPANY_NAME } from './landing.content'

export function LandingFooter() {
  return (
    <footer className="border-t border-outline-variant/30 bg-surface-container-low/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <Brand markClassName="size-6" />
          <p className="max-w-xs text-sm text-on-surface-variant">
            Billetera digital multi-moneda para gestionar saldos en COP, USD y
            EUR.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-on-surface">Cuenta</span>
          <Link
            to="/register"
            className="text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Crear cuenta
          </Link>
          <Link
            to="/login"
            className="text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Iniciar sesión
          </Link>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-on-surface">Producto</span>
          <a
            href="#como-funciona"
            className="text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Cómo funciona
          </a>
          <a
            href="#funcionalidades"
            className="text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Funcionalidades
          </a>
          <a
            href="#asistente"
            className="text-on-surface-variant transition-colors hover:text-on-surface"
          >
            Asistente
          </a>
        </div>
      </div>

      <div className="border-t border-outline-variant/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-outline sm:flex-row sm:items-center sm:justify-between">
          <span>Desarrollado por {COMPANY_NAME}</span>
          <span>Arcoins Wallet</span>
        </div>
      </div>
    </footer>
  )
}
