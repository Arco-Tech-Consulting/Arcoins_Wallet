import { describe, it, expect } from 'vitest';
import { FinancialService } from './financial.service';

describe('FinancialService - Motor Financiero', () => {
  const financialService = new FinancialService();

  it('debe validar correctamente montos positivos', () => {
    expect(financialService.validateAmount(100)).toBe(true);
    expect(() => financialService.validateAmount(0)).toThrowError();
    expect(() => financialService.validateAmount(-50)).toThrowError();
  });

  it('debe verificar si hay fondos suficientes en la billetera', () => {
    expect(financialService.hasSufficientBalance(500, 200)).toBe(true);
    expect(() => financialService.hasSufficientBalance(100, 200)).toThrowError('Fondos insuficientes');
  });

  it('debe calcular la conversión de moneda de forma precisa', () => {
    const result = financialService.calculateExchange(100, 3950.50);
    expect(result).toBe(395050);
  });
});