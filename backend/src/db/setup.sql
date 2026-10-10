-- ---------------------------------------------------------------------
-- 1. EXTENSIONES
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- 2. TIPOS ENUM
-- ---------------------------------------------------------------------
CREATE TYPE transaction_type AS ENUM (
    'deposit',
    'buy',
    'sell',
    'exchange',
    'transfer_out',
    'transfer_in',
    'payment'
);

CREATE TYPE transaction_status AS ENUM (
    'pending',
    'completed',
    'failed'
);

-- ---------------------------------------------------------------------
-- 3. USERS
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email único sin distinguir mayúsculas/minúsculas
CREATE UNIQUE INDEX uq_users_email_lower
    ON users (LOWER(email));

-- ---------------------------------------------------------------------
-- 4. CURRENCIES
-- ---------------------------------------------------------------------
CREATE TABLE currencies (
    code CHAR(3) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    decimals SMALLINT NOT NULL DEFAULT 2
        CHECK (decimals BETWEEN 0 AND 8),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_currency_code_upper
        CHECK (code = UPPER(code))
);

-- ---------------------------------------------------------------------
-- 5. WALLETS
-- ---------------------------------------------------------------------
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE
        REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 6. WALLET_BALANCES
-- ---------------------------------------------------------------------
CREATE TABLE wallet_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL
        REFERENCES wallets(id) ON DELETE CASCADE,
    currency CHAR(3) NOT NULL
        REFERENCES currencies(code),
    amount NUMERIC(20,8) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_wallet_currency
        UNIQUE (wallet_id, currency),

    CONSTRAINT chk_balance_not_neg
        CHECK (amount >= 0)
);

-- ---------------------------------------------------------------------
-- 7. EXCHANGE_RATES
-- ---------------------------------------------------------------------
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_currency CHAR(3) NOT NULL
        REFERENCES currencies(code),
    target_currency CHAR(3) NOT NULL
        REFERENCES currencies(code),
    rate NUMERIC(20,10) NOT NULL
        CHECK (rate > 0),
    source VARCHAR(50) NOT NULL DEFAULT 'ExchangeRate-API',
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),    

    CONSTRAINT chk_rate_diff_currencies
        CHECK (base_currency <> target_currency)
);

-- Permite conservar el historial de tasas y consultar la más reciente.
CREATE INDEX idx_rates_pair_latest
    ON exchange_rates (
        base_currency,
        target_currency,
        fetched_at DESC
    );

-- ---------------------------------------------------------------------
-- 8. MERCHANTS
-- ---------------------------------------------------------------------
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL UNIQUE,
    category VARCHAR(60) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 9. TRANSACTIONS
-- Cada transferencia genera dos filas vinculadas mediante
-- transfer_group_id: transfer_out y transfer_in.
-- ---------------------------------------------------------------------
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES users(id),
    type transaction_type NOT NULL,
    status transaction_status NOT NULL DEFAULT 'completed',

    from_currency CHAR(3)
        REFERENCES currencies(code),
    to_currency CHAR(3)
        REFERENCES currencies(code),
    from_amount NUMERIC(20,8)
        CHECK (from_amount > 0),
    to_amount NUMERIC(20,8)
        CHECK (to_amount > 0),

    rate_used NUMERIC(20,10)
        CHECK (rate_used > 0),
    rate_timestamp TIMESTAMPTZ,

    counterpart_user_id UUID
        REFERENCES users(id),
    transfer_group_id UUID,
    merchant_id UUID
        REFERENCES merchants(id),
    description VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Depósito: solo se recibe una cantidad en una moneda.
    CONSTRAINT chk_deposit CHECK (
        type <> 'deposit' OR (
            to_currency IS NOT NULL
            AND to_amount IS NOT NULL
            AND from_currency IS NULL
            AND from_amount IS NULL
            AND rate_used IS NULL
            AND rate_timestamp IS NULL
            AND merchant_id IS NULL
            AND counterpart_user_id IS NULL
            AND transfer_group_id IS NULL
        )
    ),

    -- Compra, venta o conversión entre monedas diferentes.
    CONSTRAINT chk_conversion CHECK (
        type NOT IN ('buy', 'sell', 'exchange') OR (
            from_currency IS NOT NULL
            AND to_currency IS NOT NULL
            AND from_currency <> to_currency
            AND from_amount IS NOT NULL
            AND to_amount IS NOT NULL
            AND rate_used IS NOT NULL
            AND rate_timestamp IS NOT NULL
            AND merchant_id IS NULL
            AND counterpart_user_id IS NULL
            AND transfer_group_id IS NULL
        )
    ),

    -- Pago a un comercio.
    CONSTRAINT chk_payment CHECK (
        type <> 'payment' OR (
            from_currency IS NOT NULL
            AND from_amount IS NOT NULL
            AND merchant_id IS NOT NULL
            AND to_currency IS NULL
            AND to_amount IS NULL
            AND rate_used IS NULL
            AND rate_timestamp IS NULL
            AND counterpart_user_id IS NULL
            AND transfer_group_id IS NULL
        )
    ),

    -- Transferencia enviada.
    CONSTRAINT chk_transfer_out CHECK (
        type <> 'transfer_out' OR (
            from_currency IS NOT NULL
            AND from_amount IS NOT NULL
            AND counterpart_user_id IS NOT NULL
            AND transfer_group_id IS NOT NULL
            AND to_currency IS NULL
            AND to_amount IS NULL
            AND rate_used IS NULL
            AND rate_timestamp IS NULL
            AND merchant_id IS NULL
            AND counterpart_user_id <> user_id
        )
    ),

    -- Transferencia recibida.
    CONSTRAINT chk_transfer_in CHECK (
        type <> 'transfer_in' OR (
            to_currency IS NOT NULL
            AND to_amount IS NOT NULL
            AND counterpart_user_id IS NOT NULL
            AND transfer_group_id IS NOT NULL
            AND from_currency IS NULL
            AND from_amount IS NULL
            AND rate_used IS NULL
            AND rate_timestamp IS NULL
            AND merchant_id IS NULL
            AND counterpart_user_id <> user_id
        )
    )
);

-- ---------------------------------------------------------------------
-- 10. ÍNDICES PARA CONSULTAS FRECUENTES
-- ---------------------------------------------------------------------

-- Historial de cada usuario
CREATE INDEX idx_tx_user_date
    ON transactions (user_id, created_at DESC);

-- Filtrado del historial por tipo
CREATE INDEX idx_tx_user_type
    ON transactions (user_id, type);

-- Localización de las dos filas de una transferencia
CREATE INDEX idx_tx_group
    ON transactions (transfer_group_id)
    WHERE transfer_group_id IS NOT NULL;

-- Historial recibido por usuario
CREATE INDEX idx_tx_counterpart_date
    ON transactions (counterpart_user_id, created_at DESC)
    WHERE counterpart_user_id IS NOT NULL;

-- Historial de pagos por comercio
CREATE INDEX idx_tx_merchant
    ON transactions (merchant_id)
    WHERE merchant_id IS NOT NULL;

-- Saldos por moneda
CREATE INDEX idx_wallet_balances_currency
    ON wallet_balances (currency);