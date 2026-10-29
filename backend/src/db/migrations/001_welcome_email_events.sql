-- Ejecutar una vez antes de habilitar WELCOME_EMAIL_ENABLED.
-- No contiene destinatarios ni credenciales.
CREATE TABLE IF NOT EXISTS welcome_email_events (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'sending', 'sent', 'uncertain')),
    attempts INTEGER NOT NULL DEFAULT 0,
    provider_message_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_welcome_email_pending
    ON welcome_email_events (created_at) WHERE status = 'pending';
