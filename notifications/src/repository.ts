import { Pool } from 'pg'

let pool: Pool | undefined
function database() {
    if (!pool) {
        if (!process.env.DATABASE_URL) throw new Error('Missing database configuration')
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 2,
            connectionTimeoutMillis: 3000,
            statement_timeout: 5000,
        })
    }
    return pool
}

export const welcomeRepository = {
    async claim(eventId: string): Promise<string | null> {
        // Single atomic claim: concurrent invocations cannot send the same event twice.
        const result = await database().query(
            `WITH claimed AS (
                UPDATE welcome_email_events SET status = 'sending', attempts = attempts + 1, updated_at = NOW()
                WHERE user_id = $1 AND status = 'pending' RETURNING user_id
            ) SELECT u.email FROM claimed c JOIN users u ON u.id = c.user_id`,
            [eventId],
        )
        return result.rows[0]?.email ?? null
    },
    async status(eventId: string): Promise<string | null> {
        const result = await database().query('SELECT status FROM welcome_email_events WHERE user_id = $1', [eventId])
        return result.rows[0]?.status ?? null
    },
    async sent(eventId: string, messageId: string) {
        await database().query(
            "UPDATE welcome_email_events SET status = 'sent', provider_message_id = $2, sent_at = NOW(), updated_at = NOW() WHERE user_id = $1 AND status = 'sending'",
            [eventId, messageId],
        )
    },
    async uncertain(eventId: string) {
        await database().query(
            "UPDATE welcome_email_events SET status = 'uncertain', updated_at = NOW() WHERE user_id = $1 AND status = 'sending'",
            [eventId],
        )
    },
}
