import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Request, Response } from 'express'

const mocks = vi.hoisted(() => ({
  getActiveMerchants: vi.fn(),
}))

vi.mock('../services/merchants.repository', () => ({
  MerchantsRepository: class {
    getActiveMerchants = mocks.getActiveMerchants
  },
}))

import { MerchantsController } from './merchants.controller'

function createResponse() {
  const json = vi.fn()
  const status = vi.fn().mockReturnValue({ json })

  const res = { status } as unknown as Response

  return { res, status, json }
}

describe('MerchantsController.listMerchants', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('responde 200 con la lista de comercios', async () => {
    const merchants = [
      { id: 'c-1', name: 'Café Andino', category: 'Restaurantes' },
    ]
    mocks.getActiveMerchants.mockResolvedValue(merchants)

    const controller = new MerchantsController()
    const { res, status, json } = createResponse()

    await controller.listMerchants({} as Request, res)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ data: merchants })
  })

  it('responde 500 si falla la consulta', async () => {
    mocks.getActiveMerchants.mockRejectedValue(new Error('boom'))

    const controller = new MerchantsController()
    const { res, status, json } = createResponse()

    await controller.listMerchants({} as Request, res)

    expect(status).toHaveBeenCalledWith(500)
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: expect.any(String),
    })
  })
})
