import { formatSymbolAmount } from '@/lib/formatters'
import type { CurrencyCode } from '@/types/api'

export interface SampleBalance {
  code: CurrencyCode
  name: string
  sample: string
}

export const SAMPLE_BALANCES: SampleBalance[] = [
  { code: 'COP', name: 'Peso colombiano', sample: formatSymbolAmount(1250000, 'COP') },
  { code: 'USD', name: 'Dólar estadounidense', sample: formatSymbolAmount(320.5, 'USD') },
  { code: 'EUR', name: 'Euro', sample: formatSymbolAmount(95.2, 'EUR') },
]

export interface Feature {
  title: string
  description: string
  icon: 'coins' | 'rate' | 'deposit' | 'card' | 'history' | 'chat'
}

export const FEATURES: Feature[] = [
  {
    title: 'Tres monedas, una billetera',
    description: 'COP, USD y EUR conviven en el mismo lugar, sin cálculos manuales.',
    icon: 'coins',
  },
  {
    title: 'Tasas al día',
    description: 'Antes de cada conversión consultamos la tasa del momento.',
    icon: 'rate',
  },
  {
    title: 'Depósitos al instante',
    description: 'Tu saldo se acredita en el momento y queda disponible.',
    icon: 'deposit',
  },
  {
    title: 'Pagos a comercios',
    description: 'Paga con el saldo de la moneda que prefieras.',
    icon: 'card',
  },
  {
    title: 'Historial completo',
    description: 'Filtra tus movimientos por tipo, moneda y rango de fechas.',
    icon: 'history',
  },
  {
    title: 'Asistente con IA',
    description:
      'Pregunta por tu saldo o tus últimos movimientos y recibe la respuesta al instante.',
    icon: 'chat',
  },
]

export interface Step {
  title: string
  description: string
}

export const STEPS: Step[] = [
  {
    title: 'Crea tu cuenta',
    description: 'Regístrate con tu correo y tu billetera queda lista al instante.',
  },
  {
    title: 'Deposita',
    description: 'Agrega saldo en la moneda que necesites: COP, USD o EUR.',
  },
  {
    title: 'Convierte o paga',
    description: 'Cambia entre monedas con la tasa del momento o paga a comercios.',
  },
  {
    title: 'Pregunta al asistente',
    description: 'Consulta tu saldo o tus últimos movimientos por chat.',
  },
]

export interface SecurityItem {
  title: string
  description: string
}

export const SECURITY_ITEMS: SecurityItem[] = [
  {
    title: 'Autenticación con JWT',
    description: 'Tu sesión viaja firmada en cada petición.',
  },
  {
    title: 'Transacciones atómicas',
    description: 'Los movimientos se aplican por completo o no se aplican.',
  },
  {
    title: 'Validación de fondos',
    description: 'Ninguna operación se ejecuta sin saldo suficiente.',
  },
]

export const ASSISTANT_DEMO = {
  question: '¿Cómo va mi saldo en dólares?',
  answer: 'Tienes US$320,50 disponibles. Tu última conversión fue hace 2 días.',
}

export const HERO_SAMPLE = {
  totalCop: formatSymbolAmount(4890000, 'COP'),
  balances: SAMPLE_BALANCES,
  buyAmount: formatSymbolAmount(119.61, 'USD'),
  rateLine: '1 USD = $4.180',
}

export interface PerkRow {
  concept: string
  arcoins: string
  others: string
}

export const PERKS = {
  eyebrow: 'Nuestro plus',
  title: 'Pagas menos por mover tu dinero',
  description:
    'Otras billeteras cobran comisión en (casi) todas tus operaciones. En Arcoins lo que fluye gratis es lo que más usas: transferir y pagar. El único cargo es un mínimo al cambiar de moneda.',
  highlightLabel: 'Arcoins',
  othersLabel: 'Billeteras digitales comunes',
  rows: [
    {
      concept: 'Transferencias entre usuarios',
      arcoins: 'Gratis',
      others: 'Cobran en cada envío y en cada recibido',
    },
    {
      concept: 'Pagos a comercios',
      arcoins: 'Gratis',
      others: 'Cobran porcentual por cada pago',
    },
    {
      concept: 'Compra y venta de monedas',
      arcoins: 'Solo 0.5%',
      others: '1%–3% y cargos ocultos',
    },
  ] satisfies PerkRow[],
  note: 'Comparación ilustrativa frente a billeteras digitales comunes. El 0.5% aplica únicamente al intercambio entre monedas COP, USD y EUR.',
} as const

export const COMPANY_NAME = 'Arco Tech Consulting'
