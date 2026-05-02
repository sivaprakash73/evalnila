USE ecom_dashboard;

INSERT INTO admin_users (name, email, password_hash, role)
VALUES
  ('Evalnila Admin', 'admin@evalnila.com', SHA2('admin123', 256), 'admin')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password_hash = VALUES(password_hash),
  role = VALUES(role);

INSERT INTO categories (name, slug)
VALUES
  ('Kurtis', 'kurtis'),
  ('Maxis', 'maxis'),
  ('Co-ord', 'co-ord'),
  ('Crop-Skirt', 'crop-skirt'),
  ('Western wear', 'western-wear'),
  ('Sarees', 'sarees')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  slug = VALUES(slug);

INSERT INTO customers (first_name, last_name, email, phone, city, country)
VALUES
  ('Aarav', 'Patel', 'aarav@example.com', '+91-9000000001', 'Mumbai', 'India'),
  ('Mia', 'Carter', 'mia@example.com', '+1-555-0101', 'Austin', 'USA'),
  ('Liam', 'Brooks', 'liam@example.com', '+44-20-1234-5678', 'London', 'UK'),
  ('Sophia', 'Reed', 'sophia@example.com', '+1-555-0102', 'Toronto', 'Canada')
ON DUPLICATE KEY UPDATE
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  phone = VALUES(phone),
  city = VALUES(city),
  country = VALUES(country);

DELETE oi
FROM order_items oi
INNER JOIN products p ON p.id = oi.product_id
WHERE p.sku IN ('SH-UR-001', 'EL-AU-014', 'FS-BG-033', 'EL-WR-102', 'SS55');

DELETE FROM products
WHERE sku IN ('SH-UR-001', 'EL-AU-014', 'FS-BG-033', 'EL-WR-102', 'SS55');

DELETE FROM categories
WHERE slug IN ('footwear', 'electronics', 'accessories', 'wearables')
  AND id NOT IN (SELECT category_id FROM products);

INSERT INTO products (category_id, name, slug, sku, description, image_url, image_urls, mrp, special_price, price, tax_percentage, stock, availability_type, ready_stock_dispatch_days, make_order_dispatch_days, revenue, status)
VALUES
  ((SELECT id FROM categories WHERE slug = 'kurtis'), 'Custom Kurti Set', 'custom-kurti-set', 'EV-KU-001', 'Customized kurti stitching with neckline, sleeve, and length options.', NULL, NULL, 1599.00, 1200.00, 1200.00, 5.00, 24, 'ready_stock', 2, 7, 14400.00, 'active'),
  ((SELECT id FROM categories WHERE slug = 'maxis'), 'Elegant Maxi Dress', 'elegant-maxi-dress', 'EV-MA-002', 'Flowing maxi design for everyday and occasion wear.', NULL, NULL, 2299.00, 1800.00, 1800.00, 5.00, 18, 'ready_stock', 2, 8, 12600.00, 'active'),
  ((SELECT id FROM categories WHERE slug = 'co-ord'), 'Tailored Co-ord Set', 'tailored-co-ord-set', 'EV-CO-003', 'Matching top and bottom set with custom fit options.', NULL, NULL, 2799.00, 2200.00, 2200.00, 5.00, 0, 'make_order', 2, 10, 17600.00, 'active'),
  ((SELECT id FROM categories WHERE slug = 'crop-skirt'), 'Crop-Skirt Occasion Set', 'crop-skirt-occasion-set', 'EV-CS-004', 'Crop top and skirt set designed for celebrations and events.', NULL, NULL, 3199.00, 2500.00, 2500.00, 5.00, 0, 'make_order', 2, 12, 15000.00, 'active'),
  ((SELECT id FROM categories WHERE slug = 'western-wear'), 'Western Wear Dress', 'western-wear-dress', 'EV-WW-005', 'Modern western wear silhouette with custom styling details.', NULL, NULL, 2599.00, 2000.00, 2000.00, 5.00, 16, 'ready_stock', 2, 8, 16000.00, 'active'),
  ((SELECT id FROM categories WHERE slug = 'sarees'), 'Saree Styling Blouse', 'saree-styling-blouse', 'EV-SA-006', 'Custom stitched blouse and saree styling support.', NULL, NULL, 1999.00, 1500.00, 1500.00, 5.00, 0, 'make_order', 2, 7, 13500.00, 'active')
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  name = VALUES(name),
  slug = VALUES(slug),
  sku = VALUES(sku),
  description = VALUES(description),
  image_url = VALUES(image_url),
  image_urls = VALUES(image_urls),
  mrp = VALUES(mrp),
  special_price = VALUES(special_price),
  price = VALUES(price),
  tax_percentage = VALUES(tax_percentage),
  stock = VALUES(stock),
  availability_type = VALUES(availability_type),
  ready_stock_dispatch_days = VALUES(ready_stock_dispatch_days),
  make_order_dispatch_days = VALUES(make_order_dispatch_days),
  revenue = VALUES(revenue),
  status = VALUES(status);

