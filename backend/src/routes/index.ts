import  { Router } from 'express';
import financialRoutes from './financial.routes';

const router = Router();

//Aqui se montan las rutas financieras bajo las condiciones del contrato.
router.use('/', financialRoutes);

export default router;