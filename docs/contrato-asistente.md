# Contrato del asistente de Arcoins
Estado: resumen financiero integrado al flujo del asistente;
pruebas con repositorio y Gemini simulados aprobadas.
Pendiente: validación con PostgreSQL y Gemini reales, despliegue
y comprobación del flujo completo desde el frontend.
Responsable: Chary.

## Objetivo
Responder preguntas sobre la billetera y ofrecer orientación
educativa sobre organización de gastos y ahorro.

El backend consulta los saldos por moneda y hasta los últimos
10 movimientos del usuario autenticado para preparar un resumen.
El resumen no representa todo el historial ni un informe mensual.

El asistente no ejecutará operaciones ni modificará cuentas.

## Endpoint
POST /api/chat

El servidor monta el router principal bajo /api.
El router del asistente define POST /chat y utiliza authenticateToken
antes de ejecutar el controlador.


## Solicitud
El cuerpo será JSON y contendrá únicamente:
- message: texto obligatorio de entre 1 y 2000 caracteres.
- Los mensajes vacíos o compuestos solo por espacios se rechazarán.

No se enviarán userId, walletId, contraseñas ni claves de Gemini.

## Respuesta exitosa
HTTP 200

```json
{
  "reply": "Una billetera digital permite gestionar saldos y movimientos."
}
```

`reply` contiene el texto que el frontend mostrará en el chat.

## Errores previstos
```json
{
  "error": "El asistente no está disponible. Intenta más tarde."
}
```

Códigos HTTP implementados:
- 400: mensaje inválido.
- 401: autenticación ausente, inválida o expirada.
- 429: límite de 10 solicitudes por minuto por usuario alcanzado.
- 500: error inesperado del servidor.
- 502: fallo o respuesta vacía del proveedor de IA.
- 503: configuración del asistente ausente o inválida.
- 504: tiempo de espera agotado identificado por el servicio.

El límite se aplica después de verificar el JWT y antes de consultar
el resumen o llamar a Gemini. Cuenta todos los intentos autenticados,
incluidos los que terminan en error. La respuesta 429 incluye
Retry-After (segundos) y retryAfterSeconds en el JSON.
El frontend conserva el mensaje y bloquea el envío y el reintento
durante esa espera; no realiza reintentos automáticos.

La ventana dura 60 segundos desde el primer intento de cada usuario.
El almacenamiento es en memoria por instancia, con limpieza de ventanas
vencidas y un máximo de 10 000 usuarios activos. Si se llena, los usuarios
nuevos reciben 503 y Retry-After: 60. Reiniciar el proceso reinicia los cupos.
Antes de escalar a varias réplicas se necesita un almacén compartido.

Los mensajes serán controlados por nuestro backend.
No se devolverán directamente los errores internos de Gemini.

## Acuerdos pendientes
- Validar en el entorno desplegado las respuestas con contexto financiero,
junto con los estados de carga, errores y reintento del frontend.
- Revisar el límite inicial de 10 solicitudes/minuto según la cuota de Gemini.

## Autenticación y privacidad

El middleware existente es authenticateToken.
Después de verificar el JWT, deja la identidad en req.user.
El identificador del usuario está disponible en req.user.id.
La ruta del asistente utiliza este middleware.

Según el contrato del equipo, el JWT se enviará mediante:
Authorization: Bearer <jwt>

El controlador solo utiliza message del cuerpo.
Los campos adicionales se ignoran; no determinan la identidad del usuario.

La clave de Gemini permanecerá exclusivamente en el servidor.
No se enviarán a Gemini contraseñas, tokens ni datos personales
innecesarios.

El frontend envía únicamente el mensaje.
El backend obtiene la identidad desde req.user.id y prepara el resumen.
Gemini recibe el mensaje, los saldos por moneda, hasta 10 movimientos
recientes y la fecha de consulta.

El resumen omite nombres, correos, identificadores internos
y descripciones libres de los movimientos.
Los movimientos incluyen su estado; no todos representan operaciones
completadas. Los montos de distintas monedas se mantienen separados.

Si falla la consulta del resumen, no se llama a Gemini.
El frontend debe informar del uso del resumen y recordar que no se
compartan contraseñas, tokens ni otros datos sensibles.
