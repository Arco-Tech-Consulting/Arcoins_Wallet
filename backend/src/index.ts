import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import swaggerRoutes from './docs/swagger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Documentación interactiva de endpoints (Swagger UI)
app.use('/api-docs', swaggerRoutes);
app.get('/docs', (_req, res) => res.redirect('/api-docs'));

// Ruta raíz de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'ArcoPay Backend Running successfully 🚀',
    docs: '/api-docs',
  });
});

// Todas las rutas del contrato quedan bajo /api
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Documentación disponible en http://localhost:${PORT}/api-docs`);
});