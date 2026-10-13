# Contrato del asistente de Arcoins

Estado: borrador pendiente de coordinación.
Responsable: Chary.

## Objetivo
Responder preguntas sobre la billetera y ofrecer orientación
educativa sobre organización de gastos y ahorro.

La primera versión no consultará saldos ni movimientos reales.
El asistente no ejecutará operaciones ni modificará cuentas.

## Endpoint propuesto
POST /api/assistant/chat

La ruta completa queda pendiente de confirmar según dónde
se monten los routers del backend.

## Solicitud
El cuerpo será JSON y contendrá únicamente:
- message: texto obligatorio de entre 1 y 2000 caracteres.
- Los mensajes vacíos o compuestos solo por espacios se rechazarán.

No se enviarán userId, walletId, contraseñas ni claves de Gemini.

## Respuesta exitosa
HTTP 200

```json
{
  "success": true,
  "reply": "Una billetera digital permite gestionar saldos y movimientos."
}
```

`reply` contiene el texto que el frontend mostrará en el chat.

## Errores previstos
```json
{
  "success": false,
  "error": "El asistente no está disponible. Intenta más tarde."
}
```

Códigos HTTP propuestos:
- 400: mensaje inválido.
- 401: autenticación ausente o inválida.
- 429: límite de solicitudes alcanzado.
- 502: fallo o respuesta inválida del proveedor de IA.
- 504: tiempo de espera agotado.

Los mensajes serán controlados por nuestro backend.
No se devolverán directamente los errores internos de Gemini.

## Acuerdos pendientes
- Marcos: middleware JWT y ubicación del ID del usuario validado.
- Backend: formato de respuestas y errores, y montaje de la ruta.
- Sebas: consumo de la respuesta y estados de carga/error/reintento.
- Definir el límite de solicitudes por usuario antes de publicar.

## Autenticación y privacidad

La ruta requerirá un JWT válido, verificado por el middleware
de autenticación del backend.

Queda pendiente confirmar con Marcos cómo se transporta el token
y dónde queda disponible la identidad validada en la petición.

El asistente no aceptará userId ni walletId en el cuerpo.
Cuando incorporemos datos financieros, el backend consultará
únicamente los asociados al usuario autenticado.

La clave de Gemini permanecerá exclusivamente en el servidor.
No se enviarán a Gemini contraseñas, tokens ni datos personales
innecesarios.

La primera versión recibirá únicamente el mensaje.
El frontend debe indicar que no se compartan datos sensibles.