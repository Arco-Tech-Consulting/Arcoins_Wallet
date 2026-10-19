# Arcoins Wallet — Frontend

Aplicación web de una **billetera multi-moneda (COP / USD / EUR)** con gestión de
saldos, conversiones, historial, depósitos, pagos a comercios y un asistente
impulsado por IA. Este repositorio contiene la **interfaz de usuario**; el
backend vive en la misma monorepo (`backend/`).

**Demo en producción:** https://arcoinswallet.vercel.app/

---

## Stack

| Capa | Tecnología |
| --- | --- |
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Estilos | Tailwind CSS v4 |
| Routing | React Router 7 (`BrowserRouter`) |
| Estado servidor | TanStack Query 5 (data fetching + caché) |
| Estado de sesión | React Context (JWT) |
| Mocks en desarrollo | MSW 3 |
| Tests | Vitest 5 + React Testing Library |
| Linter | Oxlint |

---

## Requisitos

- Node.js 20 o superior
- npm

---

## Instalación

```bash
# desde la raíz del repositorio
cd frontend
npm install
npm run dev
```

El servidor de desarrollo queda en `http://localhost:5173`.

---

## Variables de entorno

Se definen en archivos `.env*` (ver `frontend/.env.example`).

| Variable | Efecto | Valor recomendado |
| --- | --- | --- |
| `VITE_API_URL` | URL base de la API. | `/api` (dev) · `https://arcoinswallet-production.up.railway.app/api` (producción) |
| `VITE_ENABLE_MOCKS` | Activa MSW. **Solo aplica en desarrollo** (`npm run dev`); en `npm run build` se ignora y siempre se usa la API real. | `true` / `false` |
| `VITE_PROXY_TARGET` | Destino del proxy de Vite cuando los mocks están desactivados. | `http://localhost:3000` o la URL de Railway |

> **Nota importante:** `VITE_*` se inyectan **al compilar**. Si se cambian en
> Vercel, hay que volver a desplegar para que tomen efecto.

Para desarrollo local contra el backend real:

```bash
# frontend/.env.development.local
VITE_ENABLE_MOCKS=false
VITE_PROXY_TARGET=https://arcoinswallet-production.up.railway.app
```

---

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Type-check (`tsc -b`) + build de producción en `dist/` |
| `npm run preview` | Previsualiza el build de producción |
| `npm run lint` | Lint con Oxlint |
| `npm test` | Ejecuta la suite de tests (Vitest) |
| `npm run test:watch` | Tests en modo watch |

---

## Estructura

```
frontend/
├── docs/
│   └── api-contract.md        # contrato de endpoints (fuente de verdad)
├── src/
│   ├── api/                   # capa de acceso a la API (un módulo por dominio)
│   │   ├── client.ts          # fetch base: token, headers, manejo de errores
│   │   ├── auth.api.ts
│   │   ├── wallet.api.ts
│   │   ├── rates.api.ts
│   │   ├── transactions.api.ts
│   │   ├── deposit.api.ts
│   │   ├── merchants.api.ts
│   │   └── chat.api.ts
│   ├── features/              # pantallas, una carpeta por caso de uso
│   │   ├── auth/              # login y registro
│   │   ├── dashboard/         # resumen de saldos y movimientos
│   │   ├── transactions/      # operaciones (compra/venta) e historial
│   │   ├── deposit/           # depósito
│   │   ├── payments/          # pagos a comercios
│   │   ├── budget/            # calculadora de presupuesto
│   │   └── chat/              # asistente IA
│   ├── components/ui/         # primitivas visuales: Button, Card, Input, Select, Spinner
│   ├── context/               # AuthContext (sesión/JWT)
│   ├── layouts/               # AuthLayout y AppLayout (con navegación)
│   ├── router/                # ProtectedRoute
│   ├── hooks/                 # hooks compartidos (p. ej. useRate)
│   ├── lib/                   # formatters y configuración de QueryClient
│   ├── mocks/                 # handlers de MSW
│   ├── test/                  # setup y utilidades de testing
│   ├── types/                 # tipos compartidos del contrato
│   ├── App.tsx                # definición de rutas
│   └── main.tsx               # bootstrap: MSW condicional + providers
├── vercel.json                # rewrites SPA para Vercel
└── vite.config.ts             # alias, proxy, plugins y config de Vitest
```

