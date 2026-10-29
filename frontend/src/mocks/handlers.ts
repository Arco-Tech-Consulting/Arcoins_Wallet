import { delay, http, HttpResponse } from 'msw'
import type {
  AuthResponse,
  ChatResponse,
  CreatePaymentRequest,
  CreateTransactionRequest,
  CreateTransferRequest,
  CurrencyCode,
  LoginRequest,
  PaginatedTransactions,
  Rate,
  RegisterRequest,
  Transaction,
  TransactionType,
  User,
  Wallet,
  WalletBalance,
} from '@/types/api'

const RATE_FETCHED = new Date().toISOString()

export const DEMO_TOKEN = 'demo-jwt-token'

export const demoUser: User = {
  id: 'usr_demo_001',
  firstName: 'Sebastián',
  lastName: 'Pérez',
  email: 'sebastian@arcoins.app',
}

const balances: WalletBalance[] = [
  { currency: 'COP', amount: 2_500_000 },
  { currency: 'USD', amount: 1_200 },
  { currency: 'EUR', amount: 850 },
]

const wallet: Wallet = { id: 'wal_demo_001' }

const rates: Record<string, number> = {
  'USD->COP': 4_180,
  'EUR->COP': 4_550,
  'EUR->USD': 1.09,
  'COP->USD': 1 / 4_180,
  'COP->EUR': 1 / 4_550,
  'USD->EUR': 1 / 1.09,
}

const merchants = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Café Andino',
    category: 'Restaurantes',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    name: 'Supermercado Central',
    category: 'Supermercado',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    name: 'Hotel Sol del Caribe',
    category: 'Hospedaje',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    name: 'Aerolínea Cielo Azul',
    category: 'Transporte',
  },
]

const transactions: Transaction[] = [
  {
    id: 'tx_001',
    type: 'deposit',
    status: 'completed',
    toCurrency: 'COP',
    toAmount: 2_500_000,
    description: 'Depósito en saldo',
    createdAt: '2026-10-05T10:20:00.000Z',
  },
  {
    id: 'tx_002',
    type: 'buy',
    status: 'completed',
    fromCurrency: 'COP',
    toCurrency: 'USD',
    fromAmount: 836_000,
    toAmount: 200,
    rateUsed: 4_180,
    rateTimestamp: '2026-10-08T09:00:00.000Z',
    description: 'Compra de dólares',
    createdAt: '2026-10-08T09:05:00.000Z',
  },
  {
    id: 'tx_003',
    type: 'exchange',
    status: 'completed',
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    fromAmount: 100,
    toAmount: 91.74,
    rateUsed: 1.09,
    rateTimestamp: '2026-10-10T14:30:00.000Z',
    description: 'Conversión USD a EUR',
    createdAt: '2026-10-10T14:32:00.000Z',
  },
  {
    id: 'tx_004',
    type: 'payment',
    status: 'completed',
    fromCurrency: 'COP',
    fromAmount: 185_000,
    description: 'Estadia en Hotel El Dorado',
    createdAt: '2026-10-12T18:00:00.000Z',
  },
]

function requireAuth(request: Request) {
  const token = request.headers.get('Authorization')
  if (!token || token !== `Bearer ${DEMO_TOKEN}`) {
    return HttpResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
  }
  return null
}

