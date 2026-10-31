import { Request, Response } from "express";
import { FinancialService } from "../services/financial.service";
import { FinancialRepository } from "../services/financial.repository";
import { AuthenticatedRequest } from "../types/auth.types";
import { exchangeRateService } from "../services/exchange-rate.service";

import { requestTransactionEmail } from '../services/email.service';

const financialService = new FinancialService();
const financialRepository = new FinancialRepository();

export class FinancialController {
  /**
   * Obtiene el saldo de un usuario para una moneda dada.
   * * GET /api/financial/balance/:walletId/:currency
   */
  public async getBalance(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { walletId, currency } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
        });
        return;
      }

      if (typeof walletId !== "string" || typeof currency !== "string") {
        res.status(400).json({
          success: false,
          error: "Párametros de billetera o moneda inválidos",
        });
        return;
      }

      //verificación de que la billetera pertenezca al usuario
      const userWallet = await financialRepository.getWalletByUserId(userId);

      if (!userWallet || userWallet.id !== walletId) {
        res.status(403).json({
          success: false,
          error: "No tienes periso para consultar esta billetera",
        });
        return;
      }

      const normalizedCurrency = currency.toUpperCase();

      if (!["COP", "USD", "EUR"].includes(normalizedCurrency)) {
        res.status(400).json({
          success: false,
          error: "Moneda no soportada",
        });
        return;
      }

      const balance = await financialRepository.getBalance(
        walletId,
        normalizedCurrency
      );

      res.status(200).json({
        success: true,
        walletId,
        currency: normalizedCurrency,
        balance,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error al consultar el saldo",
      });
    }
  }

  /**Procesa un deposito en la cuenta
   *POST /api/financial/deposit
   */
  public async deposit(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { to_currency, to_amount, description } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res
          .status(401)
          .json({ success: false, error: "Usuario no autenticado" });
        return;
      }

      // Valida payload con la logica del negocio.
      financialService.validateTransactionPayload("deposit", {
        to_currency,
        to_amount,
      });

      //Crea la transaccion en la DB
      const transaction = await financialRepository.createExchangeTransaction({
        user_id: userId,
        type: "deposit",
        to_currency,
        to_amount,
        description: description || "Depósito en saldo",
      });

      await requestTransactionEmail(userId, transaction.id);
      res.status(201).json({ success: true, transaction });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Obtiene los saldos de la billetera adaptado al contrato frontend
   * GET /api/wallet/balances
   */
  public async getWalletBalances(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res
          .status(401)
          .json({ success: false, error: "Usuario no autenticado" });
        return;
      }

      //Se obtiene la billetera del usuario autenticado
      const wallet = await financialRepository.getWalletByUserId(userId);

      if (!wallet) {
        res
          .status(404)
          .json({ success: false, error: "Billetera no encontrada" });
        return;
      }

      //Consultamos los saldos de esa billetera
      const balances = await financialRepository.getWalletBalances(wallet.id);

      res.status(200).json({ data: balances });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: "Error al consultar los saldos" });
    }
  }

  /**
   * Obtiene la información básica de la billetera asaptado al contrato frontend
   * GET/api/wallet
   */
  public async getWallet(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res
          .status(401)
          .json({ success: false, error: "Usuario no autenticado" });
        return;
      }

      const wallet = await financialRepository.getWalletByUserId(userId);

      if (!wallet) {
        res
          .status(404)
          .json({ success: false, error: "Billetera no encontrada" });
        return;
      }

      res.status(200).json({ id: wallet.id });
    } catch (error: any) {
      res
        .status(500)
        .json({ success: false, error: "Error al consultar la billetera" });
    }
  }

  //Metodo para obtener tazas
  // Método para obtener tasas de cambio
  public async getRates(req: Request, res: Response): Promise<void> {
    try {
      const base = String(req.query.base || "USD").toUpperCase();
      const target = String(req.query.target || "COP").toUpperCase();

      // Validacion de códigos de moneda
      if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(target)) {
        res.status(400).json({
          success: false,
          error: "Los códigos de moneda deben tener 3 letras",
        });
        return;
      }

      try {
        // Consultar tasa actualizada desde ExchangeRate-API
        const rateData = await exchangeRateService.getExchangeRate(
          base,
          target
        );

        res.status(200).json(rateData);
        return;
      } catch (apiError) {
        console.warn(
          "ExchangeRate-API no disponible. Consultando PostgreSQL.",
          apiError
        );
      }

      // Respaldo: consultar última tasa almacenada en PostgreSQL
      const storedRate = await financialRepository.getExchangeRate(
        base,
        target
      );

      if (!storedRate) {
        res.status(503).json({
          success: false,
          error: "No hay tasas de cambio disponibles",
        });
        return;
      }

      res.status(200).json(storedRate);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Error al consultar las tasas de cambio",
      });
    }
  }

  //Se obtiene el hsitorial de transacciones
  public async getTransactions(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res
          .status(401)
          .json({ success: false, error: "Usuario no autenticado" });

        return;
      }

      const { type, currency, from, to, page } = req.query;

      const result = await financialRepository.getTransactions(userId, {
        type: typeof type === "string" ? type : undefined,
        currency: typeof currency === "string" ? currency : undefined,
        from: typeof from === "string" ? from : undefined,
        to: typeof to === "string" ? to : undefined,
        page: typeof page === "string" ? page : undefined,
      });

      res.status(200).json({ data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Procesa operaciones de compra, venta o intercambio
   * POST /api/transactions
   */
  public async createTransaction(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { type, fromCurrency, toCurrency, fromAmount } = req.body;

      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
        });
        return;
      }

      if (!["buy", "sell", "exchange"].includes(type)) {
        res
          .status(400)
          .json({ success: false, error: "Tipo de transacción inválida" });
        return;
      }

      // Validar el monto antes de consultar la tasa de cambio.
      financialService.validateAmount(fromAmount);

      const amount = fromAmount;

      // Tasa real: primero la API externa, con respaldo en PostgreSQL.
      const rateUsed = await this.resolveRate(fromCurrency, toCurrency);

      const toAmount = financialService.calculateExchange(amount, rateUsed);

      financialService.validateTransactionPayload(type, {
        from_currency: fromCurrency,
        to_currency: toCurrency,
        from_amount: amount,
        to_amount: toAmount,
        rate_used: rateUsed,
      });

      const transaction = await financialRepository.createExchangeTransaction({
        user_id: userId,
        type,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        from_amount: amount,
        to_amount: toAmount,
        rate_used: rateUsed,
        description: `${type.toUpperCase()} de ${fromCurrency} a ${toCurrency}`,
      });

      await requestTransactionEmail(userId, transaction.id);
      res.status(200).json({ transaction });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Obtiene la tasa de cambio para una conversión: primero la API externa,
   * y como respaldo la última tasa almacenada en PostgreSQL.
   */
  private async resolveRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    try {
      const liveRate = await exchangeRateService.getExchangeRate(
        fromCurrency,
        toCurrency
      );
      return liveRate.rate;
    } catch (apiError) {
      console.warn(
        "ExchangeRate-API no disponible. Usando tasa almacenada.",
        apiError
      );
    }

    const storedRate = await financialRepository.getExchangeRate(
      fromCurrency,
      toCurrency
    );

    if (
      !storedRate ||
      typeof storedRate.rate !== "number" ||
      !Number.isFinite(storedRate.rate) ||
      storedRate.rate <= 0
    ) {
      throw new Error("No hay tasas de cambio disponibles");
    }

    return storedRate.rate;
  }

  /**
   * Procesa pagos a comercios
   * POST /api/payments
   */
  public async createPayment(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { currency, amount, merchantId, description } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
        });
        return;
      }

      if (!currency || !amount || !merchantId) {
        res.status(400).json({
          success: false,
          error: "Faltan campos obligatorios para el pago.",
        });
        return;
      }

      const transaction = await financialRepository.createPayment({
        user_id: userId,
        currency,
        amount,
        merchantId,
        description,
      });

      await requestTransactionEmail(userId, transaction.id);
      res.status(201).json({ transaction });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
