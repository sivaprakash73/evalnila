ALTER TABLE products
  ADD COLUMN mrp DECIMAL(10, 2) NULL AFTER image_urls,
  ADD COLUMN special_price DECIMAL(10, 2) NULL AFTER mrp;

UPDATE products
SET
  special_price = price,
  mrp = CASE
    WHEN mrp IS NULL THEN price
    ELSE mrp
  END
WHERE special_price IS NULL;
