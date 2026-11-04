# Arcoins Wallet — Backend

API REST y servicio en tiempo real para la gestión de la billetera digital multi-moneda (**COP / USD / EUR**) desarrollada con **Node.js, Express 5 y TypeScript**.

Permite la autenticación de usuarios mediante JWT, administración de saldos multidivisa, ejecución de transacciones financieras atómicas (depósitos, transferencias P2P entre usuarios, conversiones compra/venta con tasas en tiempo real, comisión y fallback en BD), pagos a comercios, historial de movimientos paginado, notificaciones en tiempo real vía WebSockets (Socket.io), emails transaccionales asíncronos con AWS SES y un asistente financiero virtual interactivo impulsado por Inteligencia Artificial (Google Gemini).

**Servicios en producción:**
- **API Base:** https://arcoins-wallet.onrender.com/
- **Documentación Interactiva (Swagger UI):** https://arcoins-wallet.onrender.com/api-docs
- **Healthcheck:** https://arcoins-wallet.onrender.com/

---

## Stack

| Capa / Función | Tecnología |
| --- | --- |
| Entorno y Lenguaje | Node.js (v24.x / v20+) + TypeScript |
| Framework Web | Express 5 |
| Base de Datos | PostgreSQL (Driver nativo `pg`) |
| Autenticación | JWT (`jsonwebtoken`) + Hashing (`bcryptjs`) |
| Tiempo Real | Socket.io (`socket.io`) sobre HTTP server |
| Notificaciones por Correo | AWS SES v2 (`@aws-sdk/client-sesv2`) con control de cadencia |
| Inteligencia Artificial | Google GenAI SDK (`@google/genai`) con modelo Gemini y fallbacks |
| Tasas de Cambio | ExchangeRate API (`open.er-api.com`) con fallback en PostgreSQL |
| Precisión Numérica | BigNumber.js (`bignumber.js`) para comisiones y cálculos financieros |
| Documentación API | Swagger UI (`swagger-ui-express`) + OpenAPI 3.0.3 (`yaml`) |
| Testing | Vitest + Supertest |
| Ejecución en Desarrollo | `tsx` (TypeScript Execute con recarga rápida) |

---

## Requisitos

- **Node.js 20+** (recomendado **24.x** acorde a la especificación de `engines` en `package.json`)
- **npm** (o gestor compatible)
- Instancia de **PostgreSQL 14+** (local, Docker, o proveedor en la nube como Render, Supabase o Neon)
- **Google Gemini API Key** (obtenible en Google AI Studio para el asistente)
- *(Opcional)* **Credenciales de AWS SES** (para el envío de correos de bienvenida y confirmación de transferencias/transacciones)

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
   Ejecuta los scripts SQL en tu servidor PostgreSQL en el siguiente orden estricto (utilizando `psql`, pgAdmin, DBeaver o la consola del proveedor):
   1. `src/db/setup.sql`: Crea las extensiones (`pgcrypto`), tipos ENUM (`transaction_type`, `transaction_status`), tablas con restricciones de integridad e índices.
   2. `src/db/seed.sql`: Inserta monedas base (`COP`, `USD`, `EUR`), usuarios de prueba, billeteras y comercios iniciales.
   3. `src/db/migrations/002_transaction_commissions.sql`: Agrega las columnas de comisiones a `transactions` (`fee_amount`, `fee_currency`, `fee_rate`), restricciones de cobro y la tabla contable `commission_revenues`.

---

## Variables de Entorno

Se configuran en el archivo `backend/.env` (tomando como plantilla `backend/.env.example`):

### Servidor y Base de Datos
| Variable | Tipo | Descripción | Ejemplo / Recomendado |
| --- | --- | --- | --- |
| `PORT` | Número | Puerto donde escucha el servidor Express y Socket.io | `3000` |
| `DATABASE_URL` | String | URI de conexión a PostgreSQL | `postgresql://usuario:password@localhost:5432/arcoins_db` |
| `FRONTEND_URL` | String | Origen permitido para CORS (Express y Socket.io) | `http://localhost:5173` o `https://arcoinswallet.vercel.app` |

