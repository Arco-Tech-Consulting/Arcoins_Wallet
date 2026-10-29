/** Dispatches only a persisted event ID; never accepts a recipient from React. */
export async function requestWelcomeEmail(userId: string): Promise<boolean> {
    if (process.env.WELCOME_EMAIL_ENABLED !== 'true') return false

    try {
        const endpoint = new URL(process.env.WELCOME_EMAIL_ENDPOINT || '')
        const secret = process.env.WELCOME_EMAIL_SECRET?.trim()
        if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || !secret || secret.length < 32) {
            throw new Error('Invalid mail configuration')
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${secret}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ eventId: userId }),
            redirect: 'error',
            signal: AbortSignal.timeout(3000),
        })
        if (!response.ok) throw new Error('Mail dispatch failed')
        return true
    } catch {
        // Do not log the email, shared secret, response body or password.
        console.warn('[welcome-email] No se confirmó el envío; revisar el evento persistido.')
        return false
    }
}
