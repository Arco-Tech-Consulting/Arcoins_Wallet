# Contrato del asistente de Arcoins
Estado: endpoint implementado; pruebas con Gemini simulado aprobadas.
Pendiente: validación del servidor completo, llamada real a Gemini
y conexión con el frontend.
Responsable: Chary.

## Objetivo
Responder preguntas sobre la billetera y ofrecer orientación
educativa sobre organización de gastos y ahorro.

La primera versión no consultará saldos ni movimientos reales.
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
- 500: error inesperado del servidor.
- 502: fallo o respuesta vacía del proveedor de IA.
- 503: configuración del asistente ausente o inválida.
- 504: tiempo de espera agotado identificado por el servicio.

Pendiente:
- 429: límite de solicitudes alcanzado. El control de frecuencia
  todavía no está implementado.

Los mensajes serán controlados por nuestro backend.
No se devolverán directamente los errores internos de Gemini.

## Acuerdos pendientes
- Integración frontend: conectar el chat con la API real y verificar
  carga, errores y reintento..
- Definir el límite de solicitudes por usuario antes de publicar.

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

La primera versión recibirá únicamente el mensaje.
El frontend debe indicar que no se compartan datos sensibles.

Cuando incorporemos datos financieros, el backend consultará
únicamente los asociados al usuario autenticado.