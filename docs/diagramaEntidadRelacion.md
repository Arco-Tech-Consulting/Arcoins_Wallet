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
        numeric amount
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
        varchar from_currency
        varchar to_currency
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
    USERS ||--o{ TRANSACTIONS : "ejecuta"
    MERCHANTS ||--o{ TRANSACTIONS : "recibe_pago"