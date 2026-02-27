-- =============================================
-- Mandap Billing System - Fix Inventory Audit Category Type
-- Flyway Migration V8
-- =============================================

ALTER TABLE inventory_items_aud 
MODIFY COLUMN category ENUM('MANDAP','FURNITURE','BEDDING','KITCHEN','UTENSILS','DECORATION','MISCELLANEOUS');
