# Arcoins Wallet — Backend

API REST para la gestión de la billetera digital multi-moneda (**COP / USD / EUR**) desarrollada con **Node.js, Express 5 y TypeScript**.

Permite la autenticación de usuarios mediante JWT, administración de saldos multidivisa, ejecución de transacciones financieras atómicas (depósitos, conversiones compra/venta con tasas en tiempo real y fallback en BD), pagos a comercios, historial de movimientos y un asistente financiero virtual impulsado por Inteligencia Artificial (Google Gemini).

**Servicios en producción:**
- **API Base:** https://arcoins-wallet.onrender.com/api
- **Documentación Interactiva (Swagger UI):** https://arcoins-wallet.onrender.com/api-docs
- **Healthcheck:** https://arcoins-wallet.onrender.com/

---

## Stack

| Capa / Función | Tecnología |
| --- | --- |
| Entorno y Lenguaje | Node.js (v20+) + TypeScript |
| Framework Web | Express 5 |
| Base de Datos | PostgreSQL (Driver nativo `pg`) |
| Autenticación | JWT (`jsonwebtoken`) + Hashing (`bcryptjs`) |
| Inteligencia Artificial | Google GenAI SDK (`@google/genai`) con modelo Gemini |
| Tasas de Cambio | ExchangeRate API (`open.er-api.com`) con fallback en PostgreSQL |
| Documentación API | Swagger UI (`swagger-ui-express`) + OpenAPI 3.0.3 (`yamljs`) |
| Testing | Vitest + Supertest |
| Ejecución en Desarrollo | `tsx` (TypeScript Execute con recarga rápida) |

---

## Requisitos

- **Node.js 20** o superior
- **npm** (o gestor compatible)
- Instancia de **PostgreSQL 14+** (local, Docker, o proveedor en la nube como Render, Supabase o Neon)
- **Google Gemini API Key** (obtenible en Google AI Studio para el endpoint de asistente)

---

## Instalación y Configuración

1. **Navegar a la carpeta del backend:**
   ```bash
   # desde la raíz del proyecto
   cd backend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Copia el archivo de ejemplo y completa los valores con tus credenciales:
   ```bash
   cp .env.example .env
   ```

4. **Inicializar la base de datos:**
   Ejecuta los scripts SQL en tu servidor PostgreSQL en el siguiente orden (utilizando `psql`, pgAdmin, DBeaver o la consola del proveedor):
   - `src/db/setup.sql`: Crea las extensiones (`pgcrypto`), tipos ENUM, tablas con restricciones e índices.
   - `src/db/seed.sql`: Inserta monedas base (`COP`, `USD`, `EUR`), usuarios de prueba, billeteras y comercios ficticios.

---

## Variables de Entorno

Se configuran en el archivo `backend/.env` (tomando como plantilla `backend/.env.example`):

| Variable | Tipo | Descripción | Ejemplo / Recomendado |
| --- | --- | --- | --- |
| `PORT` | Número | Puerto donde escucha el servidor Express | `3000` |
| `DATABASE_URL` | String | URI de conexión a PostgreSQL | `postgresql://usuario:password@localhost:5432/arcoins_db` |
| `JWT_SECRET` | String | Llave secreta para firmar y validar tokens JWT | `cadena_secreta_segura` |
| `JWT_EXPIRES_IN` | String | Tiempo de validez del token de sesión | `24h` |
| `GEMINI_API_KEY` | String | API Key de Google Gemini para el asistente IA | `AIzaSy...` |
| `GEMINI_MODEL` | String | Modelo de Gemini utilizado por el asistente | `gemini-3.8-flash` o `gemini-2.5-flash` |
| `GEMINI_TIMEOUT_MS` | Número | Tiempo máximo de espera para llamadas a Gemini | `15000` |

---

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo con hot-reload usando `tsx watch src/index.ts` |
| `npm run build` | Compila el código TypeScript a JavaScript en el directorio `dist/` (`tsc`) |
| `npm start` | Inicia la aplicación compilada en producción (`node dist/index.js`) |
| `npm test` | Ejecuta la suite de pruebas unitarias y de integración con Vitest (`vitest run`) |

