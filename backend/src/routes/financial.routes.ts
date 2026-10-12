import { Router } from 'express';
import { FinancialController } from '../controllers/financial.controller';

const router = Router();
const financialController = new FinancialController();

//Rutas del motor financiero
router.get('/balance/:walletId/:currency', (req, res) => financialController.getBalance(req, res));
router.post('/deposit', (req, res) => financialController.deposit(req, res));

export default router;