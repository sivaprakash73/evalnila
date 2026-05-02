ALTER TABLE products
  ADD COLUMN tax_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0 AFTER price;

ALTER TABLE orders
  ADD COLUMN tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER subtotal;

CREATE TABLE IF NOT EXISTS commerce_settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  setting_value DECIMAL(10, 2) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO commerce_settings (setting_key, setting_value) VALUES
  ('shipping_amount', 20),
  ('free_shipping_minimum', 1000);
