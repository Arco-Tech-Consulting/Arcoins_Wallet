import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { TransferRepository } from '../services/transfer.repository';
import { requestTransactionEmail } from '../services/email.service';
import { emitToUser } from '../socket/socket.service';

const transferRepository = new TransferRepository();

// Monedas válidas en el sistema
const VALID_CURRENCIES = ['COP', 'USD', 'EUR'];

export class TransferController {
  /**
   * Procesa una transferencia entre usuarios.
   * POST /api/transfers
   *
   * Body esperado:
   * {
   *   receiverWalletId: string,  // UUID de la wallet del receptor
   *   currency: "COP" | "USD" | "EUR",
   *   amount: number,            // mayor a 0
   *   description?: string       // opcional
   * }
   */
  public async createTransfer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        return;
      }

      const { receiverWalletId, currency, amount, description } = req.body;

      // --- Validaciones de entrada ---

      if (!receiverWalletId || typeof receiverWalletId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'El ID de la billetera del receptor es obligatorio',
        });
        return;
      }

      const normalizedCurrency = typeof currency === 'string' ? currency.toUpperCase() : '';
      if (!VALID_CURRENCIES.includes(normalizedCurrency)) {
        res.status(400).json({
          success: false,
          error: `Moneda no soportada. Las monedas válidas son: ${VALID_CURRENCIES.join(', ')}`,
        });
        return;
      }

      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        res.status(400).json({
          success: false,
          error: 'El monto debe ser un número mayor a cero',
        });
        return;
      }

      // Verificamos que la wallet del receptor exista
      const receiverWallet = await transferRepository.getWalletWithOwner(receiverWalletId);
      if (!receiverWallet) {
        res.status(404).json({
          success: false,
          error: 'No se encontró ninguna billetera con ese ID',
        });
        return;
      }

      // Ejecutamos la transferencia atómica
      const result = await transferRepository.executeTransfer({
        senderUserId: userId,
        receiverWalletId,
        currency: normalizedCurrency,
        amount: numericAmount,
        description,
      });

      await Promise.all([
        requestTransactionEmail(userId, result.senderTransaction.id),
        requestTransactionEmail(result.receiverUserId, result.receiverTransaction.id),
      ]);

      // Notificamos al receptor en tiempo real vía Socket.io
      // Esto ocurre DESPUÉS del COMMIT, por lo que el dinero ya está acreditado
      emitToUser(result.receiverUserId, 'transfer_received', {
        transferGroupId: result.transferGroupId,
        currency: normalizedCurrency,
        amount: numericAmount,
        description: result.receiverTransaction.description,
        createdAt: result.receiverTransaction.createdAt,
      });

      // Respondemos al emisor con la transacción de salida
      res.status(201).json({
        success: true,
        transaction: result.senderTransaction,
        transferGroupId: result.transferGroupId,
      });
    } catch (error: any) {
      // Errores de negocio (fondos insuficientes, billetera propia, etc.)
      const clientErrors = [
        'Fondos insuficientes',
        'No podés transferirte fondos a vos mismo',
        'Billetera del emisor no encontrada',
        'Billetera del receptor no encontrada',
      ];

      const isClientError = clientErrors.some((msg) => error.message?.includes(msg));

      if (isClientError) {
        res.status(400).json({ success: false, error: error.message });
      } else {
        console.error('[TransferController] Error inesperado:', error);
        res.status(500).json({ success: false, error: 'Error al procesar la transferencia' });
      }
    }
  }
}

