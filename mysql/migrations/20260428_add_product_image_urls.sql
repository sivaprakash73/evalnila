USE ecom_dashboard;

ALTER TABLE products
  ADD COLUMN image_urls JSON NULL AFTER image_url;
