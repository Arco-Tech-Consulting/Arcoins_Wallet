import { useEffect, useState, type ReactNode } from 'react'
import { m } from 'motion/react'
import { ButtonLink } from '@/components/ui/Button'
import {
  ASSISTANT_DEMO,
  FEATURES,
  PERKS,
  SAMPLE_BALANCES,
  SECURITY_ITEMS,
  STEPS,
  type Feature,
} from './landing.content'

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </m.div>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <span className="rounded-full border border-outline-variant/60 bg-surface-container-low px-3 py-1 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
        {eyebrow}
      </span>
      <h2 className="font-display max-w-2xl text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-base text-on-surface-variant">{description}</p>
      ) : null}
    </div>
  )
}

export function CurrencyStrip() {
  return (
    <section id="monedas" className="mx-auto w-full max-w-6xl px-4 py-14">
      <Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {SAMPLE_BALANCES.map((balance) => (
            <div
              key={balance.code}
              className="flex flex-col gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-low p-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-outline">
                  {balance.code}
                </span>
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[11px] text-on-surface-variant">
                  ejemplo
                </span>
              </div>
              <p className="text-sm text-on-surface-variant">{balance.name}</p>
              <p className="font-display text-headline-md text-on-surface">
                {balance.sample}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-outline">
          Cifras ilustrativas. Inicia sesión para ver tus saldos reales y las
          tasas del momento.
        </p>
      </Reveal>
    </section>
  )
}

export function Differentiators() {
  return (
    <section id="nuestro-plus" className="mx-auto w-full max-w-6xl px-4 py-14">
      <SectionHeader
        eyebrow={PERKS.eyebrow}
        title={PERKS.title}
        description={PERKS.description}
      />

      <Reveal delay={0.1}>
        <div className="mt-10 overflow-x-auto rounded-2xl border border-outline-variant/40 bg-surface-container-low shadow-2xl shadow-black/30">
          {/* Columnas: concepto | Arcoins | otras billeteras */}
          <div className="min-w-120">
            <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-outline-variant/40 px-5 py-4 sm:grid-cols-[1fr_1fr_1fr] sm:px-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-outline">
                Operación
              </span>
              <span className="flex items-center justify-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary sm:px-4">
                <CheckIcon />
                {PERKS.highlightLabel}
              </span>
              <span className="hidden justify-center text-xs font-medium uppercase tracking-wider text-on-surface-variant/80 sm:flex">
                {PERKS.othersLabel}
              </span>
            </div>

            <ul className="divide-y divide-outline-variant/30">
              {PERKS.rows.map((row) => (
                <li
                  key={row.concept}
                  className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[1fr_1fr_1fr] sm:items-center sm:px-6"
                >
                  <span className="flex items-center gap-2.5 text-sm font-medium text-on-surface">
                    <span className="size-1.5 shrink-0 rounded-full bg-secondary" />
                    {row.concept}
                  </span>
                  <span className="sm:hidden">
                    <PerkBadge value={row.arcoins} other={row.others} />
                  </span>
                  <span className="hidden justify-center sm:flex">
                    <span className="flex items-center gap-2 rounded-lg bg-primary/10 px-3.5 py-2 text-sm font-semibold text-primary">
                      <CheckIcon />
                      {row.arcoins}
                    </span>
                  </span>
                  <span className="hidden justify-center text-center text-xs text-on-surface-variant/75 sm:text-sm">
                    {row.others}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-outline">{PERKS.note}</p>
      </Reveal>
    </section>
  )
}

function PerkBadge({ value, other }: { value: string; other: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-lowest px-3 py-2">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
        <CheckIcon />
        {value}
      </span>
      <span className="text-right text-[11px] text-on-surface-variant/80">
        {other}
      </span>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  )
}

export function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto w-full max-w-6xl px-4 py-14">
      <SectionHeader
        eyebrow="Cómo funciona"
        title="De cero a tu primera conversión en minutos"
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <Reveal key={step.title} delay={index * 0.08} className="h-full">
            <div className="flex h-full flex-col gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-6">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary-container/20 font-display text-base font-bold text-primary">
                {index + 1}
              </span>
              <h3 className="font-display text-base font-semibold text-on-surface">
                {step.title}
              </h3>
              <p className="text-sm text-on-surface-variant">{step.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

const FEATURE_ICONS: Record<Feature['icon'], ReactNode> = {
  coins: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5c0-1.1 1.1-1.8 2.5-1.8s2.5.7 2.5 1.8-1.1 1.5-2.5 1.8-2.5.7-2.5 1.8 1.1 1.8 2.5 1.8 2.5-.7 2.5-1.8" />
    </>
  ),
  rate: (
    <>
      <path d="m3 17 6-6 4 4 7-8" />
      <path d="M15 7h5v5" />
    </>
  ),
  deposit: (
    <>
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M4 21h16" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <path d="M2.5 10h19" />
    </>
  ),
  history: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  chat: <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.6 0-3-.4-4.3-1L3 20l1-5.2a8.5 8.5 0 1 1 17-3.3Z" />,
}

function FeatureIcon({ icon }: { icon: Feature['icon'] }) {
  return (
    <span className="flex size-11 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {FEATURE_ICONS[icon]}
      </svg>
    </span>
  )
}

export function Features() {
  return (
    <section id="funcionalidades" className="mx-auto w-full max-w-6xl px-4 py-14">
      <SectionHeader
        eyebrow="Funcionalidades"
        title="Todo lo que hace tu billetera"
        description="Cada operación está pensada para ver el efecto sobre tu saldo antes de confirmarla."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <Reveal key={feature.title} delay={(index % 3) * 0.08} className="h-full">
            <div className="flex h-full flex-col gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-6">
              <FeatureIcon icon={feature.icon} />
              <h3 className="font-display text-base font-semibold text-on-surface">
                {feature.title}
              </h3>
              <p className="text-sm text-on-surface-variant">{feature.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

const ASSISTANT_BULLETS = [
  'Tu saldo total y por moneda',
  'Tus últimos movimientos',
  'Resúmenes de tus gastos',
]

export function AssistantSection() {
  const [typed, setTyped] = useState('')
  const questionDone = typed.length === ASSISTANT_DEMO.question.length

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      index += 1
      setTyped(ASSISTANT_DEMO.question.slice(0, index))
      if (index >= ASSISTANT_DEMO.question.length) clearInterval(timer)
    }, 45)

    return () => clearInterval(timer)
  }, [])

  return (
    <section id="asistente" className="relative overflow-hidden py-14">
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
        <Reveal>
          <div className="flex flex-col items-start gap-6">
            <span className="rounded-full border border-outline-variant/60 bg-surface-container-low px-3 py-1 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
              Asistente
            </span>
            <h2 className="font-display text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
              Pregunta por tu dinero, en palabras simples
            </h2>
            <p className="text-base text-on-surface-variant">
              El asistente entiende tus preguntas y responde con la información
              de tu billetera. Sin menús, sin vueltas.
            </p>
            <ul className="flex flex-col gap-2.5 text-sm text-on-surface-variant">
              {ASSISTANT_BULLETS.map((bullet) => (
                <li key={bullet} className="flex items-center gap-2.5">
                  <span className="size-1.5 rounded-full bg-secondary" />
                  {bullet}
                </li>
              ))}
            </ul>
            <ButtonLink to="/register">Probar el asistente</ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-4 shadow-2xl shadow-black/40 sm:p-6">
            <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-tertiary/15 font-display text-sm font-bold text-tertiary">
                A
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-on-surface">
                  Asistente Arcoins
                </span>
                <span className="flex items-center gap-1.5 text-xs text-secondary">
                  <span className="size-1.5 rounded-full bg-secondary" />
                  en línea
                </span>
              </div>
            </div>

            <div className="mt-4 flex min-h-28 flex-col gap-3">
              <div className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-primary-container/25 px-4 py-2.5 text-sm text-on-surface">
                {typed}
                {!questionDone ? (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
                ) : null}
              </div>
              {questionDone ? (
                <m.div
                  className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-surface-container-high px-4 py-2.5 text-sm text-on-surface"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {ASSISTANT_DEMO.answer}
                </m.div>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-3 py-2.5 text-sm text-outline">
              Escribe tu pregunta
              <svg
                viewBox="0 0 24 24"
                className="size-4 text-primary"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m3 3 18 9-18 9 4-9Z" />
              </svg>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

export function Security() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14">
      <SectionHeader
        eyebrow="Confianza"
        title="Movimientos respaldados por reglas claras"
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {SECURITY_ITEMS.map((item, index) => (
          <Reveal key={item.title} delay={index * 0.08} className="h-full">
            <div className="flex h-full flex-col gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-low p-6">
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg
                  viewBox="0 0 24 24"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m4.5 12.5 5 5 10-11" />
                </svg>
              </span>
              <h3 className="font-display text-base font-semibold text-on-surface">
                {item.title}
              </h3>
              <p className="text-sm text-on-surface-variant">{item.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-14">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl border border-outline-variant/40 bg-gradient-to-br from-primary/15 via-surface-container-low to-secondary/15 p-10 text-center sm:p-14">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex flex-col items-center gap-5">
            <h2 className="font-display max-w-2xl text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
              Empieza a usar tu billetera hoy
            </h2>
            <p className="max-w-xl text-base text-on-surface-variant">
              Crea tu cuenta y ten tus tres monedas en un solo lugar, con el
              historial y el asistente incluidos.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink to="/register">Crear mi billetera</ButtonLink>
              <ButtonLink to="/login" variant="ghost">
                Iniciar sesión
              </ButtonLink>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
