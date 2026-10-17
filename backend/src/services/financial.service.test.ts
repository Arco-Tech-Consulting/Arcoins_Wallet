// src/services/financial.service.test.ts
import { describe, it, expect } from 'vitest';
import { FinancialService } from './financial.service';

describe('FinancialService - Motor Financiero Avanzado', () => {
  const service = new FinancialService();

  it('debe validar montos positivos correctamente', () => {
    expect(service.validateAmount(150)).toBe(true);
    expect(() => service.validateAmount(0)).toThrowError();
  });

  it('debe validar saldos suficientes', () => {
    expect(service.hasSufficientBalance(1000, 400)).toBe(true);
    expect(() => service.hasSufficientBalance(100, 500)).toThrowError('Fondos insuficientes');
  });

  it('debe calcular conversiones con precisión de 8 decimales', () => {
    const result = service.calculateExchange(50, 4100.25);
    expect(result).toBe(205012.5);
  });

  it('debe validar cargas de depósito correctamente', () => {
    const isValid = service.validateTransactionPayload('deposit', {
      to_currency: 'USD',
      to_amount: 100
    });
    expect(isValid).toBe(true);

    expect(() => service.validateTransactionPayload('deposit', {
      to_currency: 'USD',
      to_amount: -10
    })).toThrowError();
  });

  it('debe rechazar conversiones entre la misma moneda', () => {
    expect(() => service.validateTransactionPayload('exchange', {
      from_currency: 'USD',
      to_currency: 'USD',
      from_amount: 100,
      to_amount: 100,
      rate_used: 1
    })).toThrowError('Las monedas de origen y destino no pueden ser iguales');
  });
});