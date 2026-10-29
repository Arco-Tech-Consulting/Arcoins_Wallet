import { useId } from 'react'
import { m } from 'motion/react'
import type { RateTick } from '@/lib/market.api'

const TREND_TONE = {
  up: 'text-secondary',
  down: 'text-error',
  flat: 'text-outline',
} as const

export type RateChartTone = keyof typeof TREND_TONE

const VIEWBOX = {
  mini: { width: 240, height: 56, pad: 8 },
  detail: { width: 640, height: 200, pad: 18 },
} as const

/**
 * Escala honesta: el primer valor es la línea base y el eje es simétrico
 * (±span). Así la pendiente dibujada es proporcional al cambio real de la
 * serie, en lugar de exagerar variaciones mínimas llenando todo el alto.
 */
export function computeHonestScale(data: number[]): { baseline: number; span: number } {
  const baseline = data[0]
  const maxDeviation = Math.max(...data.map((value) => Math.abs(value - baseline)))
  const span = Math.max(maxDeviation, Math.abs(baseline) * 0.005)
  return { baseline, span }
}

interface ChartPoint {
  x: number
  y: number
}

/** Curva suave (Catmull-Rom → bezier cúbico) que pasa por todos los puntos */
export function smoothPath(points: ChartPoint[]): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M${fmt(points[0])} L${fmt(points[1])}`
  }

  let d = `M${fmt(points[0])}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? points[i + 1]
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += ` C${fmt(c1)} ${fmt(c2)} ${fmt(p2)}`
  }
  return d
}

function fmt(point: ChartPoint): string {
  return `${point.x.toFixed(2)} ${point.y.toFixed(2)}`
}

/** Fecha corta para el eje: "22 de oct" */
export function formatDateTick(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

interface RateChartProps {
  /** Serie diaria, del día más viejo al más nuevo */
  series: RateTick[]
  /** Dirección de la tendencia, define el color de la curva */
  tone: RateChartTone
  /** Etiqueta accesible de la gráfica */
  label: string
  /** mini: compacta para filas; detail: grande con eje y puntos */
  variant?: 'mini' | 'detail'
  /** Cómo formatear los valores en tooltips (por defecto 2 decimales) */
  formatValue?: (value: number) => string
}

/**
 * Gráfica de línea con área, sin dependencias: curva suave, escala honesta
 * (baseline en el primer valor) y animación de trazado al entrar en vista.
 * El viewBox es proporcional al contenedor para que nada se deforme.
 */
export function RateChart({
  series,
  tone,
  label,
  variant = 'mini',
  formatValue = (value) => value.toFixed(2),
}: RateChartProps) {
  const gradientId = useId()

  if (series.length < 2) {
    return <p className="text-xs text-outline">Sin serie disponible</p>
  }

  const { width, height, pad } = VIEWBOX[variant]
  const { baseline, span } = computeHonestScale(series.map((tick) => tick.rate))
  const center = height / 2
  const amplitude = center - pad

  const points: ChartPoint[] = series.map((tick, index) => ({
    x: pad + (index * (width - pad * 2)) / (series.length - 1),
    y: center - ((tick.rate - baseline) / span) * amplitude,
  }))

  const linePath = smoothPath(points)
  const firstX = points[0].x
  const lastX = points[points.length - 1].x
  const areaPath = `${linePath} L${lastX.toFixed(2)} ${height - pad} L${firstX.toFixed(2)} ${height - pad} Z`
  const lastPoint = points[points.length - 1]
  const circleStyle = { transformBox: 'fill-box', transformOrigin: 'center' } as const

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      className={`w-full h-auto ${TREND_TONE[tone]}`}
    >
      <title>{label}</title>

      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity={0.25} />
          <stop offset="1" stopColor="currentColor" stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Línea base de referencia (el valor del primer día) */}
      <m.line
        x1={pad}
        x2={width - pad}
        y1={center}
        y2={center}
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="4 4"
        vectorEffect="non-scaling-stroke"
        className="text-on-surface-variant/40"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.2 }}
      />

      {/* Área bajo la curva */}
      <m.path
        d={areaPath}
        fill={`url(#${gradientId})`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
      />

      {/* Curva suave */}
      <m.path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth={variant === 'detail' ? 2.5 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      {/* Puntos por día con tooltip nativo (solo detail) */}
      {variant === 'detail'
        ? points.map((point, index) => (
            <m.circle
              key={series[index].date}
              cx={point.x}
              cy={point.y}
              r={4}
              fill="currentColor"
              strokeWidth={1.5}
              className="stroke-surface-container-low"
              style={circleStyle}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: 0.4 + index * 0.05 }}
            >
              <title>
                {`${formatDateTick(series[index].date)} · ${formatValue(series[index].rate)}`}
              </title>
            </m.circle>
          ))
        : null}

      {/* Marcador del último valor (mini) */}
      {variant === 'mini' ? (
        <m.circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={4}
          fill="currentColor"
          strokeWidth={1.5}
          className="stroke-surface-container-low"
          style={circleStyle}
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.25, delay: 0.6 }}
        />
      ) : null}

      {/* Eje de fechas (solo detail) */}
      {variant === 'detail' ? (
        <g className="fill-current text-outline">
          <text x={pad} y={height - 4} fontSize={12}>
            {formatDateTick(series[0].date)}
          </text>
          <text x={width - pad} y={height - 4} fontSize={12} textAnchor="end">
            {formatDateTick(series[series.length - 1].date)}
          </text>
        </g>
      ) : null}
    </svg>
  )
}
