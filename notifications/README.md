# Correos de bienvenida de Arcoins

Proyecto separado de Vercel Functions. La carpeta raíz del proyecto Vercel debe ser `notifications`, no `frontend`.
La función `POST /api/welcome` envía un correo informativo mediante AWS SES. No verifica la dirección ni bloquea el inicio de sesión.

## Flujo

1. Si `WELCOME_EMAIL_ENABLED=true`, el backend crea un evento en `welcome_email_events` en la misma transacción que usuario, billetera y saldos.
2. Después del COMMIT y de liberar la conexión, el controlador solicita el envío a Vercel con un identificador de evento y un secreto de servidor.
3. La función reclama el evento de forma atómica, obtiene el correo desde `users` y llama a SES una sola vez.
4. Guarda el identificador de SES y el estado. Un fallo de transporte o envío no elimina la cuenta ni convierte el registro exitoso en un error HTTP.

No se envían contraseñas, JWT, nombres ni saldos a esta función. No se acepta un destinatario, asunto o HTML desde el navegador.

## Activación por el encargado del backend

Esta implementación está deshabilitada por defecto. No requiere cambiar el frontend.

1. Aplicar `backend/src/db/migrations/001_welcome_email_events.sql` a la misma base PostgreSQL del backend. Es una migración aditiva e idempotente. **No ejecutar de nuevo `setup.sql` sobre la base existente.**
2. Crear/verificar la identidad remitente en AWS SES en la región elegida. Si la cuenta SES está en sandbox, verificar también el destinatario de prueba o usar el simulador de SES. Para destinatarios generales se necesita acceso de producción en esa región.
3. Crear un proyecto Vercel vinculado al repositorio, con Root Directory `notifications`, Framework Preset `Other`, Install Command `npm ci` y Build Command `npm run build`. Sin Output Directory personalizado. Usar Node compatible con las dependencias (22 o 24 soportado por Vercel).
4. Configurar exclusivamente en ese proyecto las variables de `.env.example`:
   - `DATABASE_URL`: conexión PostgreSQL de la misma app, con SSL según el proveedor. No desactivar la validación TLS.
   - `WELCOME_EMAIL_SECRET`: secreto aleatorio de al menos 32 caracteres, idéntico al del backend. No usar el JWT_SECRET.
   - `AWS_REGION`: región de la identidad SES verificada.
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`: credenciales IAM con permiso mínimo `ses:SendEmail` sobre la identidad remitente. También se admite la cadena de credenciales del SDK si se configura un rol.
   - `SES_FROM_EMAIL`: dirección remitente verificada, sin nombre de presentación.
   - `ARCOINS_APP_URL`: URL HTTPS de la app.
5. Desplegar este proyecto y copiar la URL HTTPS completa de `/api/welcome`.
6. En Render configurar `WELCOME_EMAIL_ENDPOINT`, el mismo `WELCOME_EMAIL_SECRET` y `WELCOME_EMAIL_ENABLED=true`. Desplegar el backend actualizado. La URL debe poder ser llamada desde Render; si Vercel Deployment Protection la bloquea, configurar el acceso de servidor antes de habilitar el envío.
7. Registrar un usuario nuevo de prueba. Confirmar registro HTTP 201, cuenta operativa, evento `sent` y recepción del correo. Comprobar spam. SES aceptado (`sent`) no garantiza entrega en la bandeja: revisar rebotes/entrega en AWS.

No habilitar la variable antes de aplicar la migración: el evento debe guardarse junto con el registro y un error de base de datos revierte esa transacción.
Desactivar `WELCOME_EMAIL_ENABLED` conserva el registro actual y no crea eventos nuevos; no se envía retrospectivamente a usuarios antiguos.

## Estados y duplicados

Cada usuario tiene un solo evento de bienvenida (clave primaria `user_id`). El identificador lógico es `user.registered:<user_id>`.

| Estado | Significado | Reintento |
| --- | --- | --- |
| `pending` | No se ha reclamado para envío. | Seguro mediante el procesador. |
| `sending` | Una función lo reclamó. | No automático; si queda atascado, revisar logs y SES. |
| `sent` | SES devolvió MessageId y se guardó. | No reenviar. |
| `uncertain` | Hubo un fallo después de reclamarlo, incluida respuesta perdida o error de DB. | Revisar SES antes de decidir; no automático. |

Las llamadas duplicadas devuelven el estado sin reenviar. SES no proporciona idempotencia para esta llamada: por eso el SDK tiene `maxAttempts: 1` y un timeout de 8 segundos. No se promete entrega exactamente una vez. Una interrupción puede dejar un correo sin enviar y requerir revisión manual.

El backend espera como máximo 3 segundos a Vercel para no retener el registro indefinidamente. Si el cliente HTTP agota ese tiempo, la función puede seguir ejecutándose: el estado persistido es la referencia.

Para procesar hasta 20 eventos **pending**, con las variables del backend configuradas, desde la raíz:

```powershell
npm --prefix backend run emails:retry
```

Ese comando **envía correos reales**. Ejecutarlo solo después de configurar y verificar el entorno. No es una tarea programada; no hay un worker automático de reintentos. No cambiar `sending` o `uncertain` a `pending` sin revisar primero si SES aceptó el correo.

Consulta de soporte sin exponer destinatarios:

```sql
SELECT status, COUNT(*) FROM welcome_email_events GROUP BY status;
```

## Pruebas

```powershell
npm --prefix backend test
npm --prefix backend run build
npm --prefix notifications ci
npm --prefix notifications test
npm --prefix notifications run build
```

Las pruebas simulan DB, HTTP y SES. No envían correos y no prueban las credenciales ni la entrega real. Validación en PostgreSQL/Vercel/SES pendiente.

## Referencias

- [Vercel: funciones Node.js](https://vercel.com/docs/functions/runtimes/node-js)
- [AWS: ejemplos de SES con SDK JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_ses_code_examples.html)
- [AWS: restricciones del sandbox SES](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html)
