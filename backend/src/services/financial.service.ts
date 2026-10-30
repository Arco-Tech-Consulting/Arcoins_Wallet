import BigNumber from "bignumber.js";
import { TransactionType } from "../types/financial.types";
export class FinancialService {
  /**
   * Aqui validamos que el monto a transaccionar sea positivo y mayor a 0.
   */

  public validateAmount(amount: number): boolean {
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      throw new Error("El monto de la transacción debe ser mayor a cero.");
    }
  
    const amountDecimal = new BigNumber(amount.toString());
  
    if ((amountDecimal.decimalPlaces() ?? 0) > 2) {
      throw new Error(
        "El monto de la transacción no puede tener más de 2 decimales."
      );
    }

    if (amountDecimal.isGreaterThan("999999999999.99")) {
      throw new Error(
        "El monto supera el límite permitido para la transacción."
      );
    }
  
    return true;
  }

  /**
   * Aqui se verifica si una billetera cuenta con el saldo suficiente para realizar la operacion
   */

  public hasSufficientBalance(
    currentBalance: number,
    amountToDebit: number
  ): boolean {
    this.validateAmount(amountToDebit);
    if (currentBalance < amountToDebit) {
      throw new Error("Fondos insuficientes para completar la transacción.");
    }
    return true;
  }

  /**
   * Calcula la comisión por una operación de cambio de divisas.
   * La comisión es del 0.5% y se cobra en la moneda de origen.
   */

  public calculateCommission(amount: number): string {
    this.validateAmount(amount);

    const commissionRate = new BigNumber("0.005");
    const maxAmount = new BigNumber("999999999999.99999999");
    const amountDecimal = new BigNumber(amount.toString());

    if (amountDecimal.isGreaterThan(maxAmount)) {
      throw new Error(
        "El monto supera el límite permitido para la transacción."
      );
    }

    const commission = amountDecimal
      .multipliedBy(commissionRate)
      .decimalPlaces(2, BigNumber.ROUND_HALF_UP);

    if (commission.isLessThanOrEqualTo(0)) {
      throw new Error(
        "El monto es demasiado pequeño para calcular la comisión."
      );
    }

    return commission.toFixed(2);
  }

  /**
   * Aqui calculamos el monto de destino basado en la tasa de cambio vigente.
   * y se rechazan tasas de cambio negativas, Nan e infinitas
   */

  public calculateExchange(fromAmount: number, exchangeRate: number): number {
    this.validateAmount(fromAmount);
    if (
      typeof exchangeRate !== "number" ||
      !Number.isFinite(exchangeRate) ||
      exchangeRate <= 0
    ) {
      throw new Error(
        "La tasa de cambio debe ser un número finito mayor a cero."
      );
    }

    const calculated = new BigNumber(fromAmount.toString()).multipliedBy(
      new BigNumber(exchangeRate.toString())
    );

    const rounded = calculated.decimalPlaces(2, BigNumber.ROUND_HALF_UP);

    if (
      !rounded.isFinite() ||
      rounded.isLessThanOrEqualTo(0) ||
      rounded.isGreaterThan("999999999999.99999999")
    ) {
      throw new Error("El resultado de la conversión no es válido.");
    }

    return rounded.toNumber();
  }

  /**
   * Validamos la estructura logica de una transaccion segun el tipo
   */
  public validateTransactionPayload(
    type: TransactionType,
    data: {
      from_currency?: string | null;
      to_currency?: string | null;
      from_amount?: number | null;
      to_amount?: number | null;
      rate_used?: number | null;
    }
  ): boolean {
    if (type === "deposit") {
      if (!data.to_currency || !data.to_amount) {
        throw new Error("Un depósito requiere moneda y monto de destino.");
      }
      this.validateAmount(data.to_amount);
    } else if (["buy", "sell", "exchange"].includes(type)) {
      if (
        !data.from_currency ||
        !data.to_currency ||
        !data.from_amount ||
        !data.to_amount ||
        !data.rate_used
      ) {
        throw new Error(
          "La conversión o intercambio requiere monedas, montos y una tasa de cambio válidos."
        );
      }
      if (data.from_currency === data.to_currency) {
        throw new Error(
          "Las monedas de origen y destino no pueden ser iguales en una conversión."
        );
      }
      this.validateAmount(data.from_amount);
      this.validateAmount(data.to_amount);

      if (
        typeof data.rate_used !== "number" ||
        !Number.isFinite(data.rate_used) ||
        data.rate_used <= 0
      ) {
        throw new Error(
          "La tasa de cambio debe ser un número finito mayor a cero."
        );
      }
    }
    return true;
  }
}
