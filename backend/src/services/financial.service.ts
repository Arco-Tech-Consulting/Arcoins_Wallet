export class FinancialService {
    /**
     * Aqui validamos que el monto a transaccionar sea positivo y mayor a 0.
     */

    public validateAmount(amount: number): boolean {
        if (isNaN(amount) || amount <= 0) {
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
     */

    public calculateExchange(fromAmount: number, exchangeRate: number):number {
        this.validateAmount(fromAmount);
        if (exchangeRate <= 0) {
            throw new Error('La tasa de cambio debe ser mayor a cero.');
        }

        //Redondeamos a 8 decimales para precisión financiera
        const calculated = fromAmount * exchangeRate;
        return Number(calculated.toFixed(8));
    }
}