INSERT IGNORE INTO sizes (label, sort_order) VALUES
  ('XS', 1),
  ('S', 2),
  ('M', 3),
  ('L', 4),
  ('XL', 5),
  ('XXL', 6);

INSERT IGNORE INTO product_sizes (product_id, size_id)
SELECT p.id, s.id
FROM products p
INNER JOIN sizes s ON s.label IN ('M', 'L', 'XL')
WHERE p.slug IN ('custom-kurti-set', 'elegant-maxi-dress', 'tailored-co-ord-set', 'crop-skirt-occasion-set', 'western-wear-dress', 'saree-styling-blouse');

INSERT INTO orders (customer_id, order_number, order_date, status, payment_status, subtotal, tax_amount, shipping_fee, total_amount)
VALUES
  (1, 'ORD-24081', '2026-04-24 10:10:00', 'Packed', 'Paid', 4600.00, 230.00, 0.00, 4830.00),
  (2, 'ORD-24080', '2026-04-24 09:25:00', 'Shipped', 'Paid', 3800.00, 190.00, 0.00, 3990.00),
  (3, 'ORD-24079', '2026-04-23 17:40:00', 'Delivered', 'Paid', 1500.00, 75.00, 0.00, 1575.00),
  (4, 'ORD-24078', '2026-04-23 16:15:00', 'Pending', 'Pending', 2500.00, 125.00, 0.00, 2625.00)
ON DUPLICATE KEY UPDATE
  customer_id = VALUES(customer_id),
  order_date = VALUES(order_date),
  status = VALUES(status),
  payment_status = VALUES(payment_status),
  subtotal = VALUES(subtotal),
  tax_amount = VALUES(tax_amount),
  shipping_fee = VALUES(shipping_fee),
  total_amount = VALUES(total_amount);

CREATE TABLE IF NOT EXISTS commerce_settings (
  setting_key VARCHAR(80) PRIMARY KEY,
  setting_value DECIMAL(10, 2) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO commerce_settings (setting_key, setting_value) VALUES
  ('shipping_amount', 20),
  ('free_shipping_minimum', 1000);

DELETE oi
FROM order_items oi
INNER JOIN orders o ON o.id = oi.order_id
WHERE o.order_number IN ('ORD-24081', 'ORD-24080', 'ORD-24079', 'ORD-24078');

INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
VALUES
  (1, (SELECT id FROM products WHERE slug = 'custom-kurti-set'), 2, 1200.00, 2400.00),
  (1, (SELECT id FROM products WHERE slug = 'tailored-co-ord-set'), 1, 2200.00, 2200.00),
  (2, (SELECT id FROM products WHERE slug = 'elegant-maxi-dress'), 1, 1800.00, 1800.00),
  (2, (SELECT id FROM products WHERE slug = 'western-wear-dress'), 1, 2000.00, 2000.00),
  (3, (SELECT id FROM products WHERE slug = 'saree-styling-blouse'), 1, 1500.00, 1500.00),
  (4, (SELECT id FROM products WHERE slug = 'crop-skirt-occasion-set'), 1, 2500.00, 2500.00)
ON DUPLICATE KEY UPDATE line_total = VALUES(line_total);
