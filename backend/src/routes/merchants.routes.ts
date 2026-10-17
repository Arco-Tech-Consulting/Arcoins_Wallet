import { Router } from 'express';
import { MerchantsController } from '../controllers/merchants.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();
const merchantsController = new MerchantsController();

// Requiere autenticación JWT como el resto de rutas financieras.
router.use(authenticateToken);

router.get('/merchants', (req, res) =>
  merchantsController.listMerchants(req, res)
);

export default router;
