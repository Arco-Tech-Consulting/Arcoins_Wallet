import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import swaggerRoutes from './docs/swagger';
import { initSocketServer } from './socket/socket.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
}));
app.use(express.json());

// Documentación interactiva de endpoints (Swagger UI)
app.use('/api-docs', swaggerRoutes);
app.get('/docs', (_req, res) => res.redirect('/api-docs'));

// Ruta raíz de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'Arcoins Backend Running successfully 🚀',
    docs: '/api-docs',
  });
});

// Todas las rutas del contrato quedan bajo /api
app.use('/api', apiRoutes);

// Creamos el servidor HTTP sobre Express para poder compartirlo con Socket.io.
// Si usáramos app.listen() directamente, Socket.io no podría adjuntarse al mismo puerto.
const httpServer = http.createServer(app);

// Inicializamos Socket.io sobre el servidor HTTP
initSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Documentación disponible en http://localhost:${PORT}/api-docs`);
  console.log(`Socket.io escuchando en el mismo puerto`);
});
