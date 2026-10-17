import { Router } from 'express';
import { FinancialController } from '../controllers/financial.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();
const financialController = new FinancialController();

// Todas las rutas financieras requieren autenticación JWT.
router.use(authenticateToken);

// Consultas financieras
router.get('/balance/:walletId/:currency', (req, res) =>
  financialController.getBalance(req, res)
);

router.get('/wallet/balances', (req, res) =>
  financialController.getWalletBalances(req, res)
);

router.get('/wallet', (req, res) =>
  financialController.getWallet(req, res)
);

router.get('/rates', (req, res) =>
  financialController.getRates(req, res)
);

router.get('/transactions', (req, res) =>
  financialController.getTransactions(req, res)
);

// Operaciones financieras
router.post('/deposit', (req, res) =>
  financialController.deposit(req, res)
);

router.post('/transactions', (req, res) =>
  financialController.createTransaction(req, res)
);

router.post('/payments', (req, res) =>
  financialController.createPayment(req, res)
);

export default router;