import { pool } from "../config/db";

export interface MerchantRecord {
  id: string;
  name: string;
  category: string;
}

export class MerchantsRepository {
  /**
   * Lista los comercios activos, ordenados por categoría y nombre.
   */
  public async getActiveMerchants(): Promise<MerchantRecord[]> {
    const query = `
      SELECT id, name, category
      FROM merchants
      WHERE is_active = TRUE
      ORDER BY category, name;
    `;
    const result = await pool.query(query);

    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category,
    }));
  }
}
