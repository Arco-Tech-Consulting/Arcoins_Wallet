import type { Merchant } from '@/types/api'

/**
 * Respaldo local de comercios (mismos IDs del seed del backend).
 *
 * La fuente de verdad es `GET /api/merchants`; esta lista solo se usa si la
 * petición falla (por ejemplo, antes de desplegar el endpoint en el backend).
 */
export const FALLBACK_MERCHANTS: Merchant[] = [
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
