```mermaid
flowchart TD
    Start([Usuario solicita Transacción / Intercambio]) --> AuthCheck{¿Token JWT Válido?}
    
    AuthCheck -->|No| ErrorAuth[Rechazar Petición - 401 Unauthorized]
    AuthCheck -->|Sí| ValidateData[Validar datos de entrada y monedas]
    
    ValidateData --> GetRate[Consultar Tasa en Caché / API Externa]
    GetRate --> CheckBalance{¿Saldo suficiente en origen?}
    
    CheckBalance -->|No| ErrorBalance[Rechazar - Saldo Insuficiente]
    CheckBalance -->|Sí| BeginSQL[Iniciar Transacción SQL en PostgreSQL]
    
    BeginSQL --> UpdateBalances[Restar saldo origen y sumar saldo destino]
    UpdateBalances --> InsertTx[Registrar movimiento en tabla transactions]
    
    InsertTx --> CommitCheck{¿Todo salió bien?}
    
    CommitCheck -->|Error de BD| Rollback[Ejecutar Rollback de Base de Datos]
    Rollback --> ErrorServer[Retornar Error al Cliente]
    
    CommitCheck -->|Éxito| Commit[Confirmar Commit en PostgreSQL]
    Commit --> SendEmail[Enviar Correo Asíncrono con AWS SES]
    SendEmail --> Success[Retornar Respuesta Exitosa 200 OK al Frontend]