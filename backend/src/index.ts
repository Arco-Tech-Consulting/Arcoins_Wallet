// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import financialRoutes from './routes/financial.routes';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para leer JSON
app.use(express.json());

// Registrar rutas del módulo financiero
app.use('/api/financial', financialRoutes);

// Ruta de prueba general
app.get('/', (req, res) => {
  res.json({ message: 'ArcoPay Backend Running successfully 🚀' });
});

// Levantar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});