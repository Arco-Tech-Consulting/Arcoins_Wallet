export type CurrencyCode = string; // 'COP', 'USD', 'EUR'

export interface Currency {
    code: CurrencyCode;
    name: string;
    symbol: string;
}

export interface WalletBalance {
    id: string;
    wallet_id: string;
    currency_code: CurrencyCode;
    amount: number;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'EXCHANGE' | 'MERCHANT_PAYMENT';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface Transaction {
    id: string;
    user_id: string;
    merchant_id?: string | null;
    type: TransactionType;
    from_currency: CurrencyCode;
    to_currency: CurrencyCode;
    from_amount: number;
    to_amount: number;
    rate_timestamp: Date;
    status: TransactionStatus;
    created_at: Date;
}