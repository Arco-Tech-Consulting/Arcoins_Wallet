import { Router } from 'express';
import { TransferController } from '../controllers/transfer.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();
const transferController = new TransferController();

// Las transferencias requieren JWT válido
router.use(authenticateToken);

/**
 * POST /api/transfers
 * Transfiere fondos de la billetera del usuario autenticado
 * a la billetera identificada por receiverWalletId.
 */
router.post('/transfers', (req, res) => transferController.createTransfer(req, res));

export default router;

