import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Response } from 'express'
import type { AuthenticatedRequest } from '../types/auth.types'

const mocks = vi.hoisted(() => ({
  getWalletByUserId: vi.fn(),
  getBalance: vi.fn(),
}))

vi.mock('../services/financial.repository', () => ({
  FinancialRepository: class {
    getWalletByUserId = mocks.getWalletByUserId
    getBalance = mocks.getBalance
  },
}))

import { FinancialController } from './financial.controller'

function createResponse() {
  const json = vi.fn()
  const status = vi.fn().mockReturnValue({ json })
  const res = { status } as unknown as Response

  return { res, status, json }
}

function createRequest(
  userId: string | undefined,
  walletId = 'wallet-1',
  currency = 'COP'
) {
  return {
    user: userId ? { id: userId, email: 'test@example.com' } : undefined,
    params: { walletId, currency },
  } as unknown as AuthenticatedRequest
}

describe('FinancialController.getBalance', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('permite consultar el saldo de la billetera propia', async () => {
    mocks.getWalletByUserId.mockResolvedValue({ id: 'wallet-1' })
    mocks.getBalance.mockResolvedValue(150000)

    const { res, status, json } = createResponse()

    await new FinancialController().getBalance(
      createRequest('user-1'),
      res
    )

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      success: true,
      walletId: 'wallet-1',
      currency: 'COP',
      balance: 150000,
    })
  })

  it('rechaza consultar una billetera ajena', async () => {
    mocks.getWalletByUserId.mockResolvedValue({ id: 'wallet-1' })

    const { res, status } = createResponse()

    await new FinancialController().getBalance(
      createRequest('user-1', 'wallet-2'),
      res
    )

    expect(status).toHaveBeenCalledWith(403)
    expect(mocks.getBalance).not.toHaveBeenCalled()
  })

  it('rechaza peticiones sin usuario autenticado', async () => {
    const { res, status } = createResponse()

    await new FinancialController().getBalance(
      createRequest(undefined),
      res
    )

    expect(status).toHaveBeenCalledWith(401)
    expect(mocks.getBalance).not.toHaveBeenCalled()
  })

  it('rechaza monedas no soportadas', async () => {
    mocks.getWalletByUserId.mockResolvedValue({ id: 'wallet-1' })

    const { res, status } = createResponse()

    await new FinancialController().getBalance(
      createRequest('user-1', 'wallet-1', 'BTC'),
      res
    )

    expect(status).toHaveBeenCalledWith(400)
    expect(mocks.getBalance).not.toHaveBeenCalled()
  })
})