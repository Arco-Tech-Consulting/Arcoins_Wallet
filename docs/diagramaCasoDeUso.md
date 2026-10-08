```mermaid
graph LR
    User((Usuario / Viajero))

    subgraph Sistema Arcoins
        UC1[Registrarse e Iniciar Sesión]
        UC2[Consultar Saldos Multidivisa COP/USD/EUR]
        UC3[consultar tasa de cambio]
        UC4[Comprar Monedas]
        UC5[Vender Monedas]
        UC6[Intercambiar Monedas]
        UC7[Consultar Historial con Filtros]
        UC8[Recibir Correo de Confirmación AWS SES]
        UC9[Interactuar con el Asistente IA Gemini]
        UC10[Calcular Presupuesto de Viaje - Adicional]
    end

    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC9
    User --> UC10