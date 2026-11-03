import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { TransferRepository } from '../services/transfer.repository';
import { requestTransactionEmail } from '../services/email.service';
import { emitToUser } from '../socket/socket.service';

const transferRepository = new TransferRepository();

// Monedas válidas en el sistema
const VALID_CURRENCIES = ['COP', 'USD', 'EUR'];

// Expresión regular para validar formato básico de correo electrónico
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class TransferController {
  /**
   * Procesa una transferencia entre usuarios mediante correo electrónico.
   * POST /api/transfers
   *
   * Body esperado:
   * {
   *   receiverEmail: string,     // Correo electrónico del usuario receptor
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

      const { receiverEmail, currency, amount, description } = req.body;

      // --- Validaciones de entrada ---

      if (!receiverEmail || typeof receiverEmail !== 'string' || !receiverEmail.trim()) {
        res.status(400).json({
          success: false,
          error: 'El correo electrónico del receptor es obligatorio',
        });
        return;
      }

      const normalizedEmail = receiverEmail.trim().toLowerCase();

      if (!EMAIL_REGEX.test(normalizedEmail)) {
        res.status(400).json({
          success: false,
          error: 'El formato del correo electrónico no es válido',
        });
        return;
      }

      // Validación para evitar transferirse a uno mismo por correo
      if (req.user?.email && req.user.email.toLowerCase() === normalizedEmail) {
        res.status(400).json({
          success: false,
          error: 'No puedes transferirte fondos a ti mismo',
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

      // Verificamos que el usuario receptor exista y tenga billetera
      const receiverWallet = await transferRepository.getWalletByUserEmail(normalizedEmail);
      if (!receiverWallet) {
        res.status(404).json({
          success: false,
          error: 'No se encontró ningún usuario con ese correo electrónico',
        });
        return;
      }

      // Validación de seguridad adicional: no transferirse a uno mismo por userId
      if (receiverWallet.userId === userId) {
        res.status(400).json({
          success: false,
          error: 'No puedes transferirte fondos a ti mismo',
        });
        return;
      }

      // Ejecutamos la transferencia atómica
      const result = await transferRepository.executeTransfer({
        senderUserId: userId,
        receiverWalletId: receiverWallet.walletId,
        currency: normalizedCurrency,
        amount: numericAmount,
        description,
      });

      // Notifications are secondary: a committed transfer must remain successful.
      try {
        emitToUser(result.receiverUserId, 'transfer_received', {
          transferGroupId: result.transferGroupId,
          currency: normalizedCurrency,
          amount: numericAmount,
          description: result.receiverTransaction.description,
          createdAt: result.receiverTransaction.createdAt,
        });
      } catch {
        console.warn('[transfer] No se pudo emitir la notificación en tiempo real.');
      }

      await Promise.allSettled([
        requestTransactionEmail(userId, result.senderTransaction.id),
        requestTransactionEmail(result.receiverUserId, result.receiverTransaction.id),
      ]);

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
        'No puedes transferirte fondos a ti mismo',
        'Billetera del emisor no encontrada',
        'Billetera del receptor no encontrada',
        'No se encontró ningún usuario con ese correo electrónico',
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
