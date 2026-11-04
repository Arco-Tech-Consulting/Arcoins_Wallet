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
| Animaciones | Motion (via `LazyMotion` + `domAnimation`, respeta `prefers-reduced-motion`) |
| Routing | React Router 7 (`BrowserRouter`) |
| Estado servidor | TanStack Query 5 (data fetching + caché) |
| Estado de sesión | React Context (JWT) |
| Tiempo real | Socket.IO Client 4 (notificaciones de transferencias) |
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
| `VITE_API_URL` | URL base de la API. | `/api` (dev) · `https://arcoins-wallet.onrender.com/api` (producción) |
| `VITE_SOCKET_URL` | URL del servidor Socket.io para las notificaciones. **Sin `/api` ni barra final.** | omitir (dev local usa `http://localhost:3000`) · `https://arcoins-wallet.onrender.com` (producción) |
| `VITE_ENABLE_MOCKS` | Activa MSW. **Solo aplica en desarrollo** (`npm run dev`); en `npm run build` se ignora y siempre se usa la API real. | `true` / `false` |
| `VITE_PROXY_TARGET` | Destino del proxy de Vite cuando los mocks están desactivados. | `http://localhost:3000` o la URL de Render |

> **Nota importante:** `VITE_*` se inyectan **al compilar**. Si se cambian en
> Vercel, hay que volver a desplegar para que tomen efecto. En Vercel la
> variable debe existir en el scope del entorno que despliega (Production y/o
> Preview) o el preview intentará conectarse a `localhost`.

Para desarrollo local contra el backend real:

```bash
# frontend/.env.development.local
VITE_ENABLE_MOCKS=false
VITE_PROXY_TARGET=https://arcoins-wallet.onrender.com
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
│   │   ├── transfers.api.ts   # transferencias entre usuarios
│   │   ├── merchants.api.ts
│   │   └── chat.api.ts
│   ├── features/              # pantallas, una carpeta por caso de uso
│   │   ├── landing/           # landing page pública
│   │   ├── auth/              # login y registro
│   │   ├── dashboard/         # saldos, tasas en vivo y tendencia 7 días
│   │   ├── transactions/      # operaciones (compra/venta) e historial
│   │   ├── deposit/           # depósito
│   │   ├── payments/          # pagos a comercios
│   │   ├── transfers/         # transferencias entre usuarios
│   │   ├── budget/            # calculadora de presupuesto
│   │   ├── chat/              # asistente IA (panel flotante)
│   │   └── not-found/         # página 404
│   ├── components/            # componentes transversales
│   │   ├── ui/                # primitivas: Button, ButtonLink, Brand, Card, Drawer, Input, Select, Spinner
│   │   ├── TransferToast.tsx  # aviso en vivo de transferencias recibidas
│   │   ├── NotificationBell.tsx # campana + centro de notificaciones
│   │   ├── RateChart.tsx      # gráfica de tendencia de tasas
│   │   └── BalanceCards.tsx   # tarjetas de saldo compartidas
│   ├── context/               # AuthContext (sesión/JWT) y SocketContext (tiempo real)
│   ├── socket/                # cliente Socket.io autenticado con el JWT
│   ├── layouts/               # AuthLayout y AppLayout (con navegación)
│   ├── router/                # ProtectedRoute
│   ├── hooks/                 # hooks compartidos (useBalances, useRate)
│   ├── lib/                   # formatters, market.api (histórico de tasas) y QueryClient
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
| `/` | Landing pública (presentación del producto; con sesión activa redirige a `/dashboard`) | pública |
| `/login` | Inicio de sesión | pública |
| `/register` | Registro | pública |
| `/dashboard` | Dashboard (saldos y últimos movimientos) | protegida |
| `/operations` | Compra, venta e intercambio de moneda | protegida |
| `/deposit` | Depósito | protegida |
| `/payments` | Pago a comercios | protegida |
| `/transfers` | Transferencias entre usuarios por correo | protegida |
| `/history` | Historial de transacciones con filtros | protegida |
| `/budget` | Calculadora de presupuesto | protegida |
| `*` | Página 404 con enlaces de salida | — |

El asistente IA no tiene ruta: vive como widget flotante en todas las
pantallas de la app. La URL antigua `/chat` redirige a `/dashboard`.

Todas las rutas protegidas renderizan dentro de `AppLayout` (navegación de
escritorio + menú lateral en móvil) y requieren JWT; sin token se redirige a
`/login` conservando la ruta de origen para volver tras autenticarse.

---

## Funcionalidades

- **Landing pública:** presentación del producto con hero animado, cifras
  ilustrativas (no reales), sección "Nuestro plus" con el diferencial de
  comisiones (gratis en transferencias y pagos; 0.5% solo al cambiar de
  moneda), cómo funciona y llamados a crear cuenta. Con sesión activa
  redirige a la app.
- **Autenticación:** registro, inicio de sesión y persistencia del JWT
  (`Authorization: Bearer <jwt>` en cada petición).
- **Dashboard:** saldos en las tres monedas con moneda de referencia
  conmutable, tasas de cambio en vivo y comportamiento de cada par de los
  últimos 7 días (gráficas expandibles con mínimo, máximo y variación).
- **Operaciones:** compra/venta/intercambio con la tasa de cambio en vivo
  (open.er-api.com con respaldo en la base de datos) y previsualización del
  resultado antes de confirmar.
- **Depósito:** abono por moneda con previsualización del nuevo saldo.
- **Pagos a comercios:** selección de comercio agrupado por categoría,
  control de fondos insuficientes y descuento real del saldo.
- **Transferencias entre usuarios:** por correo electrónico del receptor,
  con validación de formato, vista previa del saldo restante, notificación
  en tiempo real vía Socket.IO y toast de confirmación.
- **Notificaciones:** toast en vivo al recibir una transferencia + campana
  en el header con badge de pendientes y centro de notificaciones de la
  sesión (el historial se mantiene en memoria hasta cerrar sesión).
- **Historial:** listado paginado con filtros por tipo, moneda y rango de fechas.
- **Asistente IA:** widget flotante en toda la app con respuestas del
  backend (Gemini) y estados de carga, error y reintento.
- **Calculadora de presupuesto:** estimación de un viaje según días y gasto diario.

### Responsive (mobile-first)

- Las pantallas se diseñan apiladas y escalan con `sm:` / `md:` / `lg:`.
- `AppLayout` incluye menú lateral (drawer) para móvil, con cierre al navegar
  y por tecla `Escape`.
- Botones y enlaces con área táctil de al menos 44 px (`min-h-11`).
- Los inputs usan `text-base` en móvil para evitar el zoom automático de iOS.

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
tasa de mercado, presupuesto) y el comportamiento de las pantallas (login,
dashboard, operaciones, historial, depósito, pagos y transferencias) con MSW
respondiendo a la API, junto con los componentes transversales (campana de
notificaciones, gráfica de tasas, toast) y la landing (hero, secciones,
diferencial de comisiones y redirección con sesión activa).

---

## Despliegue

- **Plataforma:** Vercel — https://arcoinswallet.vercel.app/
- **Configuración:** Root Directory `frontend`, preset Vite, build
  `npm run build`, output `dist`.
- **`vercel.json`** define un rewrite de SPA (`/*` → `index.html`) para que las
  rutas internas no den 404 al recargar.
- **Backend:** Render —
  `https://arcoins-wallet.onrender.com/api`

---

## Documentación relacionada

- [`docs/api-contract.md`](docs/api-contract.md) — contrato de endpoints
  consumidos por el frontend.
- `backend/` — documentación de los endpoints del servidor (Swagger/OpenAPI).
