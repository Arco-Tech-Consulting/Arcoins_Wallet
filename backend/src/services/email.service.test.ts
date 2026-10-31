import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ query: vi.fn(), send: vi.fn(), construct: vi.fn(), destroy: vi.fn(), pace: vi.fn() }))
vi.mock('./email.pacing', () => ({ waitForEmailSlot: mocks.pace }))
vi.mock('../config/db', () => ({ pool: { query: mocks.query } }))
vi.mock('@aws-sdk/client-sesv2', () => ({
    SESv2Client: class { constructor(options: unknown) { mocks.construct(options) }; send = mocks.send; destroy = mocks.destroy },
    SendEmailCommand: class { constructor(public input: unknown) {} },
}))
import { requestWelcomeEmail, requestTransactionEmail } from './email.service'
import { transactionTemplate } from './email.templates'
const tx = { id: 'tx1', type: 'exchange', status: 'completed', email: 'owner@example.com',
    from_amount: '10.50', from_currency: 'USD', to_amount: '42000', to_currency: 'COP',
    fee_amount: '0.0525', fee_currency: 'USD', created_at: '2026-10-31T10:00:00Z' }
describe('correo directo SES', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mocks.pace.mockResolvedValue(undefined)
        for (const [key, value] of Object.entries({ WELCOME_EMAIL_ENABLED: 'true', TRANSACTION_EMAIL_ENABLED: 'true',
            AWS_REGION: 'us-east-1', SES_FROM_EMAIL: 'verified@example.com', ARCOINS_APP_URL: 'https://app.example.com' })) vi.stubEnv(key, value)
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'info').mockImplementation(() => {})
        mocks.query.mockResolvedValue({ rows: [tx] })
        mocks.send.mockResolvedValue({ MessageId: 'accepted' })
    })
    afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.useRealTimers() })
    it('envía bienvenida al correo de la BD con un solo intento', async () => {
        expect(await requestWelcomeEmail('u1')).toBe(true)
        expect(mocks.query).toHaveBeenCalledWith(expect.objectContaining({ values: ['u1'] }))
        expect(mocks.construct).toHaveBeenCalledWith({ region: 'us-east-1', maxAttempts: 1 })
        const input = mocks.send.mock.calls[0][0].input
        expect(input.Destination.ToAddresses).toEqual(['owner@example.com'])
        expect(input.Content.Simple.Subject.Charset).toBe('UTF-8')
        expect(input.Content.Simple.Body.Text.Data).toContain('no verifica')
        expect(mocks.destroy).toHaveBeenCalledOnce()
    })
    it('consulta la transacción completed por ID y propietario e incluye su comisión', async () => {
        expect(await requestTransactionEmail('u1', 'tx1')).toBe(true)
        expect(mocks.query).toHaveBeenCalledWith(expect.objectContaining({ values: ['tx1', 'u1'],
            text: expect.stringContaining("t.status = 'completed'") }))
        expect(mocks.query.mock.calls[0][0].text).toContain('t.user_id = $2')
        const body = mocks.send.mock.calls[0][0].input.Content.Simple.Body.Text.Data
        expect(body).toContain('10.50 USD')
        expect(body).toContain('0.0525 USD')
    })
    it('no envía si la consulta no devuelve una operación completada del dueño', async () => {
        mocks.query.mockResolvedValue({ rows: [] })
        expect(await requestTransactionEmail('u1', 'tx-ajena')).toBe(false)
        expect(mocks.send).not.toHaveBeenCalled()
    })
    it('sin activar no consulta ni envía', async () => {
        vi.stubEnv('WELCOME_EMAIL_ENABLED', 'false')
        vi.stubEnv('TRANSACTION_EMAIL_ENABLED', 'false')
        expect(await requestWelcomeEmail('u1')).toBe(false)
        expect(await requestTransactionEmail('u1', 'tx1')).toBe(false)
        expect(mocks.query).not.toHaveBeenCalled()
    })
    it.each(['', 'invalid'])('rechaza remitente inválido %j sin consultar', async (from) => {
        vi.stubEnv('SES_FROM_EMAIL', from)
        expect(await requestWelcomeEmail('u1')).toBe(false)
        expect(mocks.query).not.toHaveBeenCalled()
    })
    it('fallo de BD no se propaga ni envía', async () => {
        mocks.query.mockRejectedValue(new Error('private'))
        expect(await requestWelcomeEmail('u1')).toBe(false)
        expect(mocks.send).not.toHaveBeenCalled()
    })
    it('fallo de SES no se propaga, no reintenta ni revela el correo', async () => {
        mocks.send.mockRejectedValue(new Error('secret owner@example.com'))
        expect(await requestTransactionEmail('u1', 'tx1')).toBe(false)
        expect(mocks.send).toHaveBeenCalledOnce()
        expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('owner@example.com')
    })
    it('respuesta sin MessageId no se considera confirmada', async () => {
        mocks.send.mockResolvedValue({})
        expect(await requestWelcomeEmail('u1')).toBe(false)
    })
    it('cancela SES al cumplir el plazo total', async () => {
        vi.useFakeTimers()
        mocks.send.mockImplementation(() => new Promise(() => {}))
        const promise = requestWelcomeEmail('u1')
        await vi.advanceTimersByTimeAsync(5000)
        expect(await promise).toBe(false)
        expect(mocks.send.mock.calls[0][1].abortSignal.aborted).toBe(true)
        expect(mocks.destroy).toHaveBeenCalledOnce()
        expect(vi.getTimerCount()).toBe(0)
    })
    it('no envía tarde si la consulta de BD supera el plazo', async () => {
        vi.useFakeTimers()
        let resolve!: (value: unknown) => void
        mocks.query.mockImplementation(() => new Promise((r) => { resolve = r }))
        const promise = requestWelcomeEmail('u1')
        await vi.advanceTimersByTimeAsync(5000)
        expect(await promise).toBe(false)
        resolve({ rows: [tx] })
        await Promise.resolve(); await Promise.resolve()
        expect(mocks.send).not.toHaveBeenCalled()
    })
    it('escapa HTML y omite descripciones libres', () => {
        const result = transactionTemplate({ ...tx, id: '<script>bad</script>' }, 'https://app.example.com')
        expect(result.html).not.toContain('<script>')
        expect(result.html).toContain('&lt;script&gt;')
    })
})

it('no envía si se agota el plazo esperando un turno de SES', async () => {
    vi.useFakeTimers()
    vi.stubEnv('WELCOME_EMAIL_ENABLED', 'true')
    vi.stubEnv('AWS_REGION', 'us-east-1')
    vi.stubEnv('SES_FROM_EMAIL', 'verified@example.com')
    vi.stubEnv('ARCOINS_APP_URL', 'https://app.example.com')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mocks.query.mockResolvedValue({ rows: [tx] })
    mocks.send.mockClear()
    let release!: () => void
    mocks.pace.mockImplementationOnce(() => new Promise<void>((r) => { release = r }))
    const result = requestWelcomeEmail('u1')
    await vi.advanceTimersByTimeAsync(5000)
    expect(await result).toBe(false)
    release()
    await Promise.resolve(); await Promise.resolve()
    expect(mocks.send).not.toHaveBeenCalled()
    vi.useRealTimers(); vi.unstubAllEnvs(); warn.mockRestore()
})
