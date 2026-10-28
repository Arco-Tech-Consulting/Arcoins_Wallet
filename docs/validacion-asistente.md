# Validación del asistente

## Implementado localmente

- Chat flotante en las páginas autenticadas; conserva la conversación al cerrar y navegar.
- JWT obligatorio e identidad obtenida del token, nunca del cuerpo.
- Mensaje de 1 a 2000 caracteres después de quitar espacios externos.
- Resumen con saldos separados por moneda y hasta 10 movimientos recientes.
- Omisión de correos, nombres, identificadores y descripciones en el resumen enviado a Gemini.
- Errores controlados, estados de carga y reintento sin duplicar mensajes.
- Límite por usuario de 10 solicitudes por ventana de 60 segundos antes de DB/Gemini.
- HTTP 429 con espera indicada y bloqueo temporal del envío en el frontend.

## Comprobaciones locales

Desde la raíz del repositorio:

```powershell
npm --prefix backend test
npm --prefix backend run build
npm --prefix frontend test
npm --prefix frontend run build
```

Las pruebas de proveedores y repositorio usan simulaciones. No confirman acceso real a Gemini o PostgreSQL.
El límite en memoria protege una instancia; varias réplicas requieren almacenamiento compartido.

## Validación pendiente en Render y Vercel

1. Desplegar la versión revisada y comprobar las variables del backend sin publicar secretos.
2. Iniciar sesión con un usuario de prueba y contrastar la respuesta sobre saldos con el dashboard.
3. Repetir con un segundo usuario cuyos saldos sean diferentes; nunca deben mezclarse los datos.
4. Consultar movimientos y comprobar que la respuesta advierta que son hasta 10 recientes, no todo el historial.
5. Verificar que no sume COP, USD y EUR directamente ni considere pendientes/fallidos como completados.
6. Pedir una transferencia: debe explicar que no ejecuta operaciones.
7. Comprobar el chat en móvil, navegación entre páginas, cierre/apertura y cierre de sesión.
8. Verificar 401 sin token y 429 al superar el cupo; después de la espera debe poder reintentarse sin duplicar el mensaje.
9. Confirmar una llamada real exitosa a Gemini. Registrar fecha, versión desplegada y resultado, sin claves, tokens ni datos personales.

La validación real y el problema actual del proveedor quedan pendientes: no marcar el flujo completo como aprobado hasta realizarlos.
