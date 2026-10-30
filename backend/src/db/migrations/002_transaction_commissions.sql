
-- Comisiones de compra, venta e intercambio de divisas.
-- La comisión es adicional al monto convertido.
-- No ejecutar en producción sin revisar el despliegue.

ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS fee_amount NUMERIC(20,8),
    ADD COLUMN IF NOT EXISTS fee_currency CHAR(3),
    ADD COLUMN IF NOT EXISTS fee_rate NUMERIC(10,8);


-- La comisión debe ser positiva y la tasa debe estar entre 0 y 1.
-- Las tres columnas deben estar presentes juntas o ser NULL.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_transaction_fee'
          AND conrelid = 'transactions'::regclass
    ) THEN
        ALTER TABLE transactions
            ADD CONSTRAINT chk_transaction_fee
            CHECK (
                (
                    fee_amount IS NULL
                    AND fee_currency IS NULL
                    AND fee_rate IS NULL
                )
                OR
                (
                    type IN ('buy', 'sell', 'exchange')
                    AND fee_amount IS NOT NULL
                    AND fee_currency IS NOT NULL
                    AND fee_rate IS NOT NULL
                    AND fee_amount > 0
                    AND fee_rate > 0
                    AND fee_rate < 1
                    AND fee_currency = from_currency
                )
            );
    END IF;
END
$$;

-- Registro contable de ingresos por comisiones.
CREATE TABLE IF NOT EXISTS commission_revenues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL UNIQUE
        REFERENCES transactions(id),
    currency CHAR(3) NOT NULL
        REFERENCES currencies(code),
    amount NUMERIC(20,8) NOT NULL
        CHECK (amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_revenues_date
    ON commission_revenues (created_at DESC);
