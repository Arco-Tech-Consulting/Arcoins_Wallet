import { Request, Response } from "express";
import { MerchantsRepository } from "../services/merchants.repository";

const merchantsRepository = new MerchantsRepository();

export class MerchantsController {
  /**
   * Lista los comercios activos disponibles para pagar.
   * GET /api/merchants
   */
  public async listMerchants(_req: Request, res: Response): Promise<void> {
    try {
      const merchants = await merchantsRepository.getActiveMerchants();
      res.status(200).json({ data: merchants });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Error al consultar los comercios",
      });
    }
  }
}