---

## Rutas

| Ruta | Pantalla | Acceso |
| --- | --- | --- |
| `/login` | Inicio de sesión | pública |
| `/register` | Registro | pública |
| `/` | Dashboard (saldos y últimos movimientos) | protegida |
| `/operations` | Compra, venta e intercambio de moneda | protegida |
| `/deposit` | Depósito | protegida |
| `/payments` | Pago a comercios | protegida |
| `/history` | Historial de transacciones con filtros | protegida |
| `/chat` | Asistente IA | protegida |
| `/budget` | Calculadora de presupuesto | protegida |
| `*` | Redirige a `/` | — |

Todas las rutas protegidas renderizan dentro de `AppLayout` (navegación
superior/lateral) y requieren JWT; sin token se redirige a `/login`.

---

## Funcionalidades

- **Autenticación:** registro, inicio de sesión y persistencia del JWT
  (`Authorization: Bearer <jwt>` en cada petición).
- **Dashboard:** consulta de saldos en las tres monedas y resumen de
  movimientos recientes.
- **Operaciones:** compra/venta/intercambio con la tasa de cambio en vivo
  (open.er-api.com con respaldo en la base de datos) y previsualización del
  resultado antes de confirmar.
- **Depósito:** abono por moneda con previsualización del nuevo saldo.
- **Pagos a comercios:** selección de comercio agrupado por categoría,
  control de fondos insuficientes y descuento real del saldo.
- **Historial:** listado paginado con filtros por tipo, moneda y rango de fechas.
- **Asistente IA:** chat con respuestas del backend (Gemini) y estados de
  carga, error y reintento.
- **Calculadora de presupuesto:** estimación de un viaje según días y gasto diario.

---

## Arquitectura y convenciones

- **Capa `src/api/`:** todo el acceso a la red pasa por `client.ts`, que
  centraliza el token, los headers y la normalización de errores (`ApiError`).
  Si el backend cambia su envoltorio de respuesta, el cambio se aísla aquí.
- **Dominio por carpeta en `src/features/`:** cada pantalla agrupa su
  componente, sus hooks y sus tests.
- **TanStack Query** para datos remotos (`['balances']`, `['transactions']`,
  `['merchants']`, `['rates']`), con invalidación de caché tras cada mutación.
- **Mocking en desarrollo:** MSW cubre todos los endpoints para poder trabajar
  sin backend; se activa únicamente si `DEV && VITE_ENABLE_MOCKS === 'true'`.
- **Español neutro** en toda la UI (sin voseo ni localismos).
- El contrato de endpoints está documentado en
  [`docs/api-contract.md`](docs/api-contract.md) y debe mantenerse sincronizado
  con el backend.

---

## Tests

```bash
npm test
```

Cubren las utilidades puras (formatters, cálculos de operaciones, dashboard,
presupuesto) y el comportamiento de las pantallas (login, dashboard,
operaciones, historial, depósito y pagos) con MSW respondiendo a la API.

---

## Despliegue

- **Plataforma:** Vercel — https://arcoinswallet.vercel.app/
- **Configuración:** Root Directory `frontend`, preset Vite, build
  `npm run build`, output `dist`.
- **`vercel.json`** define un rewrite de SPA (`/*` → `index.html`) para que las
  rutas internas no den 404 al recargar.
- **Backend:** Railway —
  `https://arcoinswallet-production.up.railway.app/api`

---

## Documentación relacionada

- [`docs/api-contract.md`](docs/api-contract.md) — contrato de endpoints
  consumidos por el frontend.
- `backend/` — documentación de los endpoints del servidor (Swagger/OpenAPI).
