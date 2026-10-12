export type CurrencyCode = string; // 'COP', 'USD', 'EUR'

export interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
  decimals: number;
  is_active: boolean;
  created_at: Date;
}

export interface WalletBalance {
  id: string;
  wallet_id: string;
  currency: CurrencyCode;
  amount: number;
  updated_at: Date;
}

export type TransactionType =
  | "deposit"
  | "buy"
  | "sell"
  | "exchange"
  | "transfer_out"
  | "transfer_in"
  | "payment";
export type TransactionStatus = "pending" | "completed" | "failed";

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  status: TransactionStatus;
  from_currency?: CurrencyCode | null;
  to_currency?: CurrencyCode | null;
  from_amount?: number | null;
  to_amount?: number | null;
  rate_used?: number | null;
  rate_timestamp?: Date | null;
  counterpart_user_id?: string | null;
  transfer_group_id?: string | null;
  merchant_id?: string | null;
  description?: string | null;
  created_at: Date;
}
