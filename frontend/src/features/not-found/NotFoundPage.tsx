import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/ui/Brand'
import { buttonClasses } from '@/components/ui/buttonStyles'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-surface px-4 text-center">
      <BrandMark className="size-12" />

      <p className="font-display text-6xl font-bold text-primary">404</p>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-headline-md text-on-surface">
          Página no encontrada
        </h1>
        <p className="max-w-md text-sm text-on-surface-variant">
          La dirección que buscaste no existe o se movió. Vuelve al inicio o
          entra a tu billetera.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/" className={buttonClasses('primary')}>
          Volver al inicio
        </Link>
        <Link to="/login" className={buttonClasses('ghost')}>
          Iniciar sesión
        </Link>
      </div>
    </div>
  )
}
