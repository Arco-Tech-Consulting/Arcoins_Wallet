import { Request, Response } from 'express';
import { FinancialService } from '../services/financial.service';
import { FinancialRepository } from '../services/financial.repository';

const financialService = new FinancialService();
const financialRepository = new FinancialRepository();

export class FinancialController {
  /**
   * Obtiene el saldo de un usuario para una moneda dada.
   * * GET /api/financial/balance/:walletId/:currency
   */
  public async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const { walletId, currency } = req.params;
      const balance = await financialRepository.getBalance(walletId, currency.toUpperCase());
      res.status(200).json({ success: true, walletId, currency, balance });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**Procesa un deposito en la cuenta
   *POST /api/financial/deposit
   */
  public async deposit(req: Request, res: Response): Promise<void> {
    try {
        const {user_id, to_currency, to_amount, description } = req.body;

        // Valida payload con la logica del negocio.
        financialService.validateTransactionPayload('deposit', {
            to_currency,
            to_amount
        });

        //Crea la transaccion en la DB
        const transaction = await financialRepository.createTransaction({
            user_id,
            type: 'deposit',
            to_currency,
            to_amount,
            description: description || 'Depósito en saldo'
        });

        res.status(201).json({ success: true, transaction });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
  }
}