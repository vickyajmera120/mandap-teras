-- =============================================
-- Add support for custom/ad-hoc bill items
-- These are items not in inventory but still
-- appear on the bill with name, qty, rate, total
-- =============================================

-- Make item_id nullable for custom items
ALTER TABLE bill_items MODIFY COLUMN item_id BIGINT NULL;

-- Add custom item fields
ALTER TABLE bill_items ADD COLUMN custom_item_name VARCHAR(200) NULL;
ALTER TABLE bill_items ADD COLUMN is_custom_item BIT DEFAULT 0;
