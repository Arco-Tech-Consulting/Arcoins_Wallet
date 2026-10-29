import { Router } from 'express';
import financialRoutes from './financial.routes';
import authRoutes from './auth.routes';
import assistantRoutes from './assistant.routes'
import merchantsRoutes from './merchants.routes';
import transferRoutes from './transfer.routes';

const router = Router();

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de comercios
router.use('/', merchantsRoutes)

// Rutas del asistente
router.use('/', assistantRoutes)

// Aqui se montan las rutas financieras bajo las condiciones del contrato.
router.use('/', financialRoutes);

// Rutas de transferencias entre usuarios
router.use('/', transferRoutes);

export default router;
