// src/services/financial.service.test.ts
import { describe, it, expect } from "vitest";
import { FinancialService } from "./financial.service";

describe("FinancialService - Motor Financiero Avanzado", () => {
  const service = new FinancialService();

  it("debe validar montos positivos correctamente", () => {
    expect(service.validateAmount(150)).toBe(true);
    expect(() => service.validateAmount(0)).toThrowError();
  });

  it("debe rechazar montos no finitos y valores invalidos", () => {
    expect(() => service.validateAmount(NaN)).toThrowError();
    expect(() => service.validateAmount(Infinity)).toThrowError();
    expect(() => service.validateAmount(-Infinity)).toThrowError();
    expect(() => service.validateAmount(-100)).toThrowError();
    expect(() =>
      service.validateAmount("100" as unknown as number)
    ).toThrowError();

    expect(service.validateAmount(100.5)).toBe(true);
  });

  it("debe validar saldos suficientes", () => {
    expect(service.hasSufficientBalance(1000, 400)).toBe(true);
    expect(() => service.hasSufficientBalance(100, 500)).toThrowError(
      "Fondos insuficientes"
    );
  });

  it("debe calcular conversiones con precisión de 2 decimales", () => {
    const result = service.calculateExchange(50, 4100.25);
    expect(result).toBe(205012.5);
  });

  it("debe redondear las conversiones a 2 decimales", () => {
    expect(service.calculateExchange(100, 0.31405)).toBe(31.41);
    expect(service.calculateExchange(100, 0.31404)).toBe(31.40);
  });

  it("debe rechazar tasas de cambio invalidas", () => {
    expect(() => service.calculateExchange(100, 0)).toThrowError();
    expect(() => service.calculateExchange(100, -5)).toThrowError();
    expect(() => service.calculateExchange(100, NaN)).toThrowError();
    expect(() => service.calculateExchange(100, Infinity)).toThrowError();
    expect(() => service.calculateExchange(100, -Infinity)).toThrowError();
    expect(() =>
      service.calculateExchange(100, "4100" as unknown as number)
    ).toThrowError();
  });

  it("debe rechazar resultados de conversion invalidos", () => {
    expect(() => service.calculateExchange(100, 1e308)).toThrowError(
      "El resultado de la conversión no es válido."
    );

    expect(() => service.calculateExchange(0.000000001, 1)).toThrowError(
      "El monto de la transacción no puede tener más de 2 decimales."
    );
  });

  it("debe validar cargas de depósito correctamente", () => {
    const isValid = service.validateTransactionPayload("deposit", {
      to_currency: "USD",
      to_amount: 100,
    });
    expect(isValid).toBe(true);

    expect(() =>
      service.validateTransactionPayload("deposit", {
        to_currency: "USD",
        to_amount: -10,
      })
    ).toThrowError();
  });

  it("debe rechazar conversiones entre la misma moneda", () => {
    expect(() =>
      service.validateTransactionPayload("exchange", {
        from_currency: "USD",
        to_currency: "USD",
        from_amount: 100,
        to_amount: 100,
        rate_used: 1,
      })
    ).toThrowError("Las monedas de origen y destino no pueden ser iguales");
  });

  it("debe rechazar tasas de cambio invalidas en transacciones", () => {
    const transaction = {
      from_currency: "USD",
      to_currency: "COP",
      from_amount: 100,
      to_amount: 410000,
      rate_used: 4100,
    };

    expect(service.validateTransactionPayload("exchange", transaction)).toBe(
      true
    );

    for (const invalidRate of [0, -5, NaN, Infinity, -Infinity]) {
      expect(() =>
        service.validateTransactionPayload("exchange", {
          ...transaction,
          rate_used: invalidRate,
        })
      ).toThrowError();
    }

    expect(() =>
      service.validateTransactionPayload("exchange", {
        ...transaction,
        rate_used: "4100" as unknown as number,
      })
    ).toThrowError();
  });

  it("debe calcular una comision del 0.5 % sobre el monto", () => {
    expect(service.calculateCommission(100)).toBe("0.50");
    expect(service.calculateCommission(400000)).toBe("2000.00");
    expect(service.calculateCommission(250.5)).toBe("1.25");
  });

  it("debe redondear la comision a 2 decimales", () => {
    expect(service.calculateCommission(101)).toBe("0.51");
    expect(service.calculateCommission(1.50)).toBe("0.01");
  });

  it("debe rechazar montos invalidos al calcular comisiones", () => {
    for (const invalidAmount of [0, -100, NaN, Infinity, -Infinity]) {
      expect(() => service.calculateCommission(invalidAmount)).toThrowError();
    }

    expect(() =>
      service.calculateCommission("100" as unknown as number)
    ).toThrowError();
  });

  it("debe rechazar comisiones demasiado pequeñas o montos excesivos", () => {
    expect(() => service.calculateCommission(0.01)).toThrowError(
      "El monto es demasiado pequeño para calcular la comisión."
    );

    expect(() => service.calculateCommission(1e308)).toThrowError(
      "El monto supera el límite permitido para la transacción."
    );
  });
});
