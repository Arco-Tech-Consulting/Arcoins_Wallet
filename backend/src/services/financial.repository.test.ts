import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialRepository } from './financial.repository';

const mockQuery = vi.fn();
const mockClientQuery = vi.fn();
const mockRelease = vi.fn();
const mockConnect = vi.fn();

vi.mock('../config/db', () => ({
  pool: {
    query: (...args: unknown[]) => mockQuery(...args),
    connect: () => mockConnect(),
  },
}));

function transactionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tx-1',
    type: 'deposit',
    status: 'completed',
    from_currency: null,
    to_currency: 'COP',
    from_amount: null,
    to_amount: '500',
    rate_used: null,
    rate_timestamp: null,
    description: 'Prueba',
    created_at: new Date('2026-10-17T00:00:00Z'),
    ...overrides,
  };
}

function balanceUpdateCalls() {
  return mockClientQuery.mock.calls.filter(([sql]) =>
    String(sql).includes('INSERT INTO wallet_balances')
  );
}

describe('FinancialRepository.applyTransaction', () => {
  let repository: FinancialRepository;

  beforeEach(() => {
    vi.resetAllMocks();
    mockConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockRelease,
    });
    repository = new FinancialRepository();
  });

  it('acredita el saldo en un depósito sin descontar origen', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'wallet-1' }] });
    mockClientQuery.mockImplementation((sql: string) => {
      if (sql.includes('INSERT INTO transactions')) {
        return Promise.resolve({ rows: [transactionRow()] });
      }
      return Promise.resolve({ rows: [] });
    });

    const tx = await repository.applyTransaction({
      user_id: 'user-1',
      type: 'deposit',
      to_currency: 'COP',
      to_amount: 500,
    });

    expect(tx.type).toBe('deposit');
    expect(tx.toAmount).toBe(500);

    const updates = balanceUpdateCalls();
    expect(updates).toHaveLength(1);
    expect(updates[0][1]).toEqual(['wallet-1', 'COP', 500]);
  });

  it('descuenta origen y acredita destino en una conversión', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'wallet-1' }] });
    mockClientQuery.mockImplementation((sql: string) => {
      if (sql.includes('SELECT amount FROM wallet_balances')) {
        return Promise.resolve({ rows: [{ amount: '1000000' }] });
      }
      if (sql.includes('INSERT INTO transactions')) {
        return Promise.resolve({
          rows: [
            transactionRow({
              type: 'buy',
              from_currency: 'COP',
              from_amount: '100000',
              to_currency: 'USD',
              to_amount: '31.4',
              rate_used: '0.000314',
            }),
          ],
        });
      }
      return Promise.resolve({ rows: [] });
    });

    await repository.applyTransaction({
      user_id: 'user-1',
      type: 'buy',
      from_currency: 'COP',
      to_currency: 'USD',
      from_amount: 100000,
      to_amount: 31.4,
      rate_used: 0.000314,
    });

    const updates = balanceUpdateCalls();
    expect(updates).toHaveLength(2);
    expect(updates[0][1]).toEqual(['wallet-1', 'COP', -100000]);
    expect(updates[1][1]).toEqual(['wallet-1', 'USD', 31.4]);
    // El valor provisional del INSERT no puede ser negativo (CHECK antes del ON CONFLICT).
    expect(String(updates[0][0])).toContain('GREATEST');
  });

  it('rechaza con fondos insuficientes y hace rollback', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'wallet-1' }] });
    mockClientQuery.mockImplementation((sql: string) => {
      if (sql.includes('SELECT amount FROM wallet_balances')) {
        return Promise.resolve({ rows: [{ amount: '10' }] });
      }
      return Promise.resolve({ rows: [] });
    });

    await expect(
      repository.applyTransaction({
        user_id: 'user-1',
        type: 'buy',
        from_currency: 'COP',
        to_currency: 'USD',
        from_amount: 100000,
        to_amount: 31.4,
        rate_used: 0.000314,
      })
    ).rejects.toThrow('Fondos insuficientes');

    const rolledBack = mockClientQuery.mock.calls.some(([sql]) =>
      String(sql).includes('ROLLBACK')
    );
    expect(rolledBack).toBe(true);
    expect(mockRelease).toHaveBeenCalled();
  });

  it('lanza error si el usuario no tiene billetera', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(
      repository.applyTransaction({
        user_id: 'sin-wallet',
        type: 'deposit',
        to_currency: 'COP',
        to_amount: 100,
      })
    ).rejects.toThrow('Billetera no encontrada');

    expect(mockConnect).not.toHaveBeenCalled();
  });
});
