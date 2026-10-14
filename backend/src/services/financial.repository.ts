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
      amount: parseFloat(row.amount),
    }));
  }

  public async getExchangeRate(base: string, target: string) {
    const query = `
    SELECT base_currency, target_currency, rate, fetched_at
    FROM exchange_rates
    WHERE base_currency = $1 AND target_currency = $2
    ORDER BY fetched_at DESC
    LIMIT 1;
    `;
    const result = await pool.query(query, [base, target]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      base: row.base_currency,
      target: row.target_currency,
      rate: parseFloat(row.rate),
      fetchedAt: row.fetched_at,
    };
  }

  public async getTransactions(
    walletId: string,
    filters: { type?: string; currency?: string; page?: string }
  ) {
    const page = parseInt(filters.page || "1", 10);
    const limit = 10;
    const offset = (page - 1) * limit;

    // Consulta base para transacciones de la wallet / usuario de prueba (Ana)
    let query = `
  SELECT id, type, status, from_currency, to_currency, from_amount, to_amount, 
         rate_used, rate_timestamp, description, created_at 
  FROM transactions 
  WHERE user_id = 'a0000000-0000-0000-0000-000000000001'
  `;

    const queryParams: any[] = [];

    if (filters.type) {
      queryParams.push(filters.type);
      query += `AND type = $${queryParams.length}`;
    }

    query += `ORDER BY  created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await pool.query(query, queryParams);

    //Consulta para el total (Para la paginacion del contrato)
    const countResult = await pool.query(`
    SELECT COUNT(*) FROM transactions 
    WHERE user_id = 'a0000000-0000-0000-0000-000000000001'
  `);
    const total = parseInt(countResult.rows[0].count, 10 );

    const transactionsFormatted = result.rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      status: row.status || 'completed',
      fromCurrency: row.from_currency,
      toCurrency: row.to_currency,
      fromAmount: row.from_amount ? parseFloat(row.from_amount) : null,
      toAmount: row.to_amount ? parseFloat(row.to_amount) : null,
      rateUsed: row.rate_used ? parseFloat(row.rate_used) : null,
      rateTimestamp: row.rate_timestamp,
      description: row.description,
      createdAt: row.created_at
    }));

    return {
      data: transactionsFormatted,
      page, total
    };
  }
}