---

## Estructura del Proyecto

```
backend/
├── openapi.yaml               # Especificación OpenAPI 3.0.3 (raíz backend)
├── package.json               # Dependencias y scripts
├── tsconfig.json              # Configuración del compilador TypeScript
├── .env.example               # Plantilla de variables de entorno requeridas
└── src/
    ├── config/                # Configuraciones externas y clientes
    │   ├── db.ts              # Pool de conexiones a PostgreSQL (pg)
    │   ├── gemini.config.ts   # Inicialización y validación de cliente Google GenAI
    │   └── jwt.config.ts      # Parámetros y lectura de JWT_SECRET
    ├── controllers/           # Manejadores de solicitudes HTTP (req, res)
    │   ├── auth.controller.ts       # Registro, login y perfil
    │   ├── financial.controller.ts  # Saldos, tasas, depósitos, transacciones y pagos
    │   ├── merchants.controller.ts  # Consulta de comercios
    │   └── assistant.controller.ts  # Interacción con el asistente IA
    ├── db/                    # Scripts DDL y DML para PostgreSQL
    │   ├── setup.sql          # Creación de tablas, enums, triggers e índices
    │   └── seed.sql           # Carga inicial de divisas, comercios y datos de prueba
    ├── docs/                  # Documentación interactiva de la API
    │   └── swagger.ts         # Integración y montaje de Swagger UI
    ├── middlewares/           # Middlewares de Express
    │   └── auth.middleware.ts # Validación de token JWT (Bearer Token)
    ├── routes/                # Definición y montaje de rutas de la API
    │   ├── index.ts           # Enrutador central (/api)
    │   ├── auth.routes.ts     # Rutas de autenticación (/api/auth)
    │   ├── financial.routes.ts# Rutas de billetera y operaciones financieras
    │   ├── merchants.routes.ts# Rutas de comercios
    │   └── assistant.routes.ts# Rutas del asistente (/api/chat)
    ├── services/              # Lógica de negocio y acceso a datos
    │   ├── auth.service.ts          # Lógica de registro, hash y autenticación
    │   ├── financial.service.ts     # Validaciones y reglas de negocio financiero
    │   ├── financial.repository.ts  # Operaciones atómicas SQL sobre wallets y balances
    │   ├── exchange-rate.service.ts # Consumo de API de tasas con respaldo en BD
    │   ├── merchants.repository.ts  # Consultas de comercios
    │   └── assistant.service.ts     # Orquestación de prompts y llamada a Gemini
    ├── types/                 # Interfaces y tipos compartidos de TypeScript
    └── index.ts               # Punto de entrada de la aplicación Express
```

---

## Endpoints de la API

Todas las rutas principales de negocio se montan bajo el prefijo `/api`.

### General y Documentación

| Método | Endpoint | Autenticación | Descripción |
| --- | --- | --- | --- |
| `GET` | `/` | Pública | Comprobación de estado (Healthcheck) |
| `GET` | `/api-docs` | Pública | Documentación Swagger UI interactiva |
| `GET` | `/docs` | Pública | Redirección a `/api-docs` |

### Autenticación (`/api/auth`)

| Método | Endpoint | Autenticación | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Pública | Registra un nuevo usuario, crea automáticamente su billetera con saldos en 0 (COP, USD, EUR) y retorna token JWT |
| `POST` | `/api/auth/login` | Pública | Inicia sesión con correo y contraseña, retorna token JWT |
| `GET` | `/api/auth/me` | Bearer JWT | Obtiene los datos del perfil del usuario autenticado |

### Billetera y Saldos (`/api`)

