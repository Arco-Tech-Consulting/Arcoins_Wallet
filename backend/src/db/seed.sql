BEGIN;

-- Este archivo esta guardado en UTF-8. Se declara de forma explicita para que
-- el servidor no reinterprete los acentos segun la configuracion del cliente
-- (por defecto, algunos clientes en Windows envian otra codificacion y los
-- nombres quedan corruptos en la base).
SET client_encoding = 'UTF8';

-- ---------------------------------------------------------------------
-- Monedas
-- ---------------------------------------------------------------------
INSERT INTO currencies (code, name, symbol, decimals) VALUES
  ('COP', 'Peso colombiano', '$',  2),
  ('USD', 'Dólar estadounidense', 'US$', 2),
  ('EUR', 'Euro', '€', 2);

-- ---------------------------------------------------------------------
-- Usuarios (Ana, Bruno, Carla)
-- ---------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'ana@example.com',   '$2b$10$bx0zA4OEI6M0iQTvSGilZes4wk4tjYvVdTtNvjqmmIglMUuM0vR.q', 'Ana',   'Gomez'),
  ('a0000000-0000-0000-0000-000000000002', 'bruno@example.com', '$2b$10$bx0zA4OEI6M0iQTvSGilZes4wk4tjYvVdTtNvjqmmIglMUuM0vR.q', 'Bruno', 'Rojas'),
  ('a0000000-0000-0000-0000-000000000003', 'carla@example.com', '$2b$10$bx0zA4OEI6M0iQTvSGilZes4wk4tjYvVdTtNvjqmmIglMUuM0vR.q', 'Carla', 'Diaz');

-- ---------------------------------------------------------------------
-- Wallets (1 por usuario)
-- ---------------------------------------------------------------------
INSERT INTO wallets (id, user_id) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003');

-- ---------------------------------------------------------------------
-- Saldos finales (coinciden con las transacciones de más abajo)
-- ---------------------------------------------------------------------
INSERT INTO wallet_balances (wallet_id, currency, amount) VALUES
  -- Ana
  ('b0000000-0000-0000-0000-000000000001', 'COP', 4565000.00000000),
  ('b0000000-0000-0000-0000-000000000001', 'USD',     450.00000000),
  ('b0000000-0000-0000-0000-000000000001', 'EUR',      90.90909100),
  -- Bruno
  ('b0000000-0000-0000-0000-000000000002', 'COP',  440000.00000000),
  ('b0000000-0000-0000-0000-000000000002', 'USD',     225.00000000),
  ('b0000000-0000-0000-0000-000000000002', 'EUR',     200.00000000),
  -- Carla
  ('b0000000-0000-0000-0000-000000000003', 'COP', 1000000.00000000),
  ('b0000000-0000-0000-0000-000000000003', 'USD',       0.00000000),
  ('b0000000-0000-0000-0000-000000000003', 'EUR',       0.00000000);

-- ---------------------------------------------------------------------
-- Tasas de cambio (valores ilustrativos)
-- ---------------------------------------------------------------------
INSERT INTO exchange_rates (base_currency, target_currency, rate, fetched_at) VALUES
  ('USD', 'COP', 4000.0000000000, NOW() - INTERVAL '2 hours'),
  ('COP', 'USD',    0.0002500000, NOW() - INTERVAL '2 hours'),
  ('EUR', 'COP', 4400.0000000000, NOW() - INTERVAL '2 hours'),
  ('COP', 'EUR',    0.0002272727, NOW() - INTERVAL '2 hours'),
  ('EUR', 'USD',    1.1000000000, NOW() - INTERVAL '2 hours'),
  ('USD', 'EUR',    0.9090909100, NOW() - INTERVAL '2 hours');

-- ---------------------------------------------------------------------
-- Comercios ficticios
-- ---------------------------------------------------------------------
INSERT INTO merchants (id, name, category) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Café Andino',          'Restaurantes'),
  ('c0000000-0000-0000-0000-000000000002', 'Supermercado Central', 'Supermercado'),
  ('c0000000-0000-0000-0000-000000000003', 'Hotel Sol del Caribe', 'Hospedaje'),
  ('c0000000-0000-0000-0000-000000000004', 'Aerolínea Cielo Azul', 'Transporte');

-- ---------------------------------------------------------------------
-- Transacciones
-- ---------------------------------------------------------------------

-- ===== ANA =====
-- Depósitos
INSERT INTO transactions (user_id, type, to_currency, to_amount, description, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'deposit', 'COP', 5000000, 'Depósito inicial COP', NOW() - INTERVAL '6 days'),
  ('a0000000-0000-0000-0000-000000000001', 'deposit', 'USD',     500, 'Depósito inicial USD', NOW() - INTERVAL '6 days');

-- Compra: 400.000 COP -> 100 USD
INSERT INTO transactions (user_id, type, from_currency, to_currency, from_amount, to_amount, rate_used, rate_timestamp, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'buy', 'COP', 'USD', 400000, 100, 0.0002500000, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- Transferencia a Bruno: 50 USD (2 filas con el mismo transfer_group_id)
INSERT INTO transactions (user_id, type, from_currency, to_currency, from_amount, to_amount, counterpart_user_id, transfer_group_id, description, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'transfer_out', 'USD', NULL, 50, NULL,
     'a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Para el hotel', NOW() - INTERVAL '4 days'),
  ('a0000000-0000-0000-0000-000000000002', 'transfer_in',  NULL, 'USD', NULL, 50,
     'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Para el hotel', NOW() - INTERVAL '4 days');

-- Pago a comercio: 35.000 COP en Café Andino
INSERT INTO transactions (user_id, type, from_currency, from_amount, merchant_id, description, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'payment', 'COP', 35000, 'c0000000-0000-0000-0000-000000000001', 'Desayuno', NOW() - INTERVAL '3 days');

-- Intercambio: 100 USD -> 90.909091 EUR
INSERT INTO transactions (user_id, type, from_currency, to_currency, from_amount, to_amount, rate_used, rate_timestamp, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'exchange', 'USD', 'EUR', 100, 90.909091, 0.9090909100, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- ===== BRUNO =====
INSERT INTO transactions (user_id, type, to_currency, to_amount, description, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'deposit', 'USD', 200, 'Depósito inicial USD', NOW() - INTERVAL '6 days'),
  ('a0000000-0000-0000-0000-000000000002', 'deposit', 'EUR', 300, 'Depósito inicial EUR', NOW() - INTERVAL '6 days');

-- Venta: 100 EUR -> 440.000 COP
INSERT INTO transactions (user_id, type, from_currency, to_currency, from_amount, to_amount, rate_used, rate_timestamp, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'sell', 'EUR', 'COP', 100, 440000, 4400.0000000000, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- Pago: 25 USD en Hotel Sol del Caribe
INSERT INTO transactions (user_id, type, from_currency, from_amount, merchant_id, description, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'payment', 'USD', 25, 'c0000000-0000-0000-0000-000000000003', 'Reserva hotel', NOW() - INTERVAL '1 day');

-- ===== CARLA =====
INSERT INTO transactions (user_id, type, to_currency, to_amount, description, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'deposit', 'COP', 1000000, 'Depósito inicial COP', NOW() - INTERVAL '2 days');

-- Operación fallida (saldo EUR insuficiente): no afecta balances
INSERT INTO transactions (user_id, type, status, from_currency, to_currency, from_amount, to_amount, rate_used, rate_timestamp, description, created_at) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'exchange', 'failed', 'EUR', 'USD', 500, 550, 1.1000000000, NOW() - INTERVAL '1 day', 'Saldo insuficiente', NOW() - INTERVAL '1 day');

COMMIT;