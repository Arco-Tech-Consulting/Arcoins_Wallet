```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar name
        varchar email
        varchar password_hash
        timestamp created_at
    }

    WALLETS {
        uuid id PK
        uuid user_id FK
        timestamp created_at
    }

    CURRENCIES {
        varchar code PK
        varchar name
        varchar symbol
    }

    WALLET_BALANCES {
        uuid id PK
        uuid wallet_id FK
        varchar currency_code FK
        numeric amount "CHECK (amount >= 0)"
    }

    MERCHANTS {
        uuid id PK
        varchar name
        varchar category
        varchar currency
    }

    TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        uuid merchant_id FK "nullable"
        varchar type
        varchar from_currency FK
        varchar to_currency FK
        numeric from_amount
        numeric to_amount
        numeric rate_used
        timestamp rate_timestamp
        varchar status
        timestamp created_at
    }

    EXCHANGE_RATES {
        uuid id PK
        varchar base_currency
        varchar target_currency
        numeric rate
        timestamp fetched_at
    }

    USERS ||--o{ WALLETS : "posee"
    WALLETS ||--o{ WALLET_BALANCES : "contiene"
    CURRENCIES ||--o{ WALLET_BALANCES : "define"
    CURRENCIES ||--o{ TRANSACTIONS : "origen"
    CURRENCIES ||--o{ TRANSACTIONS : "destino"
    USERS ||--o{ TRANSACTIONS : "ejecuta"
    MERCHANTS ||--o{ TRANSACTIONS : "recibe_pago"
