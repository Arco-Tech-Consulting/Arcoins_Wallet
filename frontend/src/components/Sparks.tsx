import { m } from 'motion/react'

const TREND_TONE = {
  up: 'text-secondary',
  down: 'text-error',
  flat: 'text-outline',
} as const

export type SparkTone = keyof typeof TREND_TONE

interface SparksProps {
  /** Valores de la serie, del más viejo al más nuevo */
  data: number[]
  /** Dirección de la tendencia, define el color de la línea */
  tone: SparkTone
  /** Etiqueta accesible de la gráfica */
  label: string
}

/**
 * Sparkline SVG sin dependencias: polilinea proporcional al rango de
 * valores, con animación de trazado y punto final marcado.
 */
export function Sparks({ data, tone, label }: SparksProps) {
  if (data.length < 2) {
    return <p className="text-xs text-outline">Sin serie disponible</p>
  }

  const width = 100
  const height = 28
  const pad = 2
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = pad + (index * (width - pad * 2)) / (data.length - 1)
    const y = height - pad - ((value - min) / range) * (height - pad * 2)
    return { x, y }
  })

  const pathD = points
    .map((point, index) =>
      `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(' ')
  const lastPoint = points[points.length - 1]
  const lastValue = data[data.length - 1]
  const firstValue = data[0]
  const wentUp = lastValue > firstValue

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={`h-10 w-full overflow-visible ${TREND_TONE[tone]}`}
    >
      <m.path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      <m.circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r={2.4}
        className="fill-current"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.7, duration: 0.25 }}
      />
      <title>{`${label} (${wentUp ? 'al alza' : 'a la baja'})`}</title>
    </svg>
  )
}
