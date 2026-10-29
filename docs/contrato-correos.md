# Contrato de correos de Arcoins

Estado: bienvenida implementada localmente con pruebas simuladas.
Pendiente: aplicar migración, configurar Vercel/AWS SES y validar entrega real.
La confirmación de transacciones aún no está implementada.
Responsable: Chary.

## Tecnología requerida
Vercel Functions y SDK de AWS SES.
Las credenciales se configurarán exclusivamente en el servidor.

## Bienvenida
Enviar después de que el registro se haya guardado correctamente.

Datos mínimos:
- Identificador único del evento.
- Correo del usuario registrado.

Es un correo informativo. No verifica la dirección de correo.

Implementación: proyecto Vercel separado en `notifications/`, con
`POST /api/welcome`, autenticado con secreto exclusivo del backend.
La petición contiene únicamente `eventId` (ID del usuario registrado).
La función obtiene el correo desde PostgreSQL; no lo acepta del navegador.
El evento se guarda junto con el registro, antes del COMMIT, cuando
`WELCOME_EMAIL_ENABLED=true`. Se solicita el envío después del COMMIT.

El estado reside en `welcome_email_events`: pending, sending, sent o uncertain.
Hay un evento por usuario; una reclamación atómica evita envíos concurrentes.
No hay reintentos automáticos de SES. Los resultados inciertos requieren revisión.
Un fallo de correo posterior al registro mantiene la cuenta y la respuesta 201.
La migración debe aplicarse antes de habilitar el envío.

Configuración y operación: `notifications/README.md`.

## Confirmación de transacción
Enviar únicamente después de confirmar y guardar la operación.

Datos mínimos:
- Identificador único del evento.
- Identificador de la transacción.
- Correo del propietario, obtenido por el backend.
- Tipo de operación.
- Montos y monedas involucradas.
- Fecha y hora de la operación.

No incluir contraseñas, tokens ni datos personales innecesarios.

## Relación con el contrato de transacciones

Referencia: frontend/docs/api-contract.md.

La notificación se solicitará desde el backend después de confirmar
la escritura de la operación en la base de datos y comprobar que
su estado sea completed.

No se enviará confirmación de éxito para operaciones pending o failed.

Campos de referencia:
- id: identificador de la transacción.
- type: tipo de operación.
- status: estado.
- fromCurrency y fromAmount: moneda y monto de origen, si corresponden.
- toCurrency y toAmount: moneda y monto de destino, si corresponden.
- createdAt: fecha y hora en formato ISO 8601.

Las monedas se representarán en mayúsculas: COP, USD y EUR.
Los campos que no correspondan a la operación se omitirán del correo.

El destinatario se obtendrá en el backend a partir del propietario
de la operación. No se aceptará un destinatario elegido por React.

Propuesta de identificador del evento:
transaction.completed:<id de la transacción>

Ese identificador permitirá reconocer reintentos del mismo evento.
Queda pendiente acordar el almacenamiento y control de duplicados.

## Fallos y duplicados
Un fallo de correo no debe deshacer una transacción exitosa.
Registrar el estado del envío sin guardar credenciales.
Utilizar el identificador del evento para controlar duplicados.
Para bienvenida, el estado se guarda en PostgreSQL. Para transacciones,
el almacenamiento y el flujo de reintento siguen pendientes.

## Seguridad y pruebas
La función de correo solo aceptará llamadas autorizadas del backend.
El navegador no elegirá destinatarios ni enviará correos directamente.
Durante el desarrollo se utilizarán destinatarios de prueba.

## Acuerdos pendientes
- Marcos/equipo: aplicar migración y configurar secretos, SES y el proyecto Vercel de notificaciones.
- Fabián: momento de confirmación y datos de cada transacción.
- Equipo: validar recepción del correo de bienvenida con un destinatario de prueba.
