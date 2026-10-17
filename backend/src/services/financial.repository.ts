import { off } from "cluster";
import { pool } from "../config/db";
import { PoolClient } from "pg";  //Esto nos permitirá tipar correctamente una conexión individual a PostgreSQL.

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
   * Obtiene la billetera asociada a un usuarioque ya este autenticado.
   */
  public async getWalletByUserId(userId: string) {
    const query = `
    SELECT id, user_id, created_at
    FROM wallets
    WHERE user_id = $1
    LIMIT 1;
  `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

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
    userId: string,
    filters: { type?: string; currency?: string; page?: string }
  ) {
    const page = Number(filters.page || 1);

    if (!Number.isInteger(page) || page < 1) {
      throw new Error("Número de página inválido");
    }

    const limit = 10;
    const offset = (page - 1) * limit;

    const conditions = ["user_id = $1"];
    const queryParams: unknown[] = [userId];

    if (filters.type) {
      queryParams.push(filters.type);
      conditions.push(`type = $${queryParams.length}`);
    }

    if (filters.currency) {
      queryParams.push(filters.currency.toUpperCase());
      const position = queryParams.length;

      conditions.push(
        `(from_currency = $${position} OR to_currency = $${position})`
      );
    }

    const whereClause = conditions.join(" AND ");

    const query = `
      SELECT  id, type, status, from_currency, to_currency,
              from_amount, to_amount, rate_used, rate_timestamp,
              description, created_at
      FROM transactions
      WHERE ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT $${queryParams.length + 1}
      OFFSET $${queryParams.length + 2}
      `;

    const result = await pool.query(query, [...queryParams, limit, offset]);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM transactions WHERE ${whereClause}`,
      queryParams
    );

    const total = Number(countResult.rows[0].count);

    const transactionsFormatted = result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      status: row.status,
      fromCurrency: row.from_currency,
      toCurrency: row.to_currency,
      fromAmount: row.from_amount !== null ? Number(row.from_amount) : null,
      toAmount: row.to_amount !== null ? Number(row.to_amount) : null,
      rateUsed: row.rate_used !== null ? Number(row.rate_used) : null,
      rateTimestamp: row.rate_timestamp,
      description: row.description,
      createdAt: row.created_at,
    }));

    return {
      data: transactionsFormatted,
      page,
      total,
    };
  }

  /**
   * Aqui se crea una transaccion general como buy, sell, exchange, deposit, etc
   */

  public async createExchangeTransaction(data: {
    user_id: string;
    type: string;
    from_currency?: string;
    to_currency?: string;
    from_amount?: number;
    to_amount?: number;
    rate_used?: number;
    description?: string;
  }) {
    const query = `
      INSERT INTO transactions (
        user_id,
        type,
        from_currency,
        to_currency,
        from_amount,
        to_amount,
        rate_used,
        rate_timestamp,
        description,
        status,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, 'completed', NOW())
      RETURNING id, type, status, from_currency, to_currency, from_amount, to_amount, rate_used, rate_timestamp, description, created_at;
    `;

    const values = [
      data.user_id,
      data.type,
      data.from_currency || null,
      data.to_currency || null,
      data.from_amount || null,
      data.to_amount || null,
      data.rate_used && data.rate_used > 0 ? data.rate_used : 0.00025,
      data.description || null,
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];

    return {
      id: row.id,
      type: row.type,
      status: row.status,
      fromCurrency: row.from_currency,
      toCurrency: row.to_currency,
      fromAmount: row.from_amount ? parseFloat(row.from_amount) : null,
      toAmount: row.to_amount ? parseFloat(row.to_amount) : null,
      rateUsed: row.rate_used ? parseFloat(row.rate_used) : null,
      rateTimestamp: row.rate_timestamp,
      description: row.description,
      createdAt: row.created_at,
    };
  }

  /**
   * Aqui creamos un pago al comercio
   */
  public async createPayment(data: {
    user_id: string;
    currency: string;
    amount: number;
    merchantId: string;
    description?: string;
  }) {
    const query = `
      INSERT INTO transactions (user_id, type, from_currency, from_amount, merchant_id, description, status, created_at)
      VALUES ($1, 'payment', $2, $3, $4, $5, 'completed', NOW())
      RETURNING id, type, status, from_currency, from_amount, merchant_id, description, created_at;
    `;

    const values = [
      data.user_id,
      data.currency,
      data.amount,
      data.merchantId,
      data.description || "Pago a comercio",
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];

    return {
      id: row.id,
      type: row.type,
      status: row.status,
      fromCurrency: row.from_currency,
      fromAmount: parseFloat(row.from_amount),
      merchantId: row.merchant_id,
      description: row.description,
      createdAt: row.created_at,
    };
  }

  /**
 * Ejecuta una operación dentro de una transacción SQL.
 * Si ocurre un error, revierte todos los cambios.
 */

  public async executeInTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {

    const client = await pool.connect(); //con pool.connect() Obtenemos una conexion exclusiva del pool.

    try {
      await client.query('BEGIN'); //con BEGIN iniciamos la transaccion

      const result = await operation(client); //Con operation(client) ejecutamos consultas usando misma conexion.

      await client.query('COMMIT'); //Con COMMIT confirmamos los cambios cuando todo termina correctamente.

      return result
    } catch (error) {
      try {
        await client.query('ROLLBACK'); //ROLLBACK nos revierte cambios en caso de error.
      } catch (rollbackError) {
        console.error('Error al revertir la transacción:', rollbackError);
      }

      throw error;
    } finally {
      client.release(); //client.release() devuelve la conexion al pool, incluso al fallar la operacion.
    }
  }
}
