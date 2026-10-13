# Configuración de Gemini

Estado: preparación; integración real pendiente.
Responsable: Chary.

## Variables del servidor

- GEMINI_API_KEY: clave privada para acceder a Gemini.
- GEMINI_MODEL: identificador del modelo que utilizará el asistente.
- GEMINI_TIMEOUT_MS: tiempo máximo de espera en milisegundos.
  Valor inicial propuesto: 15000.

## Seguridad

La clave se configurará únicamente en el backend.
No debe tener prefijo VITE_ ni aparecer en React, Git o logs.
El archivo .env.example contendrá nombres y ejemplos sin secretos.

## Carga de configuración

El backend ya utiliza dotenv.
Coordinar con Marcos la carga de variables al iniciar el servidor.
El servicio de Gemini no debe depender de la conexión a PostgreSQL.

## SDK y modelo verificados

Fecha de consulta: 13 de octubre de 2026.

- SDK oficial para JavaScript/TypeScript: @google/genai.
- Modelo requerido por Henry: gemini-2.5-flash.
- Google limita el acceso a modelos 2.5 a usuarios anteriores.
- El acceso de nuestra cuenta todavía no está probado.
- El modelo se configurará mediante GEMINI_MODEL.
- No se cambiará el modelo requerido sin acuerdo con el mentor.

Fuentes:
- https://ai.google.dev/gemini-api/docs/libraries
- https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash

## Pendientes

- Confirmar dónde se carga la configuración general del servidor.
- Comprobar acceso real al modelo cuando configuremos la clave.
- Consultar al mentor una alternativa si no tenemos acceso.