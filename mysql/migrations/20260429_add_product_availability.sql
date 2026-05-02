ALTER TABLE products
  ADD COLUMN availability_type ENUM('ready_stock', 'make_order') NOT NULL DEFAULT 'ready_stock' AFTER stock,
  ADD COLUMN ready_stock_dispatch_days INT NULL AFTER availability_type,
  ADD COLUMN make_order_dispatch_days INT NULL AFTER ready_stock_dispatch_days;

UPDATE products
SET
  availability_type = CASE WHEN stock > 0 THEN 'ready_stock' ELSE 'make_order' END,
  ready_stock_dispatch_days = COALESCE(ready_stock_dispatch_days, 2),
  make_order_dispatch_days = COALESCE(make_order_dispatch_days, 7);
