INSERT IGNORE INTO product_sizes (product_id, size_id)
SELECT p.id, s.id
FROM products p
INNER JOIN sizes s ON s.label IN ('M', 'L', 'XL')
WHERE NOT EXISTS (
  SELECT 1
  FROM product_sizes existing
);
