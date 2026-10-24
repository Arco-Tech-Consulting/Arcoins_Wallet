import { FinancialRepository } from './financial.repository'

export interface AssistantFinancialSummary {
    generatedAt: string
    balances: {
        currency: string
        amount: number
    }[]
    recentTransactions: {
        type: string
        status: string
        fromCurrency: string | null
        toCurrency: string | null
        fromAmount: number | null
        toAmount: number | null
        createdAt: string
    }[]
}

const financialRepository = new FinancialRepository()

export async function getAssistantFinancialSummary(
    userId: string,
): Promise<AssistantFinancialSummary> {
    if (!userId.trim()) {
        throw new Error('Se requiere un usuario autenticado.')
    }

    const wallet = await financialRepository.getWalletByUserId(userId)

    if (!wallet) {
        throw new Error('Billetera no encontrada.')
    }


    const balances = await financialRepository.getWalletBalances(wallet.id)

    const transactions = await financialRepository.getTransactions(userId, {
        page: '1',
    })

    return {
        generatedAt: new Date().toISOString(),
        balances: balances.map((balance) => ({
            currency: balance.currency,
            amount: balance.amount,
        })),
        recentTransactions: transactions.data.map((transaction) => ({
            type: transaction.type,
            status: transaction.status,
            fromCurrency: transaction.fromCurrency,
            toCurrency: transaction.toCurrency,
            fromAmount: transaction.fromAmount,
            toAmount: transaction.toAmount,
            createdAt: new Date(transaction.createdAt).toISOString(),
        })),
    }
}

