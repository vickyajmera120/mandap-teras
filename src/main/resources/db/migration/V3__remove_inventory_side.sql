-- =============================================
-- Remove LEFT/RIGHT side concept from inventory
-- Renumber display_order into a single flat sequence
-- =============================================

-- Step 1: Renumber RIGHT side items to continue after LEFT side items
-- LEFT items keep display_order as-is (1..33)
-- RIGHT items get display_order = (max LEFT display_order) + their current display_order
SET @max_left_order = (SELECT COALESCE(MAX(display_order), 0) FROM inventory_items WHERE side = 'LEFT');

UPDATE inventory_items
SET display_order = display_order + @max_left_order
WHERE side = 'RIGHT';

-- Step 2: Drop the side column
ALTER TABLE inventory_items DROP COLUMN side;
