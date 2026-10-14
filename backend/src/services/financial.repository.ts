import { pool } from "../config/db";

export class FinancialRepository {
  /**
   * Aqui se obtiene el saldo de una billetera para una moneda en especifico.
   */
  public async getBalance(walletId: string, currency: string): Promise<number> {
    const query = `
    SELECT amount FROM wallet_balances
    WHERE wallet_id = $1 AND currency = $2;
    `;
    const result = await pool.query(query, [walletId, currency]);
    if (result.rows.length === 0) return 0;
    return parseFloat(result.rows[0].amount);
  }

  /**
   * Registra una nueva transacción en la base de datos alineada con el esquema de Marcos.
   */
  public async createTransaction(data: {
    user_id: string;
    type: string;
    status?: string;
    from_currency?: string | null;
    to_currency?: string | null;
    from_amount?: number | null;
    to_amount?: number | null;
    rate_used?: number | null;
    rate_timestamp?: Date | null;
    description?: string | null;
  }) {
    const query = `
    INSERT INTO transactions (
        user_id, type, status, from_currency, to_currency,
        from_amount, to_amount, rate_used, rate_timestamp, description
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *;
    `;

    const values = [
      data.user_id,
      data.type,
      data.status || "completed",
      data.from_currency || null,
      data.to_currency || null,
      data.from_amount || null,
      data.to_amount || null,
      data.rate_used || null,
      data.rate_timestamp || null,
      data.description || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  public async getWalletBalances(walletId: string) {
    const query = `SELECT currency, amount FROM wallet_balances WHERE wallet_id = $1;`;
    const result = await pool.query(query, [walletId]);

    return result.rows.map((row: any) => ({
      currency: row.currency,
      amount: parseFloat(row.amount)
    }));
  }


}
