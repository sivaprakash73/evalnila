ALTER TABLE order_items
  ADD COLUMN item_notes VARCHAR(500) NULL AFTER selected_size;
