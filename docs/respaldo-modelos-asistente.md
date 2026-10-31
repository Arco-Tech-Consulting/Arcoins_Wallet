# Modelos de respaldo del asistente

En Render se mantiene GEMINI_MODEL como principal y se puede configurar
GEMINI_FALLBACK_MODELS con hasta dos nombres alternativos separados por comas.
No hay nombres predeterminados: comprobar disponibilidad y acceso con la misma
clave/proyecto en Google AI Studio antes de activarlos. No introducir claves aquí.

Cada mensaje comienza por el principal. Si responde, no se usan los otros.
Ante 404, 408, errores HTTP 5xx o timeout se intenta el siguiente, una sola vez.
No se cambia ante 400, 401, 403, 429 ni respuestas vacías/bloqueadas.
Los respaldos reciben las mismas instrucciones, mensaje y resumen financiero.
Los logs contienen nombre del error, estado HTTP y modelo, nunca contenido ni clave.

GEMINI_TIMEOUT_MS limita cada intento (15000 ms por defecto). Con dos respaldos
la espera puede llegar aproximadamente a 45 segundos. Se desactivan los reintentos
internos del SDK y se cancela el intento del cliente al agotarse su tiempo.
Cancelar no garantiza que Google detenga el procesamiento o no cobre ese intento.

Los modelos comparten proveedor, clave y proyecto: una caída general de Google,
una clave inválida, restricciones o cuotas compartidas no se solucionan con esto.
Un proveedor independiente requeriría otra integración y revisar el tratamiento de datos.

Para activar: establecer nombres reales permitidos en Render, redesplegar y probar
una consulta autenticada. Las pruebas automáticas simulan respuestas; no validan
la disponibilidad real ni generan consumo de Gemini.
