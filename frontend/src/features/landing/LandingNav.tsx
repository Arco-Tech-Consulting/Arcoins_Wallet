import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Brand } from '@/components/ui/Brand'
import { buttonClasses } from '@/components/ui/buttonStyles'
import { ButtonLink } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'

const ANCHOR_LINKS = [
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#asistente', label: 'Asistente' },
]

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant/30 bg-surface/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" aria-label="Arcoins Wallet, inicio">
          <Brand markClassName="size-7" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Secciones">
          {ANCHOR_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/login" className={buttonClasses('ghost')}>
            Iniciar sesión
          </Link>
          <ButtonLink to="/register">Crear cuenta</ButtonLink>
        </div>

        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface md:hidden"
          aria-expanded={menuOpen}
          aria-controls="landing-drawer"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen(true)}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      <Drawer
        id="landing-drawer"
        label="Menú de la landing"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      >
        <nav className="flex flex-col gap-1" aria-label="Secciones">
          {ANCHOR_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="min-h-11 rounded-lg px-3 py-2.5 text-base font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="mt-6 flex flex-col gap-3 border-t border-outline-variant/40 pt-6">
          <ButtonLink
            to="/register"
            className="w-full"
            onClick={() => setMenuOpen(false)}
          >
            Crear cuenta
          </ButtonLink>
          <ButtonLink
            to="/login"
            variant="ghost"
            className="w-full"
            onClick={() => setMenuOpen(false)}
          >
            Iniciar sesión
          </ButtonLink>
        </div>
      </Drawer>
    </header>
  )
}
