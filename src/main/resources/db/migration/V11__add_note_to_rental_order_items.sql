-- Add note column to rental_order_items
ALTER TABLE rental_order_items ADD COLUMN note VARCHAR(255);

-- Add to audit table as well
ALTER TABLE rental_order_items_aud ADD COLUMN note VARCHAR(255);
