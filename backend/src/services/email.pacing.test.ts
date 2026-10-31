import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createEmailPacer } from './email.pacing'
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(10000) })
afterEach(() => vi.useRealTimers())
it('separa dos envíos simultáneos al menos 1100 ms', async () => {
    const pace = createEmailPacer()
    const signal = new AbortController().signal
    await pace(signal)
    const ready = vi.fn()
    const second = pace(signal).then(ready)
    await vi.advanceTimersByTimeAsync(1099)
    expect(ready).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await second
    expect(ready).toHaveBeenCalledOnce()
})
it('cancela la espera y limpia el temporizador', async () => {
    const pace = createEmailPacer()
    const abort = new AbortController()
    await pace(abort.signal)
    const waiting = pace(abort.signal)
    const check = expect(waiting).rejects.toThrow('Mail cancelled')
    abort.abort()
    await check
    expect(vi.getTimerCount()).toBe(0)
})
it('rechaza exceso de solicitudes sin reservar una cola ilimitada', async () => {
    const pace = createEmailPacer()
    const signal = new AbortController().signal
    const scheduled = Array.from({ length: 4 }, () => pace(signal))
    await expect(pace(signal)).rejects.toThrow('Mail capacity')
    await vi.advanceTimersByTimeAsync(3300)
    await Promise.all(scheduled)
    const next = pace(signal)
    await vi.advanceTimersByTimeAsync(1100)
    await next
})