### Autenticación JWT
| Variable | Tipo | Descripción | Ejemplo / Recomendado |
| --- | --- | --- | --- |
| `JWT_SECRET` | String | Llave secreta para firmar y validar tokens JWT | `cadena_secreta_segura` |
| `JWT_EXPIRES_IN` | String | Tiempo de validez del token de sesión | `24h` |

### Inteligencia Artificial (Google Gemini)
| Variable | Tipo | Descripción | Ejemplo / Recomendado |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | String | API Key de Google Gemini para el asistente IA | `AIzaSy...` |
| `GEMINI_MODEL` | String | Modelo principal utilizado por el asistente | `gemini-3.8-flash` |
| `GEMINI_FALLBACK_MODELS` | String | Hasta dos modelos alternativos de respaldo separados por coma | `gemini-2.5-flash,gemini-1.5-flash` |
| `GEMINI_TIMEOUT_MS` | Número | Tiempo máximo de espera para llamadas al SDK de Gemini | `15000` |

### Servicio de Correos (AWS SES)
| Variable | Tipo | Descripción | Ejemplo / Recomendado |
| --- | --- | --- | --- |
| `WELCOME_EMAIL_ENABLED` | Booleano | Activa el envío de correos al registrarse (`true` / `false`) | `false` |
| `TRANSACTION_EMAIL_ENABLED` | Booleano | Activa el envío de comprobantes por transacciones | `false` |
| `AWS_REGION` | String | Región del servicio AWS SES | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | String | Access Key ID del IAM de AWS con permisos SES | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | String | Secret Access Key de AWS | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `SES_FROM_EMAIL` | String | Correo verificado en SES desde donde se envían los mensajes | `notificaciones@tudominio.com` |
| `SES_FROM_NAME` | String | Nombre visible del remitente en el cliente de correo | `"Arcoins Wallet"` |
| `ARCOINS_APP_URL` | String | URL pública del frontend incluida en los enlaces de los correos | `https://arcoinswallet.vercel.app` |

---

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo con hot-reload usando `tsx watch src/index.ts` |
| `npm run build` | Compila el código TypeScript a JavaScript en el directorio `dist/` (`tsc`) |
| `npm start` | Inicia la aplicación compilada en producción (`node dist/index.js`) |
| `npm test` | Ejecuta la suite de pruebas unitarias y de integración con Vitest (`vitest run`) |
| `npm run test:email` | Ejecuta el script de diagnóstico y prueba de conexión hacia AWS SES |

---

## Estructura del Proyecto

