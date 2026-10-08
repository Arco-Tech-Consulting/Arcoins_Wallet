```mermaid
graph TD
    %% Capa de Cliente
    subgraph Cliente [Frontend - Vercel]
        UI[React + Vite UI/UX] --> AuthState[Gestión de Sesión / JWT]
        UI --> ChatUI[Componente Chat IA]
    end

    %% Capa de Servidor / Backend
    subgraph Servidor [Backend - Railway]
        API[Express.js + TypeScript API]
        
        %% Módulos del Backend
        API --> AuthMiddleware[Middleware de Autenticación JWT]
        API --> WalletController[Lógica de Transacciones y Saldos]
        API --> GeminiService[Servicio de IA Gemini 2.5 Flash]
    end

    %% Capa de Datos y Servicios Externos
    subgraph Persistencia [Base de Datos]
        DB[(PostgreSQL Database <br/> NUMERIC 20,8)]
    end

    subgraph Externos [APIs y Servicios Externos]
        ExchangeAPI[Exchange Rate-API <br/> + Sistema de Caché]
        AWSSES[AWS SES <br/> Correos de Confirmación]
    end

    %% Conexiones principales
    UI -- "Peticiones HTTPS / JSON (Bearer Token)" --> API
    API -- "Lee / Escribe (Transacciones SQL)" --> DB
    WalletController -- "Consulta tasas (con caché)" --> ExchangeAPI
    WalletController -- "Envía correo post-transacción" --> AWSSES
    GeminiService -- "Genera respuestas" --> API