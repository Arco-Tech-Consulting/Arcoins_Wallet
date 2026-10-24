import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    getWalletByUserId: vi.fn(),
    getWalletBalances: vi.fn(),
    getTransactions: vi.fn(),
}))

vi.mock('./financial.repository', () => ({
    FinancialRepository: class {
        getWalletByUserId = mocks.getWalletByUserId
        getWalletBalances = mocks.getWalletBalances
        getTransactions = mocks.getTransactions
    },
}))

import { getAssistantFinancialSummary } from './assistant.summary.service'

describe('getAssistantFinancialSummary', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('rechaza un usuario vacío sin consultar el repositorio', async () => {
        await expect(getAssistantFinancialSummary('   ')).rejects.toThrow(
            'Se requiere un usuario autenticado.',
        )

        expect(mocks.getWalletByUserId).not.toHaveBeenCalled()
        expect(mocks.getWalletBalances).not.toHaveBeenCalled()
        expect(mocks.getTransactions).not.toHaveBeenCalled()
    })

    it('rechaza una billetera inexistente sin consultar saldos ni movimientos', async () => {
        mocks.getWalletByUserId.mockResolvedValue(null)

        await expect(
            getAssistantFinancialSummary('usuario-prueba'),
        ).rejects.toThrow('Billetera no encontrada.')

        expect(mocks.getWalletByUserId).toHaveBeenCalledWith('usuario-prueba')
        expect(mocks.getWalletBalances).not.toHaveBeenCalled()
        expect(mocks.getTransactions).not.toHaveBeenCalled()
    })

    it('construye el resumen con los datos del usuario indicado', async () => {
        mocks.getWalletByUserId.mockResolvedValue({
            id: 'billetera-prueba',
            user_id: 'usuario-prueba',
        })

        mocks.getWalletBalances.mockResolvedValue([
            { currency: 'COP', amount: 150000 },
            { currency: 'USD', amount: 25 },
        ])

        mocks.getTransactions.mockResolvedValue({
            data: [
                {
                    id: 'movimiento-prueba',
                    type: 'deposit',
                    status: 'completed',
                    fromCurrency: null,
                    toCurrency: 'COP',
                    fromAmount: null,
                    toAmount: 150000,
                    createdAt: new Date('2026-10-24T12:00:00.000Z'),
                    description: 'Información que no debe incluirse',
                },
            ],
            page: 1,
            total: 1,
        })

        const summary = await getAssistantFinancialSummary('usuario-prueba')

        expect(mocks.getWalletByUserId).toHaveBeenCalledWith('usuario-prueba')
        expect(mocks.getWalletBalances).toHaveBeenCalledWith('billetera-prueba')
        expect(mocks.getTransactions).toHaveBeenCalledWith('usuario-prueba', {
            page: '1',
        })

        expect(summary).toEqual({
            generatedAt: expect.any(String),
            balances: [
                { currency: 'COP', amount: 150000 },
                { currency: 'USD', amount: 25 },
            ],
            recentTransactions: [
                {
                    type: 'deposit',
                    status: 'completed',
                    fromCurrency: null,
                    toCurrency: 'COP',
                    fromAmount: null,
                    toAmount: 150000,
                    createdAt: '2026-10-24T12:00:00.000Z',
                },
            ],
        })

        expect(Number.isNaN(Date.parse(summary.generatedAt))).toBe(false)
    })

    it('devuelve listas vacías cuando no hay saldos ni movimientos registrados', async () => {
        mocks.getWalletByUserId.mockResolvedValue({
            id: 'billetera-prueba',
        })

        mocks.getWalletBalances.mockResolvedValue([])
        mocks.getTransactions.mockResolvedValue({
            data: [],
            page: 1,
            total: 0,
        })

        const summary = await getAssistantFinancialSummary('usuario-prueba')

        expect(summary.balances).toEqual([])
        expect(summary.recentTransactions).toEqual([])
    })


    it('propaga un fallo al consultar los saldos', async () => {
        mocks.getWalletByUserId.mockResolvedValue({
            id: 'billetera-prueba',
        })

        const databaseError = new Error('Fallo simulado de consulta')
        mocks.getWalletBalances.mockRejectedValue(databaseError)

        await expect(
            getAssistantFinancialSummary('usuario-prueba'),
        ).rejects.toBe(databaseError)

        expect(mocks.getTransactions).not.toHaveBeenCalled()
    })

})