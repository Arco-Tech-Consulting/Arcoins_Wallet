import { pool } from '../config/db'
import { requestWelcomeEmail } from '../services/welcome-email.service'

async function main() {
    if (process.env.WELCOME_EMAIL_ENABLED !== 'true') {
        throw new Error('Activa WELCOME_EMAIL_ENABLED antes de procesar los pendientes.')
    }
    const result = await pool.query(
        "SELECT user_id FROM welcome_email_events WHERE status = 'pending' ORDER BY created_at LIMIT 20",
    )
    let accepted = 0
    for (const row of result.rows) {
        if (await requestWelcomeEmail(row.user_id)) accepted += 1
    }
    console.log(`Eventos consultados: ${result.rows.length}; solicitudes aceptadas: ${accepted}. Revisar estados en la base de datos.`)
}

void main().catch(() => {
    console.error('No se pudieron procesar los correos pendientes. Revisa la configuración del servidor.')
    process.exitCode = 1
}).finally(() => pool.end())
