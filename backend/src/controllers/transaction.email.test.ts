import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Response } from 'express'
import type { AuthenticatedRequest } from '../types/auth.types'
const mocks = vi.hoisted(() => ({ create: vi.fn(), payment: vi.fn(), transfer: vi.fn(), wallet: vi.fn(), mail: vi.fn(), emit: vi.fn(), rate: vi.fn() }))
vi.mock('../services/financial.repository', () => ({ FinancialRepository: class {
    createExchangeTransaction = mocks.create; createPayment = mocks.payment
} }))
vi.mock('../services/exchange-rate.service', () => ({ exchangeRateService: { getExchangeRate: mocks.rate } }))
vi.mock('../services/transfer.repository', () => ({ TransferRepository: class {
    executeTransfer = mocks.transfer; getWalletWithOwner = mocks.wallet
} }))
vi.mock('../services/email.service', () => ({ requestTransactionEmail: mocks.mail }))
vi.mock('../socket/socket.service', () => ({ emitToUser: mocks.emit }))
import { FinancialController } from './financial.controller'
import { TransferController } from './transfer.controller'
function response() { const r = { status: vi.fn(), json: vi.fn() }; r.status.mockReturnValue(r); return r }
function req(body: object) { return { user: { id: 'owner', email: 'unused@example.com' }, body } as AuthenticatedRequest }
describe('correo posterior a operaciones confirmadas', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mocks.rate.mockResolvedValue({ rate: 4000 })
        mocks.mail.mockResolvedValue(false)
        mocks.create.mockResolvedValue({ id: 'tx1' })
        mocks.payment.mockResolvedValue({ id: 'tx2' })
        mocks.wallet.mockResolvedValue({ id: 'wallet2' })
        mocks.transfer.mockResolvedValue({ senderTransaction: { id: 'out' }, receiverTransaction: { id: 'in' }, receiverUserId: 'receiver', transferGroupId: 'g1' })
    })
    it('depósito usa ID guardado e identidad JWT aunque el correo falle', async () => {
        const r = response()
        await new FinancialController().deposit(req({ to_currency: 'COP', to_amount: 100, user_id: 'attacker', email: 'attacker@example.com' }), r as unknown as Response)
        expect(r.status).toHaveBeenCalledWith(201)
        expect(mocks.mail).toHaveBeenCalledExactlyOnceWith('owner', 'tx1')
        expect(mocks.create.mock.invocationCallOrder[0]).toBeLessThan(mocks.mail.mock.invocationCallOrder[0])
    })
    it('conversión envía después del repositorio', async () => {
        const r = response()
        await new FinancialController().createTransaction(req({ type: 'exchange', fromCurrency: 'USD', toCurrency: 'COP', fromAmount: 10 }), r as unknown as Response)
        expect(r.status).toHaveBeenCalledWith(200)
        expect(mocks.mail).toHaveBeenCalledExactlyOnceWith('owner', 'tx1')
    })
    it('pago confirmado conserva 201 ante correo fallido', async () => {
        const r = response()
        await new FinancialController().createPayment(req({ currency: 'COP', amount: 100, merchantId: 'm1' }), r as unknown as Response)
        expect(r.status).toHaveBeenCalledWith(201)
        expect(mocks.mail).toHaveBeenCalledExactlyOnceWith('owner', 'tx2')
    })
    it('no envía si la operación rechaza', async () => {
        mocks.create.mockRejectedValue(new Error('DB error'))
        const r = response()
        await new FinancialController().deposit(req({ to_currency: 'COP', to_amount: 100 }), r as unknown as Response)
        expect(mocks.mail).not.toHaveBeenCalled()
    })
    it('transferencia notifica a los dos dueños con sus respectivas transacciones', async () => {
        const r = response()
        await new TransferController().createTransfer(req({ receiverWalletId: 'wallet2', currency: 'USD', amount: 10 }), r as unknown as Response)
        expect(r.status).toHaveBeenCalledWith(201)
        expect(mocks.mail).toHaveBeenCalledTimes(2)
        expect(mocks.mail).toHaveBeenCalledWith('owner', 'out')
        expect(mocks.mail).toHaveBeenCalledWith('receiver', 'in')
        expect(mocks.transfer.mock.invocationCallOrder[0]).toBeLessThan(mocks.mail.mock.invocationCallOrder[0])
    })
})

it('conserva el éxito de una transferencia si fallan las notificaciones después del COMMIT', async () => {
    mocks.wallet.mockResolvedValue({ id: 'wallet2' })
    mocks.transfer.mockResolvedValue({ senderTransaction: { id: 'out' }, receiverTransaction: { id: 'in' }, receiverUserId: 'receiver', transferGroupId: 'g1' })
    mocks.emit.mockImplementationOnce(() => { throw new Error('Socket failed') })
    mocks.mail.mockRejectedValue(new Error('Unexpected mail failure'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const r = response()
    await new TransferController().createTransfer(req({ receiverWalletId: 'wallet2', currency: 'USD', amount: 10 }), r as unknown as Response)
    expect(r.status).toHaveBeenCalledWith(201)
    expect(r.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, transaction: { id: 'out' } }))
    warn.mockRestore()
})
