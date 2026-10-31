# Correos de Arcoins: envío directo con AWS SES

Responsable: Chary. Implementación local; pendiente despliegue y prueba real.
No requiere tablas nuevas ni migraciones de correo. La migración 002 de comisiones
es independiente y sigue siendo responsabilidad del módulo financiero.

## Funcionamiento
El backend espera el COMMIT exitoso del registro o la operación y entonces solicita
el correo. Un servicio común consulta el destinatario en users por ID; para movimientos
consulta transactions por ID y propietario, únicamente con status completed.
Nunca utiliza un destinatario elegido por React ni el correo del JWT.

Bienvenida informativa (no verifica la dirección). Confirmaciones para depósitos,
compra/venta/conversión, pagos y transferencias. En transferencias se intenta un
correo al emisor y otro al receptor usando sus respectivos movimientos guardados.
Los mensajes incluyen referencia, fecha UTC, montos y monedas, y comisión si existe.
No incluyen contraseñas, tokens, descripciones libres ni datos de la contraparte.

Cada envío tiene un plazo total de cinco segundos, incluida la consulta del destinatario.
La respuesta de la API puede esperar ese plazo; el fallo del correo no revierte la
operación. Los avisos de una transferencia se solicitan juntos, pero los envíos a SES
se espacian al menos 1,1 segundos por proceso para el entorno de pruebas.
La espera para el turno forma parte del plazo de cinco segundos. Bajo carga se puede
descartar un envío; no es una cola persistente ni un límite compartido entre réplicas.
Un intento por correo, sin reintentos automáticos. SES aceptado no garantiza recepción.
No se guarda historial ni se garantiza recuperación tras reinicios o ausencia de duplicados
si se invoca nuevamente el envío. Un timeout puede ocurrir después de que SES lo acepte.
No existe cron, cola ni comando de reenvío de pendientes.

## Configurar en Render (servicio backend)
- AWS_REGION: us-east-1, la misma región de la identidad verificada.
- AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY: credenciales privadas del usuario IAM de envío.
- SES_FROM_EMAIL: dirección exacta verificada y autorizada en IAM.
- ARCOINS_APP_URL: https://arcoinswallet.vercel.app
- WELCOME_EMAIL_ENABLED: false durante configuración; true para activar bienvenida.
- TRANSACTION_EMAIL_ENABLED: false durante configuración; true para activar confirmaciones.

No requiere WELCOME_EMAIL_ENDPOINT, WELCOME_EMAIL_SECRET ni un proyecto adicional en Vercel.
No copiar credenciales al frontend, Git, capturas ni chat. El SDK usa las variables AWS estándar.
No aplicar 001_welcome_email_events.sql: fue retirada junto al sistema anterior.

## Activación y prueba
1. Subir y desplegar esta versión del backend con ambos interruptores false.
2. Configurar las variables en Render y comprobar permisos ses:SendEmail para el remitente.
3. En SES sandbox verificar también cada destinatario de prueba. Las cuotas de sandbox
   limitan los envíos; otros procesos o réplicas que compartan la cuenta pueden superar la tasa permitida.
4. Activar bienvenida y registrar una cuenta nueva con destinatario verificado.
5. Revisar bandeja/spam y logs genéricos [email]; nunca repetir una operación financiera
   real solo porque no llegó el correo.
6. Activar confirmaciones y probar en entorno de pruebas depósito/conversión/pago/transferencia
   con usuarios verificados. Confirmar que los montos y destinatarios corresponden a cada dueño.
7. Solicitar acceso de producción de SES para enviar a destinatarios no verificados.

Si falla el correo, desactivar su interruptor y revisar configuración, permisos y cuotas.
La cuenta y los movimientos ya confirmados permanecen válidos.
