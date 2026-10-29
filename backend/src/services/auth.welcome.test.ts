import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ query: vi.fn(), connect: vi.fn(), clientQuery: vi.fn(), release: vi.fn() }))
vi.mock('../config/db', () => ({ pool: { query: mocks.query, connect: mocks.connect } }))
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn().mockResolvedValue('hash') } }))
import { AuthService } from './auth.service'

describe('evento de bienvenida dentro del registro', () => {
    const dto = { email: 'test@example.com', password: 'Password1!', firstName: 'Ana', lastName: 'Prueba' }
    beforeEach(() => {
        vi.clearAllMocks()
        vi.stubEnv('JWT_SECRET', 'secret-for-tests')
        vi.stubEnv('WELCOME_EMAIL_ENABLED', 'true')
        mocks.query.mockResolvedValue({ rows: [] })
        mocks.connect.mockResolvedValue({ query: mocks.clientQuery, release: mocks.release })
        mocks.clientQuery.mockImplementation(async (sql: string) => {
            if (sql.includes('INSERT INTO users')) return { rows: [{ id: 'u1', email: dto.email, first_name: 'Ana', last_name: 'Prueba' }] }
            if (sql.includes('INSERT INTO wallets')) return { rows: [{ id: 'w1' }] }
            return { rows: [] }
        })
    })
    afterEach(() => vi.unstubAllEnvs())
    it('guarda un evento por usuario antes del COMMIT', async () => {
        const result = await new AuthService().register(dto)
        expect(result.user.email).toBe(dto.email)
        const calls = mocks.clientQuery.mock.calls
        const event = calls.findIndex(([sql]) => sql.includes('INSERT INTO welcome_email_events'))
        const commit = calls.findIndex(([sql]) => sql === 'COMMIT')
        expect(event).toBeGreaterThan(-1)
        expect(event).toBeLessThan(commit)
        expect(calls[event]?.[1]).toEqual(['u1'])
        expect(mocks.release).toHaveBeenCalledOnce()
    })
    it('revierte cuenta y evento si no puede persistir el evento', async () => {
        const impl = mocks.clientQuery.getMockImplementation()!
        mocks.clientQuery.mockImplementation(async (sql: string, ...args: unknown[]) => {
            if (sql.includes('INSERT INTO welcome_email_events')) throw new Error('DB unavailable')
            return impl(sql, ...args)
        })
        await expect(new AuthService().register(dto)).rejects.toThrow('DB unavailable')
        expect(mocks.clientQuery).toHaveBeenCalledWith('ROLLBACK')
        expect(mocks.clientQuery).not.toHaveBeenCalledWith('COMMIT')
    })
    it('mantiene el registro actual cuando el correo está deshabilitado', async () => {
        vi.stubEnv('WELCOME_EMAIL_ENABLED', 'false')
        await new AuthService().register(dto)
        expect(mocks.clientQuery.mock.calls.some(([sql]) => sql.includes('welcome_email_events'))).toBe(false)
    })
    it('no crea evento para un email ya registrado', async () => {
        mocks.query.mockResolvedValue({ rows: [{ id: 'existente' }] })
        await expect(new AuthService().register(dto)).rejects.toMatchObject({ statusCode: 409 })
        expect(mocks.connect).not.toHaveBeenCalled()
    })
})
