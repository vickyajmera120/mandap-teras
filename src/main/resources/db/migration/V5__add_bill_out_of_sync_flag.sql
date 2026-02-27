-- Add a flag to track when a rental order is modified after its bill was generated
ALTER TABLE rental_orders ADD COLUMN bill_out_of_sync TINYINT(1) NOT NULL DEFAULT 0;
