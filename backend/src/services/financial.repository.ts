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
    filters: { type?: string; currency?: string; from?: string; to?: string; page?: string }
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

    if (filters.from) {
      queryParams.push(filters.from);
      conditions.push(`created_at >= $${queryParams.length}::date`);
    }

    if (filters.to) {
      queryParams.push(filters.to);
      conditions.push(
        `created_at < ($${queryParams.length}::date + INTERVAL '1 day')`
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

    const transactionsFormatted = result.rows.map((row) =>
      this.formatTransactionRow(row)
    );

    return {
      data: transactionsFormatted,
      page,
      total,
    };
  }

  /**
   * Aplica una transaccion sobre la billetera del usuario de forma atomica:
   * valida y descuenta el saldo de origen, acredita el de destino e inserta
   * el movimiento. Todo dentro de una unica transaccion SQL (rollback ante error).
   */
  public async applyTransaction(data: {
    user_id: string;
    type: string;
    from_currency?: string | null;
    to_currency?: string | null;
    from_amount?: number | null;
    to_amount?: number | null;
    rate_used?: number | null;
    rate_timestamp?: Date | null;
    merchant_id?: string | null;
    description?: string | null;
  }) {
    const wallet = await this.getWalletByUserId(data.user_id);

    if (!wallet) {
      throw new Error('Billetera no encontrada');
    }

    return this.executeInTransaction(async (client) => {
      if (data.from_currency && data.from_amount && data.from_amount > 0) {
        const currentBalance = await this.getBalanceForUpdate(
          client,
          wallet.id,
          data.from_currency
        );

        if (currentBalance < data.from_amount) {
          throw new Error('Fondos insuficientes para completar la transacción.');
        }

        await this.adjustBalance(
          client,
          wallet.id,
          data.from_currency,
          -data.from_amount
        );
      }

      if (data.to_currency && data.to_amount && data.to_amount > 0) {
        await this.adjustBalance(
          client,
          wallet.id,
          data.to_currency,
          data.to_amount
        );
      }

      return this.insertTransaction(client, data);
    });
  }

  /**
   * Lee el saldo de una moneda bloqueando la fila (FOR UPDATE) dentro
   * de la transaccion SQL en curso.
   */
  private async getBalanceForUpdate(
    client: PoolClient,
    walletId: string,
    currency: string
  ): Promise<number> {
    const query = `
      SELECT amount FROM wallet_balances
      WHERE wallet_id = $1 AND currency = $2
      FOR UPDATE;
    `;
    const result = await client.query(query, [walletId, currency]);
    return result.rows.length > 0 ? parseFloat(result.rows[0].amount) : 0;
  }

  /**
   * Suma o resta un monto al saldo de una moneda (upsert por si no existiera).
   */
  private async adjustBalance(
    client: PoolClient,
    walletId: string,
    currency: string,
    delta: number
  ): Promise<void> {
    const query = `
      INSERT INTO wallet_balances (wallet_id, currency, amount, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (wallet_id, currency)
      DO UPDATE SET amount = wallet_balances.amount + EXCLUDED.amount, updated_at = NOW();
    `;
    await client.query(query, [walletId, currency, delta]);
  }

  /**
   * Inserta el movimiento respetando los constraints de cada tipo
   * (los depositos no llevan tasa; las conversiones si).
   */
  private async insertTransaction(
    client: PoolClient,
    data: {
      user_id: string;
      type: string;
      from_currency?: string | null;
      to_currency?: string | null;
      from_amount?: number | null;
      to_amount?: number | null;
      rate_used?: number | null;
      rate_timestamp?: Date | null;
      merchant_id?: string | null;
      description?: string | null;
    }
  ) {
    const isConversion = ['buy', 'sell', 'exchange'].includes(data.type);

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
        merchant_id,
        description,
        status,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed', NOW())
      RETURNING id, type, status, from_currency, to_currency, from_amount, to_amount, rate_used, rate_timestamp, description, created_at;
    `;

    const values = [
      data.user_id,
      data.type,
      data.from_currency || null,
      data.to_currency || null,
      data.from_amount || null,
      data.to_amount || null,
      isConversion ? data.rate_used || null : null,
      isConversion ? data.rate_timestamp || new Date() : null,
      data.merchant_id || null,
      data.description || null,
    ];

    const result = await client.query(query, values);
    return this.formatTransactionRow(result.rows[0]);
  }

  /**
   * Mapea una fila de `transactions` al formato del contrato del frontend.
   */
  private formatTransactionRow(row: any) {
    return {
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
    };
  }

  /**
   * Aqui se crea una transaccion general como buy, sell, exchange, deposit, etc
   * aplicando tambien el movimiento de saldos.
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
    return this.applyTransaction(data);
  }

  /**
   * Crea un pago a comercio descontando el saldo de la moneda indicada.
   */
  public async createPayment(data: {
    user_id: string;
    currency: string;
    amount: number;
    merchantId: string;
    description?: string;
  }) {
    return this.applyTransaction({
      user_id: data.user_id,
      type: 'payment',
      from_currency: data.currency,
      from_amount: data.amount,
      merchant_id: data.merchantId,
      description: data.description || 'Pago a comercio',
    });
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