```
backend/
├── openapi.yaml               # Especificación OpenAPI 3.0.3 interactiva
├── package.json               # Dependencias, motores y scripts
├── tsconfig.json              # Configuración del compilador TypeScript
├── vitest.config.mts          # Configuración del runner de pruebas Vitest
├── .env.example               # Plantilla de variables de entorno requeridas
└── src/
    ├── config/                # Configuraciones externas y clientes
    │   ├── db.ts              # Pool de conexiones a PostgreSQL (pg)
    │   ├── gemini.config.ts   # Validación y configuración de cliente Google GenAI
    │   └── jwt.config.ts      # Parámetros y lectura de JWT_SECRET
    ├── controllers/           # Manejadores de solicitudes HTTP (req, res)
    │   ├── assistant.controller.ts  # Interacción con el asistente IA
    │   ├── auth.controller.ts       # Registro, login y perfil
    │   ├── financial.controller.ts  # Saldos, tasas, depósitos, conversiones y pagos
    │   ├── merchants.controller.ts  # Consulta de comercios asociados
    │   └── transfer.controller.ts   # Transferencias entre usuarios
    ├── db/                    # Scripts DDL, DML y migraciones PostgreSQL
    │   ├── setup.sql          # Creación inicial de tablas, enums, triggers e índices
    │   ├── seed.sql           # Carga de divisas, comercios y datos de prueba
    │   └── migrations/        # Migraciones evolutivas del esquema
    │       └── 002_transaction_commissions.sql # Comisiones y revenue contable
    ├── docs/                  # Documentación interactiva de la API
    │   └── swagger.ts         # Integración y montaje de Swagger UI
    ├── middlewares/           # Middlewares de Express
    │   ├── assistant-rate-limit.middleware.ts # Limitador de tasa para el chat IA
    │   └── auth.middleware.ts # Validación de token JWT (Bearer Token)
    ├── routes/                # Definición y montaje de rutas de la API
    │   ├── index.ts           # Enrutador central (/api)
    │   ├── assistant.routes.ts# Rutas del asistente (/api/chat)
    │   ├── auth.routes.ts     # Rutas de autenticación (/api/auth)
    │   ├── financial.routes.ts# Rutas financieras y de billetera
    │   ├── merchants.routes.ts# Rutas de comercios
    │   └── transfer.routes.ts # Rutas de transferencias (/api/transfers)
    ├── scripts/               # Scripts utilitarios y de diagnóstico
    │   └── test-ses.ts        # Verificación y prueba de envío con AWS SES
    ├── services/              # Lógica de negocio y repositorios de datos
    │   ├── assistant.errors.ts      # Manejo tipado de errores de Gemini
    │   ├── assistant.service.ts     # Orquestación de prompts y llamada a Gemini
    │   ├── assistant.summary.service.ts # Generación de resumen de cuenta para la IA
    │   ├── assistant.validation.ts  # Sanitización y validación de mensajes
    │   ├── auth.service.ts          # Lógica de registro, hash y autenticación
    │   ├── email.pacing.ts          # Control de cadencia y slots para envío de emails
    │   ├── email.service.ts         # Envío de correos transaccionales con AWS SES
    │   ├── email.templates.ts       # Plantillas HTML/texto de bienvenida y transferencias
    │   ├── exchange-rate.service.ts # Consumo de API de tasas con respaldo en BD
    │   ├── financial.repository.ts  # Operaciones atómicas SQL sobre wallets y saldos
    │   ├── financial.service.ts     # Reglas financieras y cálculo de comisiones (BigNumber)
    │   ├── merchants.repository.ts  # Consultas de comercios asociados
    │   └── transfer.repository.ts   # Transferencias atómicas entre billeteras
    ├── socket/                # Conexiones WebSocket para tiempo real
    │   └── socket.service.ts  # Servidor Socket.io con autenticación JWT
    ├── types/                 # Interfaces y tipos compartidos de TypeScript
    └── index.ts               # Punto de entrada HTTP y WebSocket del servidor
```

---

## Endpoints de la API

Todas las rutas principales de negocio se montan bajo el prefijo `/api`.

### General y Documentación

| Método | Endpoint | Autenticación | Descripción |
| --- | --- | --- | --- |
| `GET` | `/` | Pública | Comprobación de estado (Healthcheck) |
| `GET` | `/api-docs` | Pública | Documentación Swagger UI interactiva |
| `GET` | `/docs` | Pública | Redirección hacia `/api-docs` |

### Autenticación (`/api/auth`)

| Método | Endpoint | Autenticación | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Pública | Registra un nuevo usuario, crea automáticamente su billetera con saldos en 0 (COP, USD, EUR), emite correo de bienvenida (opcional) y retorna token JWT |
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
| `GET` | `/api/rates` | Bearer JWT | Obtiene tasas de cambio vigentes. Admite query params `base` (default `USD`) y `target` (default `COP`) |
| `POST` | `/api/deposit` | Bearer JWT | Ingresa dinero a una moneda de la billetera del usuario |
| `POST` | `/api/transactions` | Bearer JWT | Ejecuta conversiones de divisas (`buy`, `sell`, `exchange`) aplicando comisión (0.5%) y actualización atómica de saldos |
| `GET` | `/api/transactions` | Bearer JWT | Historial de transacciones con filtros opcionales (`type`, `currency`, `from`, `to`, `page`) |
| `POST` | `/api/transfers` | Bearer JWT | Transfiere fondos a otro usuario registrado vía correo (`receiverEmail`) con validación de balance, registro atómico y notificación en tiempo real |
| `POST` | `/api/payments` | Bearer JWT | Realiza un pago directo a un comercio registrado descontando saldo |

### Comercios (`/api`)

