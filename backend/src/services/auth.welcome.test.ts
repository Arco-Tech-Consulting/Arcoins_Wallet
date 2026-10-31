import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ query: vi.fn(), connect: vi.fn(), clientQuery: vi.fn(), release: vi.fn() }))
vi.mock('../config/db', () => ({ pool: { query: mocks.query, connect: mocks.connect } }))
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn().mockResolvedValue('hash') } }))
import { AuthService } from './auth.service'

describe('registro independiente de tablas de correo', () => {
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
    it('confirma la cuenta sin consultar tablas de correo aun cuando está habilitado', async () => {
        const result = await new AuthService().register(dto)
        expect(result.user.email).toBe(dto.email)
        expect(mocks.clientQuery.mock.calls.some(([sql]) => sql.includes('welcome_email_events'))).toBe(false)
        expect(mocks.clientQuery).toHaveBeenCalledWith('COMMIT')
        expect(mocks.release).toHaveBeenCalledOnce()
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
