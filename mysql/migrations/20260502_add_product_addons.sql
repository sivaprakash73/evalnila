CREATE TABLE IF NOT EXISTS addons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_addons (
  product_id INT NOT NULL,
  addon_id INT NOT NULL,
  PRIMARY KEY (product_id, addon_id),
  CONSTRAINT fk_product_addons_product
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_addons_addon
    FOREIGN KEY (addon_id) REFERENCES addons(id) ON DELETE CASCADE
);
