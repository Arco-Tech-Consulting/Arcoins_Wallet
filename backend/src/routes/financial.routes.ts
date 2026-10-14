import { Router } from 'express';
import { FinancialController } from '../controllers/financial.controller';

const router = Router();
const financialController = new FinancialController();

//Rutas del motor financiero
router.get('/balance/:walletId/:currency', (req, res) => financialController.getBalance(req, res));
router.post('/deposit', (req, res) => financialController.deposit(req, res));
router.get('/wallet/balances', (req, res) => financialController.getWalletBalances(req, res));
router.get('/wallet', (req, res) => financialController.getWallet(req, res));

export default router;