import type { Merchant } from '@/types/api'

/**
 * Comercios disponibles para pagar.
 *
 * Temporalmente se definen aquí con los mismos IDs del seed del backend
 * (backend/src/db/seed.sql) porque el backend aún no expone GET /api/merchants.
 * Cuando exista ese endpoint, reemplazar esto por una llamada a la API.
 */
export const MERCHANTS: Merchant[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Café Andino',
    category: 'Restaurantes',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    name: 'Supermercado Central',
    category: 'Supermercado',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    name: 'Hotel Sol del Caribe',
    category: 'Hospedaje',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    name: 'Aerolínea Cielo Azul',
    category: 'Transporte',
  },
]
