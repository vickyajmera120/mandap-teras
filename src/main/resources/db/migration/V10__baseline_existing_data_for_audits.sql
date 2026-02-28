-- =============================================
-- Mandap Billing System - Baseline Existing Data for Audits
-- Flyway Migration V10
-- =============================================

-- Create a single revision to act as the "creation" point for all pre-existing data
INSERT INTO revinfo (timestamp, username) VALUES (UNIX_TIMESTAMP() * 1000, 'system_baseline');

-- Store the new revision ID
SET @baseline_rev = LAST_INSERT_ID();

-- Insert baseline records for any missing Inventory Items (revtype 0 = ADD)
INSERT INTO inventory_items_aud (
    id, rev, revtype, 
    name_gujarati, name_english, default_rate, category, 
    display_order, total_stock, available_stock, active, 
    created_at, updated_at
)
SELECT 
    id, @baseline_rev, 0, 
    name_gujarati, name_english, default_rate, category, 
    display_order, total_stock, available_stock, active, 
    created_at, updated_at
FROM inventory_items 
WHERE id NOT IN (SELECT DISTINCT id FROM inventory_items_aud);

-- Insert baseline records for any missing Customers (revtype 0 = ADD)
INSERT INTO customers_aud (
    id, rev, revtype, 
    name, mobile, alternate_contact, address, 
    notes, active, created_at, updated_at
)
SELECT 
    id, @baseline_rev, 0, 
    name, mobile, alternate_contact, address, 
    notes, active, created_at, updated_at
FROM customers 
WHERE id NOT IN (SELECT DISTINCT id FROM customers_aud);

-- Insert baseline records for any missing Customer Pal Numbers (revtype 0 = ADD)
INSERT INTO customer_pal_numbers_aud (
    customer_id, pal_number, rev, revtype
)
SELECT 
    customer_id, pal_number, @baseline_rev, 0
FROM customer_pal_numbers 
WHERE customer_id NOT IN (SELECT DISTINCT customer_id FROM customer_pal_numbers_aud);
