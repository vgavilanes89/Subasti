-- One-time seed matching the old mock catalog in src/api/items.js, with
-- seller_id remapped from the old mock ids ('user1'/'user2') to the real
-- Postgres user ids seeded in 002 (2 = AnaRdz, 3 = CPerez). Auction end
-- times are fixed here rather than relative to "now", since this is a
-- real persisted row now, not a value recomputed on every module load.
-- Safe to skip if you don't need the demo catalog.

INSERT INTO items (
  id, title, description, category, sub_category, currency, price, image, images,
  sale_type, condition, condition_detail, seller_id, quantity,
  shipping_ship, shipping_local, shipping_cost, buy_now_price,
  current_bid, bids, reserve_price, end_at, highest_bidder_id
) VALUES
  ('i1', 'iPhone 13 128GB - Medianoche',
   'Vendo iPhone 13 en excelentes condiciones, casi nuevo. Tiene 128GB de almacenamiento y el color es medianoche. La batería está al 95% de su capacidad. Siempre usado con protector.',
   'Electrónicos', 'Celulares', 'CRC', 220000,
   'https://placehold.co/600x400/8b5cf6/ffffff?text=iPhone+13',
   '["https://placehold.co/600x400/8b5cf6/ffffff?text=iPhone+1","https://placehold.co/600x400/8b5cf6/ffffff?text=iPhone+2","https://placehold.co/600x400/8b5cf6/ffffff?text=iPhone+3"]',
   'buy', 'used', 'Leve rasguño en esquina', '2', 1, TRUE, TRUE, 3000, NULL, NULL, 0, NULL, NULL, NULL),

  ('i2', 'Sofá Seccional Gris Moderno',
   'Sofá seccional de 3 piezas en color gris oscuro. Es muy cómodo y está en perfecto estado, sin manchas ni rasgaduras. Ideal para una sala de estar grande. Lo vendo por mudanza.',
   'Hogar', 'Muebles', 'CRC', 150000,
   'https://placehold.co/600x400/64748b/ffffff?text=Sofá',
   '["https://placehold.co/600x400/64748b/ffffff?text=Sofá"]',
   'auc', 'new', NULL, '3', 1, FALSE, TRUE, 0, 220000, 165000, 3, 160000, now() - interval '1 hour', NULL),

  ('i3', 'Bicicleta de Montaña Aro 29',
   'Bicicleta de montaña marca Trek, aro 29, con frenos de disco hidráulicos y suspensión delantera. Tiene 21 velocidades y está en excelente estado, lista para usarse.',
   'Deportes', 'Ciclismo', 'USD', 350,
   'https://placehold.co/600x400/16a34a/ffffff?text=Bicicleta',
   '["https://placehold.co/600x400/16a34a/ffffff?text=Bicicleta"]',
   'buy', 'new', NULL, '2', 5, TRUE, FALSE, 25, NULL, NULL, 0, NULL, NULL, NULL),

  ('i4', 'Cámara Canon EOS R con Lente 24-105mm',
   'Vendo cámara profesional Canon EOS R, full-frame mirrorless. Incluye el lente RF 24-105mm f/4L IS USM. Está en perfectas condiciones, sin rayones y con poco uso. Incluye batería, cargador y caja original.',
   'Electrónicos', 'Cámaras', 'USD', 1500,
   'https://placehold.co/600x400/dc2626/ffffff?text=Cámara',
   '["https://placehold.co/600x400/dc2626/ffffff?text=Cámara"]',
   'auc', 'new', NULL, '2', 1, TRUE, TRUE, 15, NULL, 1560, 5, 1600, now() + interval '30 days', NULL),

  ('i5', 'Taladro Inalámbrico 20V',
   'Potente taladro inalámbrico de 20V, incluye 2 baterías de litio, cargador y maletín. Usado solo un par de veces, como nuevo.',
   'Hogar', 'Herramientas', 'CRC', 45000,
   'https://placehold.co/600x400/f59e0b/ffffff?text=Taladro',
   '["https://placehold.co/600x400/f59e0b/ffffff?text=Taladro"]',
   'buy', 'used', 'Como nuevo', '3', 1, TRUE, TRUE, 2500, NULL, NULL, 0, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
