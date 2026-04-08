CREATE TABLE IF NOT EXISTS order_items (
  id         CHAR(36)      NOT NULL DEFAULT (UUID()),
  order_id   CHAR(36)      NOT NULL,
  product_id CHAR(36)      NOT NULL,
  qty        INT           NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_items_order   FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT chk_items_qty CHECK (qty > 0),
  KEY idx_items_order   (order_id),
  KEY idx_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
