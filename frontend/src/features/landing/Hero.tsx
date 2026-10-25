import { m } from 'motion/react'
import { ButtonLink } from '@/components/ui/Button'
import { HERO_SAMPLE } from './landing.content'

const easeOut = { duration: 0.5, ease: 'easeOut' } as const

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-32 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:pt-24 lg:grid-cols-2 lg:pt-28">
        <m.div
          className="flex flex-col items-start gap-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={easeOut}
        >
          <span className="rounded-full border border-outline-variant/60 bg-surface-container-low px-3 py-1 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
            Billetera multi-moneda
          </span>

          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-on-surface sm:text-5xl">
            Tu dinero, en tres monedas y en un solo lugar.
          </h1>

          <p className="max-w-xl text-base text-on-surface-variant sm:text-lg">
            Convierte entre COP, USD y EUR con la tasa del momento, paga a
            comercios y consulta tus movimientos desde una sola billetera.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink to="/register">Crear mi billetera</ButtonLink>
            <ButtonLink to="/login" variant="secondary">
              Ya tengo cuenta
            </ButtonLink>
          </div>

          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-on-surface-variant">
            <li className="flex items-center gap-2">
              <Tick /> Tasas al día
            </li>
            <li className="flex items-center gap-2">
              <Tick /> Asistente con IA
            </li>
            <li className="flex items-center gap-2">
              <Tick /> Historial completo
            </li>
          </ul>
        </m.div>

        <m.div
          className="relative mx-auto w-full max-w-sm"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...easeOut, delay: 0.15 }}
        >
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-6 shadow-2xl shadow-black/40">
            <p className="text-sm text-on-surface-variant">Saldo total</p>
            <p className="font-display text-headline-xl text-on-surface">
              {HERO_SAMPLE.totalCop}
            </p>
            <p className="mt-1 text-xs text-outline">en COP</p>

            <div className="mt-6 flex flex-col gap-3">
              {HERO_SAMPLE.balances.map((balance) => (
                <div
                  key={balance.code}
                  className="flex items-center justify-between rounded-lg bg-surface-container-high/60 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-full bg-primary-container/20 text-xs font-semibold text-primary">
                      {balance.code}
                    </span>
                    <span className="text-sm text-on-surface-variant">
                      {balance.name}
                    </span>
                  </div>
                  <span className="font-display text-sm font-semibold text-on-surface">
                    {balance.sample}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <m.div
            className="absolute -right-3 -top-8 rounded-xl border border-outline-variant/40 bg-surface-container px-4 py-3 shadow-xl shadow-black/40 sm:-right-8"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <p className="text-xs text-on-surface-variant">Compra de dólares</p>
            <p className="font-display text-sm font-semibold text-secondary">
              +{HERO_SAMPLE.buyAmount}
            </p>
          </m.div>

          <m.div
            className="absolute -bottom-8 -left-3 rounded-xl border border-outline-variant/40 bg-surface-container px-4 py-3 shadow-xl shadow-black/40 sm:-left-8"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <p className="text-xs text-on-surface-variant">Tasa de ejemplo</p>
            <p className="font-display text-sm font-semibold text-tertiary">
              {HERO_SAMPLE.rateLine}
            </p>
          </m.div>
        </m.div>
      </div>
    </section>
  )
}

function Tick() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-4 text-secondary"
      aria-hidden="true"
      fill="none"
    >
      <circle cx="8" cy="8" r="7" className="fill-secondary/15" />
      <path
        d="m5 8.2 2 2 4-4.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