| Método | Endpoint | Autenticación | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/merchants` | Bearer JWT | Retorna la lista de comercios asociados disponibles para pagos |

### Asistente Inteligente (`/api`)

| Método | Endpoint | Autenticación | Descripción |
| --- | --- | --- | --- |
| `POST` | `/api/chat` | Bearer JWT | Envía una consulta al asistente con IA (Gemini). Incluye rate-limiting (10 req/min por usuario, HTTP 429) y contexto financiero seguro |

---

## Base de Datos y Modelo de Datos

La persistencia se gestiona en **PostgreSQL** mediante transacciones ACID (`BEGIN ... COMMIT / ROLLBACK`) para garantizar integridad total en operaciones multidivisa y transferencias entre cuentas.

### Principales Tablas

- **`users`**: Identidad del usuario, nombre, credenciales con hash bcrypt y estado activo.
- **`currencies`**: Monedas soportadas con su símbolo, decimales y código ISO (`COP`, `USD`, `EUR`).
- **`wallets`**: Relación 1:1 con `users`.
- **`wallet_balances`**: Saldos individuales por moneda para cada billetera (`wallet_id`, `currency`, `amount >= 0`).
- **`transactions`**: Registro histórico de movimientos (`deposit`, `buy`, `sell`, `exchange`, `transfer_out`, `transfer_in`, `payment`), montos de origen y destino, tasa aplicada, datos de comisión (`fee_amount`, `fee_currency`, `fee_rate`), grupo de transferencia y estado (`completed`, `pending`, `failed`).
- **`commission_revenues`**: Registro contable de ingresos por comisiones recaudadas en conversiones.
- **`exchange_rates`**: Registro de tasas de cambio con timestamp de consulta (`fetched_at`).
- **`merchants`**: Catálogo de comercios admitidos categorizados para pagos directos.

---

## Arquitectura y Convenciones

- **Arquitectura en capas:** Separación desacoplada entre Rutas (`routes/`), Controladores HTTP (`controllers/`), Servicios de negocio (`services/`), Repositorios SQL (`repositories/`) y Capa de Tiempo Real (`socket/`).
- **Atomicidad y Concurrencia:** Las operaciones de débito, crédito, conversiones y transferencias P2P se ejecutan con bloqueos de fila (`SELECT ... FOR UPDATE`) dentro de transacciones SQL, previniendo condiciones de carrera y saldos negativos.
- **WebSockets y Notificaciones:** Servidor Socket.io integrado con autenticación basada en JWT. Al recibir una transferencia, el usuario receptor recibe inmediatamente el evento `transfer_received` si está conectado.
- **Mailing Transaccional Desacoplado:** Envío asíncrono posterior al `COMMIT` de la base de datos para no bloquear las respuestas HTTP, con control de cadencia (*pacing* de máximo 1 envío cada 70 ms) y tolerancia a fallos.
- **Manejo de Errores Normalizado:** Respuestas de error estructuradas con códigos HTTP adecuados (400 para validación y fondos insuficientes, 401 para falta de token, 403 para tokens inválidos/prohibidos, 404 para entidades inexistentes, 429 para exceso de peticiones y 500 para errores internos).
- **Seguridad:** Encriptación de contraseñas con `bcryptjs`, protección de rutas con middleware JWT y cabeceras CORS configurables (`FRONTEND_URL`).

---

## Tests

Las pruebas automáticas están construidas con **Vitest** y **Supertest**:

```bash
npm test
```

La suite cubre:
- Validación de configuración y variables críticas (JWT, Gemini, SES).
- Middleware de autenticación y verificación de tokens.
- Rate limiting del asistente IA.
- Repositorios y servicios financieros, transferencias y comisiones.
- Control de cadencia (*pacing*) y plantillas de correo.
- Validaciones, fallbacks y respuestas del asistente IA.
- Controladores y rutas HTTP completas.

---

## Despliegue

- **Plataforma:** Render
- **URL Base:** `https://arcoins-wallet.onrender.com`
- **Build Command:** `npm install --include=dev && npm run build`
- **Start Command:** `npm start`
- Las variables de entorno (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, etc.) se configuran en el panel de control de Render.

---

## Documentación Relacionada

- [`README.md` (General)](../README.md) — Visión global del proyecto Arcoins Wallet.
- [`frontend/README.md`](../frontend/README.md) — Documentación de la aplicación cliente (React + Vite).
- [`frontend/docs/api-contract.md`](../frontend/docs/api-contract.md) — Contrato y especificación de endpoints consumidos por el cliente.
- [`openapi.yaml`](./openapi.yaml) — Especificación OpenAPI 3.0.3 detallada del backend.
- [`docs/`](../docs/) — Diagramas de arquitectura, casos de uso, flujo y modelo entidad-relación.
