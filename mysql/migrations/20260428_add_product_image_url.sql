USE ecom_dashboard;

ALTER TABLE products
  ADD COLUMN image_url VARCHAR(255) NULL AFTER description;
