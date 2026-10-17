# Contrato de endpoints — Arcoins Wallet

Rutas que consume el **frontend**. El backend debe respetar estos paths, bodies y respuestas.

## Convenciones

- **Base URL:** `/api` (configurable con `VITE_API_URL`).
- **Auth:** header `Authorization: Bearer <jwt>` en todas las rutas salvo `register` y `login`.
- **Monedas:** mayúsculas — `"COP" | "USD" | "EUR"`.
- **IDs:** string.
- **Fechas:** ISO 8601.
- **Errores:** `{ "error": "mensaje" }`. Un `401` limpia el token del cliente.

## Auth

### POST /api/auth/register

```json
// req
{ "firstName": "Ana", "lastName": "Pérez", "email": "ana@arcoins.app", "password": "secreta" }

// res
{ "token": "<jwt>", "user": { "id": "u1", "firstName": "Ana", "lastName": "Pérez", "email": "ana@arcoins.app" } }
```

### POST /api/auth/login

```json
// req
{ "email": "ana@arcoins.app", "password": "secreta" }

// res
{ "token": "<jwt>", "user": { "id": "u1", "firstName": "Ana", "lastName": "Pérez", "email": "ana@arcoins.app" } }
```

### GET /api/auth/me

```json
// res
{ "user": { "id": "u1", "firstName": "Ana", "lastName": "Pérez", "email": "ana@arcoins.app" } }
```

## Billetera / Saldos

### GET /api/wallet

```json
// res
{ "id": "w1" }
```

### GET /api/wallet/balances

```json
// res — las 3 monedas
{ "data": [ { "currency": "COP", "amount": 1250000 }, { "currency": "USD", "amount": 320.5 }, { "currency": "EUR", "amount": 95.2 } ] }
```

## Tasas

### GET /api/rates?base=USD&target=COP

```json
// res
{ "base": "USD", "target": "COP", "rate": 4180, "fetchedAt": "2026-10-14T12:00:00.000Z" }
```

## Transacciones

### GET /api/transactions?type=&currency=&from=&to=&page=

Query params opcionales: `type`, `currency`, `from` (fecha), `to` (fecha), `page` (1-based, pageSize 10).

```json
// res
{
  "data": {
    "data": [ /* Transaction[] */ ],
    "page": 1,
    "total": 42
  }
}
```

### POST /api/transactions

```json
// req
{ "type": "buy", "fromCurrency": "COP", "toCurrency": "USD", "fromAmount": 500000 }
// type: "buy" | "sell" | "exchange"

// res
{ "transaction": { /* Transaction */ } }
```

### POST /api/payments

```json
// req
{ "currency": "COP", "amount": 25000, "merchantId": "m1", "description": "Café" }

// res
{ "transaction": { /* Transaction */ } }
```

## Comercios

### GET /api/merchants

```json
// res — solo comercios activos
{ "data": [ { "id": "c0000000-0000-0000-0000-000000000001", "name": "Café Andino", "category": "Restaurantes" } ] }
```

## Chat IA

### POST /api/chat

```json
// req
{ "message": "¿Cómo va mi saldo?" }

// res
{ "reply": "Tu saldo es ..." }
```

## Modelo `Transaction`

```json
{
  "id": "t1",
  "type": "buy",
  "status": "completed",
  "fromCurrency": "COP",
  "toCurrency": "USD",
  "fromAmount": 500000,
  "toAmount": 119.61,
  "rateUsed": 4180,
  "rateTimestamp": "2026-10-14T12:00:00.000Z",
  "description": "Compra de dólares",
  "createdAt": "2026-10-14T12:00:05.000Z"
}
```

- `type`: `"deposit" | "buy" | "sell" | "exchange" | "transfer_out" | "transfer_in" | "payment"`
- `status`: `"pending" | "completed" | "failed"`

## Notas

- Las respuestas **no** están envueltas de forma uniforme: `auth` devuelve `token`/`user` en la raíz, las transacciones `{ transaction }`, la lista `{ data: { data, page, total } }`. Si se prefiere unificar todo bajo `{ success, data }`, es un cambio acotado en `src/api/`.
- Los mocks actuales (`src/mocks/handlers.ts`) respetan estas formas; sirven de referencia viva.
