import { Router } from 'express';
import financialRoutes from './financial.routes';
import authRoutes from './auth.routes';
import assistantRoutes from './assistant.routes'

const router = Router();

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas del asistente
router.use('/', assistantRoutes)

// Aqui se montan las rutas financieras bajo las condiciones del contrato.
router.use('/', financialRoutes);

export default router;
