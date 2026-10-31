import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { parse } from 'yaml';
import path from 'path';
import fs from 'fs';

const router = Router();

// Buscar openapi.yaml en posibles ubicaciones para soportar tanto desarrollo (tsx) como producción (dist/tsc)
const candidatePaths = [
  path.resolve(process.cwd(), 'openapi.yaml'),
  path.resolve(__dirname, 'openapi.yaml'),
  path.resolve(__dirname, '../docs/openapi.yaml'),
  path.resolve(__dirname, '../../openapi.yaml'),
  path.resolve(__dirname, '../openapi.yaml'),
];

const openApiPath = candidatePaths.find((candidate) => fs.existsSync(candidate));

let swaggerDocument: any = null;

if (openApiPath) {
  try {
    swaggerDocument = parse(fs.readFileSync(openApiPath, 'utf8'));
  } catch (error) {
    console.error('Error al cargar el archivo openapi.yaml:', error);
  }
} else {
  console.warn('Advertencia: No se encontró openapi.yaml en las rutas evaluadas.');
}

if (swaggerDocument) {
  // Montar Swagger UI con título personalizado
  router.use(
    '/',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: 'Arcoins API Docs | Swagger UI',
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );
} else {
  router.get('/', (_req: Request, res: Response) => {
    res.status(500).json({
      error: 'La documentación OpenAPI no está disponible en este momento.',
    });
  });
}

export default router;
