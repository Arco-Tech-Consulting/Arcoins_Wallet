import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ send: vi.fn(), destroy: vi.fn(), constructor: vi.fn(), command: vi.fn() }))
vi.mock('@aws-sdk/client-sesv2', () => ({
    SESv2Client: class {
        constructor(options: unknown) { mocks.constructor(options) }
        send = mocks.send
        destroy = mocks.destroy
    },
    SendEmailCommand: class { constructor(input: unknown) { mocks.command(input) } },
}))
import { sendWelcome } from './sender'
describe('AWS SES', () => {
    beforeEach(() => vi.resetAllMocks())
    afterEach(() => vi.restoreAllMocks())
    const config = { region: 'us-east-1', fromEmail: 'from@example.com', appUrl: 'https://example.com' }
    it('usa un único intento y envía texto/HTML UTF-8 a un destinatario', async () => {
        mocks.send.mockResolvedValue({ MessageId: 'ses-1' })
        expect(await sendWelcome('to@example.com', config)).toBe('ses-1')
        expect(mocks.constructor).toHaveBeenCalledWith({ region: 'us-east-1', maxAttempts: 1 })
        expect(mocks.command).toHaveBeenCalledWith(expect.objectContaining({
            Destination: { ToAddresses: ['to@example.com'] },
            FromEmailAddress: 'from@example.com',
            Content: { Simple: expect.objectContaining({ Body: { Text: expect.objectContaining({ Charset: 'UTF-8' }), Html: expect.objectContaining({ Charset: 'UTF-8' }) } }) },
        }))
        expect(mocks.destroy).toHaveBeenCalledOnce()
    })
    it('no confirma el envío si falta MessageId', async () => {
        mocks.send.mockResolvedValue({})
        await expect(sendWelcome('to@example.com', config)).rejects.toThrow()
        expect(mocks.destroy).toHaveBeenCalledOnce()
    })
})
