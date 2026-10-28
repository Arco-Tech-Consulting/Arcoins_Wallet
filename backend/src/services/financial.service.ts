import { TransactionType } from '../types/financial.types';

export class FinancialService {
    /**
     * Aqui validamos que el monto a transaccionar sea positivo y mayor a 0.
     */

    public validateAmount(amount: number): boolean {
        //numberisfinite nos permite comprobar que el monto sea un número real y finito
        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
            throw new Error('El monto de la transacción debe ser mayor a cero.');
        }
        return true;
    }

    /**
     * Aqui se verifica si una billetera cuenta con el saldo suficiente para realizar la operacion
     */

    public hasSufficientBalance(currentBalance: number, amountToDebit: number): boolean {
        this.validateAmount(amountToDebit);
        if (currentBalance < amountToDebit) {
            throw new Error('Fondos insuficientes para completar la transacción.');
        }
        return true;
    }

    /**
     * Aqui calculamos el monto de destino basado en la tasa de cambio vigente. 
     * y se rechazan tasas de cambio negativas, Nan e infinitas
     */

    public calculateExchange(fromAmount: number, exchangeRate: number):number {
        this.validateAmount(fromAmount);
        if (
            typeof exchangeRate !== 'number' ||
            !Number.isFinite(exchangeRate) ||
            exchangeRate <= 0
        ) {
            throw new Error('La tasa de cambio debe ser un número finito mayor a cero.');
        }

        const calculated = fromAmount * exchangeRate;

        if (!Number.isFinite(calculated) || calculated <= 0) {
            throw new Error('El resultado de la conversión no es válido.');
        }

        //Redondeamos a 8 decimales para precisión financiera
        const rounded = Number(calculated.toFixed(8));

        if (!Number.isFinite(rounded) || rounded <= 0) {
            throw new Error('El resultado de la conversión no es válido.');
        }

        return rounded;
    }

    /**
     * Validamos la estructura logica de una transaccion segun el tipo
     */
    public validateTransactionPayload(type: TransactionType, data: {
        from_currency?: string | null;
        to_currency?: string | null;
        from_amount?: number | null;
        to_amount?: number | null;
        rate_used?: number | null;
    }): boolean {
        if(type === 'deposit') {
            if(!data.to_currency || !data.to_amount) {
                throw new Error('Un depósito requiere moneda y monto de destino.');
            }
            this.validateAmount(data.to_amount);
        } else if (['buy', 'sell', 'exchange'].includes(type)) {
            if (!data.from_currency || !data.to_currency || !data.from_amount || !data.to_amount || !data.rate_used) {
                throw new Error('La conversión o intercambio requiere monedas, montos y una tasa de cambio válidos.');
            }
            if (data.from_currency === data.to_currency) {
                throw new Error('Las monedas de origen y destino no pueden ser iguales en una conversión.');
            }
            this.validateAmount(data.from_amount);
            this.validateAmount(data.to_amount);

            if (
                typeof data.rate_used !== 'number' ||
                !Number.isFinite(data.rate_used) ||
                data.rate_used <= 0
            ) {
                throw new Error('La tasa de cambio debe ser un número finito mayor a cero.');
            }
        }
        return true;
    }
}