export const handlers = [
  // ---------- Auth ----------
  http.post<never, LoginRequest>('/api/auth/login', async ({ request }) => {
    await delay(300)
    const body = await request.json()
    if (!body.email || !body.password) {
      return HttpResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 400 })
    }
    const response: AuthResponse = { token: DEMO_TOKEN, user: demoUser }
    return HttpResponse.json({ success: true, ...response })
  }),

  http.post<never, RegisterRequest>('/api/auth/register', async ({ request }) => {
    await delay(300)
    const body = await request.json()
    if (!body.email || !body.firstName || !body.lastName || !body.password) {
      return HttpResponse.json({ success: false, error: 'Todos los campos son obligatorios' }, { status: 400 })
    }
    const response: AuthResponse = { token: DEMO_TOKEN, user: demoUser }
    return HttpResponse.json({ success: true, ...response })
  }),

  http.get('/api/auth/me', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(200)
    return HttpResponse.json({ success: true, user: demoUser })
  }),

  // ---------- Wallet ----------
  http.get('/api/wallet', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(200)
    return HttpResponse.json({ success: true, ...wallet })
  }),

  http.get('/api/wallet/balances', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(250)
    return HttpResponse.json({ success: true, data: balances })
  }),

  // ---------- Rates ----------
  http.get('/api/rates', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(200)
    const url = new URL(request.url)
    const base = url.searchParams.get('base') as CurrencyCode
    const target = url.searchParams.get('target') as CurrencyCode
    const rate = rates[`${base}->${target}`]
    if (!rate) {
      return HttpResponse.json({ success: false, error: 'Par de monedas no soportado' }, { status: 400 })
    }
    const response: Rate = { base, target, rate, fetchedAt: RATE_FETCHED }
    return HttpResponse.json({ success: true, ...response })
  }),

  // ---------- Transactions ----------
  http.get('/api/transactions', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(300)
    const url = new URL(request.url)
    const type = url.searchParams.get('type') as TransactionType | null
    const currency = url.searchParams.get('currency') as CurrencyCode | null

    let filtered = transactions
    if (type) filtered = filtered.filter((tx) => tx.type === type)
    if (currency) {
      filtered = filtered.filter(
        (tx) => tx.fromCurrency === currency || tx.toCurrency === currency,
      )
    }
    const response: PaginatedTransactions = {
      data: filtered,
      page: 1,
      total: filtered.length,
    }
    return HttpResponse.json({ success: true, data: response })
  }),

  http.post<never, CreateTransactionRequest>('/api/transactions', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(300)
    const body = await request.json()
    const rate = rates[`${body.fromCurrency}->${body.toCurrency}`]
    if (!rate) {
      return HttpResponse.json({ success: false, error: 'Par de monedas no soportado' }, { status: 400 })
    }
    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      type: body.type,
      status: 'completed',
      fromCurrency: body.fromCurrency,
      toCurrency: body.toCurrency,
      fromAmount: body.fromAmount,
      toAmount: Number((body.fromAmount * rate).toFixed(8)),
      rateUsed: rate,
      rateTimestamp: RATE_FETCHED,
      createdAt: new Date().toISOString(),
    }
    return HttpResponse.json({ success: true, transaction })
  }),

  http.post<never, CreatePaymentRequest>('/api/payments', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(300)
    const body = await request.json()
    const merchant = merchants.find((m) => m.id === body.merchantId)

    if (!body.currency || !body.amount || !body.merchantId) {
      return HttpResponse.json(
        { success: false, error: 'Faltan campos obligatorios para el pago.' },
        { status: 400 },
      )
    }

    const balance = balances.find((b) => b.currency === body.currency)
    if (!balance || balance.amount < body.amount) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Fondos insuficientes para completar la transacción.',
        },
        { status: 400 },
      )
    }
    balance.amount -= body.amount

    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      type: 'payment',
      status: 'completed',
      fromCurrency: body.currency,
      fromAmount: body.amount,
      description: body.description ?? merchant?.name ?? 'Pago registrado',
      createdAt: new Date().toISOString(),
    }
    transactions.unshift(transaction)
    return HttpResponse.json({ success: true, transaction })
  }),

  http.post<never, CreateTransferRequest>('/api/transfers', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(300)
    const body = await request.json()

    if (!body.receiverWalletId || !body.currency || !body.amount || body.amount <= 0) {
      return HttpResponse.json(
        { success: false, error: 'Todos los campos son obligatorios y el monto debe ser mayor a 0.' },
        { status: 400 },
      )
    }

    const balance = balances.find((b) => b.currency === body.currency)
    if (!balance || balance.amount < body.amount) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Fondos insuficientes para completar la transferencia.',
        },
        { status: 400 },
      )
    }
    balance.amount -= body.amount

    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      type: 'transfer_out',
      status: 'completed',
      fromCurrency: body.currency,
      fromAmount: body.amount,
      description: body.description ?? `Transferencia a ${body.receiverWalletId.slice(0, 8)}...`,
      createdAt: new Date().toISOString(),
    }
    transactions.unshift(transaction)
    return HttpResponse.json({ success: true, transaction, transferGroupId: `grp_${Date.now()}` }, { status: 201 })
  }),

  http.post<never, { to_currency: CurrencyCode; to_amount: number; description?: string }>(
    '/api/deposit',
    async ({ request }) => {
      const unauthorized = requireAuth(request)
      if (unauthorized) return unauthorized
      await delay(300)
      const body = await request.json()

      if (!body.to_currency || !body.to_amount || body.to_amount <= 0) {
        return HttpResponse.json(
          { success: false, error: 'Un depósito requiere moneda y monto de destino.' },
          { status: 400 },
        )
      }

      const existing = balances.find((b) => b.currency === body.to_currency)
      if (existing) {
        existing.amount += body.to_amount
      } else {
        balances.push({ currency: body.to_currency, amount: body.to_amount })
      }

      const transaction: Transaction = {
        id: `tx_${Date.now()}`,
        type: 'deposit',
        status: 'completed',
        toCurrency: body.to_currency,
        toAmount: body.to_amount,
        description: body.description ?? 'Depósito en saldo',
        createdAt: new Date().toISOString(),
      }
      transactions.unshift(transaction)

      return HttpResponse.json({ success: true, transaction }, { status: 201 })
    },
  ),

  // ---------- Chat ----------
  http.post<never, { message: string }>('/api/chat', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(500)
    const body = await request.json()
    const response: ChatResponse = {
      reply: `[Demo] Recibido: "${body.message}". Soy el asistente de Arcoins Wallet, pronto podré ayudarte con conversiones y tu historial.`,
    }
    return HttpResponse.json({ success: true, ...response })
  }),

  // ---------- Extras ----------
  http.get('/api/merchants', async ({ request }) => {
    const unauthorized = requireAuth(request)
    if (unauthorized) return unauthorized
    await delay(200)
    return HttpResponse.json({ data: merchants })
  }),

  // ---------- APIs externas de mercado ----------
  // Snapshot diario de currency-api (jsDelivr). Los fines de semana no
  // publican (404), igual que en producción; días hábiles devuelven una
  // tasa sintética con pequeña variación determinista por fecha.
  http.get(
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@:date/v1/currencies/:base.json',
    async ({ params }) => {
      await delay(60)
      const { date, base } = params as { date: string; base: string }
      const day = new Date(`${date}T12:00:00Z`).getUTCDay()
      if (day === 0 || day === 6) {
        return new HttpResponse(null, { status: 404 })
      }
      // Día de la semana: 1=lunes(T=4) ... y algo determinista por fecha
      const seed = Number(date.replaceAll('-', '').slice(-2))
      const usdCop = 4200 + (seed % 20) * 5
      const eurCop = 4500 + (seed % 15) * 7
      const eurUsd = 1.05 + ((seed % 8) * 0.01)
      const baseLower = base.toLowerCase()
      if (baseLower !== 'usd' && baseLower !== 'eur') {
        return new HttpResponse(null, { status: 404 })
      }
      const rates =
        baseLower === 'eur'
          ? { eur: 1, usd: eurUsd, cop: eurCop }
          : { usd: 1, eur: 1 / eurUsd, cop: usdCop }
      return HttpResponse.json({ date, [baseLower]: rates })
    },
  ),
]
