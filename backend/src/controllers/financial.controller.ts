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

  /**
   * Obtiene los saldos de la billetera adaptado al contrato frontend
   * GET /api/wallet/balances
   */
  public async getWalletBalances(req: Request, res: Response): Promise<void> {
    try {
      // Wallet ID de Ana Gómez por defecto para pruebas locales
      const walletId = 'b0000000-0000-0000-0000-000000000001';

      //consultamos los saldos de las monedas para esta wallet
      const balances = await financialRepository.getWalletBalances(walletId);

      res.status(200).json({ data: balances });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Obtiene la información básica de la billetera asaptado al contrato frontend
   * GET/api/wallet
   */
  public async getWallet(req: Request, res: Response): Promise<void> {
    try{
      // Wallet ID de Ana Gómez por defecto para pruebas
      const walletId = 'b0000000-0000-0000-0000-000000000001';

      res.status(200).json({ id: walletId});
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  //Metodo para obtener tazas 
  public async getRates(req: Request, res: Response): Promise<void> {
    try{ 
      const base = String(req.query.base || 'USD').toUpperCase();
      const target = String(req.query.target || 'COP').toUpperCase();

      const rateData = await financialRepository.getExchangeRate(base, target);

      if(!rateData) {
        res.status(404).json({ success: false, error: 'Tasa de cambio no encontrada' });
        return;
      }

      res.status(200).json(rateData);
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message});
    }
  }

  //Se obtiene el hsitorial de transacciones
  public async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { type, currency, page } = req.query;
      const walletId = 'b0000000-0000-0000-0000-000000000001';

      const result = await financialRepository.getTransactions(walletId, {
        type: type ? String(type) : undefined,
        currency: currency ? String(currency) : undefined,
        page: page ? String(page) : undefined 
      });
      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(400).json({ succes: false, error: error.message });
    }
  }
}