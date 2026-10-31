// Per-process spacing for the SES sandbox (one recipient per second).
// Not a durable queue or a rate limit shared across replicas.
export function createEmailPacer(intervalMs = 1100) {
    let nextSlot = 0
    return async (signal: AbortSignal): Promise<void> => {
        signal.throwIfAborted()
        const now = Date.now()
        const slot = Math.max(now, nextSlot)
        // Never accumulate an unbounded queue of reservations after a traffic burst.
        if (slot - now >= 4000) throw new Error('Mail capacity reached')
        nextSlot = slot + intervalMs
        if (slot === now) return
        await new Promise<void>((resolve, reject) => {
            const onAbort = () => {
                clearTimeout(timer)
                signal.removeEventListener('abort', onAbort)
                reject(new Error('Mail cancelled'))
            }
            const timer = setTimeout(() => {
                signal.removeEventListener('abort', onAbort)
                resolve()
            }, slot - now)
            signal.addEventListener('abort', onAbort, { once: true })
            if (signal.aborted) onAbort()
        })
        signal.throwIfAborted()
    }
}
export const waitForEmailSlot = createEmailPacer()
