import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MerchantsRepository } from './merchants.repository';

const mockQuery = vi.fn();

vi.mock('../config/db', () => ({
  pool: {
    query: (...args: unknown[]) => mockQuery(...args),
  },
}));

describe('MerchantsRepository.getActiveMerchants', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('devuelve los comercios activos mapeados al contrato', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 'c-1', name: 'Café Andino', category: 'Restaurantes' },
        { id: 'c-2', name: 'Supermercado Central', category: 'Supermercado' },
      ],
    });

    const repository = new MerchantsRepository();
    const merchants = await repository.getActiveMerchants();

    expect(merchants).toEqual([
      { id: 'c-1', name: 'Café Andino', category: 'Restaurantes' },
      { id: 'c-2', name: 'Supermercado Central', category: 'Supermercado' },
    ]);
    expect(String(mockQuery.mock.calls[0][0])).toContain('is_active = TRUE');
  });

  it('devuelve una lista vacía si no hay comercios', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const repository = new MerchantsRepository();
    const merchants = await repository.getActiveMerchants();

    expect(merchants).toEqual([]);
  });
});
