import { pool } from '../config/db';
import { PoolClient } from 'pg';

export interface CreateTransferData {
  senderUserId: string;
  receiverWalletId: string;
  currency: string;
  amount: number;
  description?: string;
}

export interface TransferResult {
  transferGroupId: string;
  senderTransaction: TransferTransactionRow;
  receiverTransaction: TransferTransactionRow;
  receiverUserId: string;
}

interface TransferTransactionRow {
  id: string;
  type: string;
  status: string;
  fromCurrency: string | null;
  toCurrency: string | null;
  fromAmount: number | null;
  toAmount: number | null;
  counterpartUserId: string;
  transferGroupId: string;
  description: string | null;
  createdAt: string;
}

export class TransferRepository {
  /**
   * Busca la wallet del receptor por su ID y retorna también el userId del dueño.
   * Retorna null si la wallet no existe.
   */
  public async getWalletWithOwner(
    walletId: string
  ): Promise<{ walletId: string; userId: string } | null> {
    const query = `
      SELECT id AS wallet_id, user_id
      FROM wallets
      WHERE id = $1
      LIMIT 1;
    `;
    const result = await pool.query(query, [walletId]);
    if (result.rows.length === 0) return null;

    return {
      walletId: result.rows[0].wallet_id,
      userId: result.rows[0].user_id,
    };
  }

  /**
   * Obtiene la wallet del usuario emisor.
   */
  public async getWalletByUserId(userId: string): Promise<{ id: string } | null> {
    const query = `SELECT id FROM wallets WHERE user_id = $1 LIMIT 1;`;
    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) return null;
    return { id: result.rows[0].id };
  }

  /**
   * Ejecuta la transferencia de forma completamente atómica:
   * 1. Bloquea el saldo del emisor (FOR UPDATE) para evitar race conditions.
   * 2. Verifica fondos suficientes.
   * 3. Descuenta el saldo del emisor.
   * 4. Acredita el saldo del receptor.
   * 5. Inserta transfer_out para el emisor.
   * 6. Inserta transfer_in para el receptor.
   * Todo en una sola transacción SQL con ROLLBACK automático ante cualquier error.
   */
  public async executeTransfer(data: CreateTransferData): Promise<TransferResult> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Obtenemos la wallet del emisor
      const senderWalletResult = await client.query(
        `SELECT id FROM wallets WHERE user_id = $1 LIMIT 1`,
        [data.senderUserId]
      );
      if (senderWalletResult.rows.length === 0) {
        throw new Error('Billetera del emisor no encontrada');
      }
      const senderWalletId: string = senderWalletResult.rows[0].id;

      // Obtenemos el userId del receptor desde su walletId
      const receiverResult = await client.query(
        `SELECT id, user_id FROM wallets WHERE id = $1 LIMIT 1`,
        [data.receiverWalletId]
      );
      if (receiverResult.rows.length === 0) {
        throw new Error('Billetera del receptor no encontrada');
      }
      const receiverUserId: string = receiverResult.rows[0].user_id;

      // Validación: no se puede transferir a uno mismo
      if (data.senderUserId === receiverUserId) {
        throw new Error('No podés transferirte fondos a vos mismo');
      }

      // Bloqueo del saldo del emisor con FOR UPDATE (previene race conditions)
      const balanceResult = await client.query(
        `SELECT amount FROM wallet_balances
         WHERE wallet_id = $1 AND currency = $2
         FOR UPDATE`,
        [senderWalletId, data.currency]
      );

      const currentBalance =
        balanceResult.rows.length > 0 ? parseFloat(balanceResult.rows[0].amount) : 0;

      if (currentBalance < data.amount) {
        throw new Error('Fondos insuficientes para completar la transferencia');
      }

      // Descontamos del emisor
      await this.adjustBalance(client, senderWalletId, data.currency, -data.amount);

      // Acreditamos al receptor (upsert por si no tiene saldo en esa moneda todavía)
      await this.adjustBalance(client, data.receiverWalletId, data.currency, data.amount);

      // Generamos el UUID del grupo para vincular ambas transacciones
      const groupIdResult = await client.query(`SELECT gen_random_uuid() AS id`);
      const transferGroupId: string = groupIdResult.rows[0].id;

      const description =
        data.description ||
        `Transferencia de ${data.currency} ${data.amount}`;

      // Insertamos transfer_out para el emisor
      const senderTx = await this.insertTransferTransaction(client, {
        userId: data.senderUserId,
        type: 'transfer_out',
        fromCurrency: data.currency,
        fromAmount: data.amount,
        counterpartUserId: receiverUserId,
        transferGroupId,
        description: `Enviaste: ${description}`,
      });

      // Insertamos transfer_in para el receptor
      const receiverTx = await this.insertTransferTransaction(client, {
        userId: receiverUserId,
        type: 'transfer_in',
        toCurrency: data.currency,
        toAmount: data.amount,
        counterpartUserId: data.senderUserId,
        transferGroupId,
        description: `Recibiste: ${description}`,
      });

      await client.query('COMMIT');

      return {
        transferGroupId,
        senderTransaction: senderTx,
        receiverTransaction: receiverTx,
        receiverUserId,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Suma o resta un monto al saldo de una moneda (upsert).
   */
  private async adjustBalance(
    client: PoolClient,
    walletId: string,
    currency: string,
    delta: number
  ): Promise<void> {
    await client.query(
      `INSERT INTO wallet_balances (wallet_id, currency, amount, updated_at)
       VALUES ($1, $2, GREATEST($3::numeric, 0), NOW())
       ON CONFLICT (wallet_id, currency)
       DO UPDATE SET amount = wallet_balances.amount + $3::numeric, updated_at = NOW()`,
      [walletId, currency, delta]
    );
  }

  /**
   * Inserta una fila en transactions para una transferencia (in o out).
   */
  private async insertTransferTransaction(
    client: PoolClient,
    data: {
      userId: string;
      type: 'transfer_in' | 'transfer_out';
      fromCurrency?: string;
      fromAmount?: number;
      toCurrency?: string;
      toAmount?: number;
      counterpartUserId: string;
      transferGroupId: string;
      description: string;
    }
  ): Promise<TransferTransactionRow> {
    const query = `
      INSERT INTO transactions (
        user_id, type, from_currency, to_currency,
        from_amount, to_amount,
        counterpart_user_id, transfer_group_id,
        description, status, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed', NOW())
      RETURNING
        id, type, status,
        from_currency, to_currency,
        from_amount, to_amount,
        counterpart_user_id, transfer_group_id,
        description, created_at;
    `;

    const values = [
      data.userId,
      data.type,
      data.fromCurrency ?? null,
      data.toCurrency ?? null,
      data.fromAmount ?? null,
      data.toAmount ?? null,
      data.counterpartUserId,
      data.transferGroupId,
      data.description,
    ];

    const result = await client.query(query, values);
    return this.formatRow(result.rows[0]);
  }

  private formatRow(row: any): TransferTransactionRow {
    return {
      id: row.id,
      type: row.type,
      status: row.status,
      fromCurrency: row.from_currency ?? null,
      toCurrency: row.to_currency ?? null,
      fromAmount: row.from_amount !== null ? Number(row.from_amount) : null,
      toAmount: row.to_amount !== null ? Number(row.to_amount) : null,
      counterpartUserId: row.counterpart_user_id,
      transferGroupId: row.transfer_group_id,
      description: row.description ?? null,
      createdAt: row.created_at,
    };
  }
}

