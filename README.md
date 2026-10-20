# Arcoins Wallet

Arcoins Wallet es una billetera digital desarrollada como proyecto Full Stack.
Permite a los usuarios gestionar fondos, consultar saldos en varias monedas,
realizar conversiones y registrar movimientos de forma segura y transparente.

**Aplicación en producción**

- Frontend: https://arcoinswallet.vercel.app/
- Backend: https://arcoinswallet-production.up.railway.app/api
- Documentación de la API (Swagger): https://arcoinswallet-production.up.railway.app/api-docs

## Desarrolladores

- Sebastián Pérez
- Fabián Fonnegra
- Marcos Luna
- Chary Morales

## Tecnologías

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router 7,
  TanStack Query.
- **Backend:** Node.js, Express 5, TypeScript.
- **Base de datos:** PostgreSQL.
- **Autenticación:** JWT (Bearer).
- **Inteligencia artificial:** Gemini (Google GenAI) para el asistente.
- **Tasas de cambio:** ExchangeRate API, con respaldo en la base de datos.
- **Despliegue:** Vercel (frontend), Railway (backend).
- **Calidad de código:** Vitest + React Testing Library (frontend), Vitest +
  Supertest (backend), Oxlint, MSW para mocks.

## Funcionalidades

- Registro e inicio de sesión con JWT.
- Gestión de saldos en COP, USD y EUR.
- Compra, venta e intercambio de monedas con la tasa de cambio en vivo.
- Depósitos y pagos a comercios.
- Historial de transacciones con filtros por tipo, moneda y rango de fechas.
- Consulta de tasas de cambio.
- Asistente de inteligencia artificial.
- Calculadora de presupuesto de viaje.

**Pendiente:** transferencias entre usuarios (requiere endpoint en el backend).

## Objetivo

Desarrollar una plataforma de billetera digital que permita gestionar
diferentes tipos de moneda mediante una experiencia sencilla, segura y
transparente.

## Estructura del proyecto

```
Arcoins_Wallet/
├── backend/    API REST (Express + TypeScript), esquema de BD y Swagger
├── frontend/   Aplicación de una sola página (React + Vite)
├── docs/       Diagramas y documentación transversal
└── README.md   Este archivo
```

## Cómo ejecutar el proyecto

Requiere Node.js 20 o superior.

### Backend

```bash
cd backend
npm install
npm run dev        # http://localhost:3000
npm run build      # compila a dist/
npm start          # ejecuta dist/index.js
npm test           # suite de tests
```

Necesita un archivo `backend/.env` con `DATABASE_URL` (ver `backend/.env.example`).
La configuración completa de entornos, comandos y estructura del backend está
documentada en [`backend/README.md`](backend/README.md).

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + build de producción
npm run lint       # lint con Oxlint
npm test           # suite de tests
```

La configuración completa de entornos, comandos y estructura del frontend está
documentada en [`frontend/README.md`](frontend/README.md).

## Documentación

| Recurso | Contenido |
| --- | --- |
| [`backend/README.md`](backend/README.md) | Instalación, variables de entorno, base de datos, endpoints y arquitectura del backend |
| [`frontend/README.md`](frontend/README.md) | Instalación, variables de entorno, estructura y despliegue del frontend |
| [`frontend/docs/api-contract.md`](frontend/docs/api-contract.md) | Contrato de los endpoints consumidos por el frontend |
| `backend/src/docs/openapi.yaml` | Especificación OpenAPI; Swagger UI en `/api-docs` |

### docs/

| Archivo | Contenido |
| --- | --- |
| [`diagramaArquitectura.md`](docs/diagramaArquitectura.md) | Arquitectura general del sistema |
| [`diagramaCasoDeUso.md`](docs/diagramaCasoDeUso.md) | Casos de uso |
| [`diagramaDeFlujo.md`](docs/diagramaDeFlujo.md) | Diagramas de flujo |
| [`diagramaEntidadRelacion.md`](docs/diagramaEntidadRelacion.md) | Modelo entidad-relación |
| [`configuracion-gemini.md`](docs/configuracion-gemini.md) | Configuración de la integración con Gemini |
| [`contrato-asistente.md`](docs/contrato-asistente.md) | Contrato del asistente |
| [`contrato-correos.md`](docs/contrato-correos.md) | Contrato de notificaciones por correo |

## Estado

En producción y en constante iteración.