| Método | Endpoint | Autenticación | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/wallet` | Bearer JWT | Obtiene la billetera (`walletId`) del usuario autenticado |
| `GET` | `/api/wallet/balances` | Bearer JWT | Obtiene el saldo detallado de todas las divisas activas (COP, USD, EUR) |
| `GET` | `/api/balance/:walletId/:currency` | Bearer JWT | Consulta el saldo de una moneda específica para la billetera indicada |

### Operaciones Financieras (`/api`)

| Método | Endpoint | Autenticación | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/rates` | Bearer JWT | Obtiene tasas de cambio vigentes (vía ExchangeRate-API con caché/respaldo en BD) |
| `POST` | `/api/deposit` | Bearer JWT | Ingresa dinero a una moneda de la billetera del usuario |
| `POST` | `/api/transactions` | Bearer JWT | Ejecuta conversiones de divisas (`buy`, `sell`, `exchange`) con actualización atómica de saldos |
| `GET` | `/api/transactions` | Bearer JWT | Historial de transacciones con filtros opcionales (`type`, `currency`, `from`, `to`) |
| `POST` | `/api/payments` | Bearer JWT | Realiza un pago directo a un comercio registrado descontando saldo |

### Comercios (`/api`)

| Método | Endpoint | Autenticación | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/merchants` | Bearer JWT | Retorna la lista de comercios asociados disponibles para pagos |

### Asistente Inteligente (`/api`)

| Método | Endpoint | Autenticación | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/chat` | Bearer JWT | Envía un mensaje o consulta financiera al asistente con IA (Gemini) |

---

## Base de Datos y Modelo de Datos

La persistencia se gestiona en **PostgreSQL** mediante transacciones ACID para evitar inconsistencias en operaciones multidivisa.

### Principales Tablas

- **`users`**: Identidad del usuario, nombre, credenciales con hash bcrypt y estado activo.
- **`currencies`**: Monedas soportadas con su símbolo, decimales y código ISO (`COP`, `USD`, `EUR`).
- **`wallets`**: Relación 1:1 con `users`.
- **`wallet_balances`**: Saldos individuales por moneda para cada billetera (`wallet_id`, `currency`, `amount >= 0`).
- **`transactions`**: Registro histórico de movimientos (`deposit`, `buy`, `sell`, `exchange`, `payment`), montos de origen y destino, tasa aplicada y estado (`completed`, `pending`, `failed`).
- **`exchange_rates`**: Registro de tasas de cambio con timestamp de consulta (`fetched_at`).
- **`merchants`**: Catálogo de comercios admitidos categorizados para pagos directos.

---

## Arquitectura y Convenciones

- **Arquitectura en capas:** Separación clara entre Rutas (`routes/`), Controladores HTTP (`controllers/`), Servicios de negocio (`services/`) y Repositorios SQL (`repositories/`).
- **Atomicidad y Concurrencia:** Las operaciones de débito, crédito y conversión se ejecutan dentro de bloques de transacción PostgreSQL (`BEGIN ... COMMIT / ROLLBACK`), garantizando consistencia y control de saldo insuficiente.
- **Manejo de Errores Normalizado:** Respuestas de error estructuradas con códigos HTTP adecuados (400 para validación, 401 para falta de token, 403 para tokens inválidos/prohibidos, 404 para entidades inexistentes y 500 para errores internos).
- **Seguridad:** Encriptación de contraseñas con `bcryptjs`, protección de rutas con middleware JWT y cabeceras CORS habilitadas para el frontend.

---

## Tests

Las pruebas automáticas están construidas con **Vitest** y **Supertest**:

```bash
npm test
```

La suite cubre:
- Validación de configuración y variables críticas (JWT, Gemini).
- Middleware de autenticación y verificación de tokens.
- Repositorios y servicios financieros.
- Validaciones y respuestas del asistente IA.
- Controladores y rutas HTTP.

---

## Despliegue

- **Plataforma:** Render
- **URL Base:** `https://arcoins-wallet.onrender.com`
- **Build Command:** `npm install --include=dev && npm run build`
- **Start Command:** `npm start`
- Las variables de entorno (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, etc.) se configuran en el panel de Render.

---

## Documentación Relacionada

- [`README.md` (General)](../README.md) — Visión global del proyecto Arcoins Wallet.
- [`frontend/README.md`](../frontend/README.md) — Documentación de la aplicación cliente (React + Vite).
- [`frontend/docs/api-contract.md`](../frontend/docs/api-contract.md) — Contrato y especificación de endpoints consumidos por el cliente.
- [`docs/`](../docs/) — Diagramas de arquitectura, casos de uso, flujo y modelo entidad-relación.
