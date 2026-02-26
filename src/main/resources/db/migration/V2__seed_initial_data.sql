-- =============================================
-- Mandap Billing System - Initial Seed Data
-- Flyway Migration V2
-- =============================================

-- =============================================
-- 1. Permissions
-- =============================================
INSERT INTO permissions (name, description) VALUES
    ('CUSTOMER_READ', 'customer read'),
    ('CUSTOMER_WRITE', 'customer write'),
    ('EVENT_READ', 'event read'),
    ('EVENT_WRITE', 'event write'),
    ('BILL_READ', 'bill read'),
    ('BILL_CREATE', 'bill create'),
    ('BILL_EDIT', 'bill edit'),
    ('BILL_DELETE', 'bill delete'),
    ('INVENTORY_READ', 'inventory read'),
    ('INVENTORY_WRITE', 'inventory write'),
    ('USER_MANAGE', 'user manage'),
    ('ROLE_MANAGE', 'role manage');

-- =============================================
-- 2. Roles
-- =============================================
INSERT INTO roles (name, description) VALUES
    ('ADMIN', 'Full system access'),
    ('MANAGER', 'Manage events, customers, billing'),
    ('BILLING_CLERK', 'Create customers and bills'),
    ('VIEWER', 'Read-only access');

-- =============================================
-- 3. Role-Permission Mappings
-- =============================================

-- ADMIN gets ALL permissions (IDs 1-12)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'ADMIN';

-- MANAGER gets all EXCEPT USER_MANAGE, ROLE_MANAGE, BILL_DELETE
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'MANAGER'
  AND p.name NOT IN ('USER_MANAGE', 'ROLE_MANAGE', 'BILL_DELETE');

-- BILLING_CLERK gets CUSTOMER_READ, CUSTOMER_WRITE, BILL_READ, BILL_CREATE, EVENT_READ, INVENTORY_READ
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'BILLING_CLERK'
  AND p.name IN ('CUSTOMER_READ', 'CUSTOMER_WRITE', 'BILL_READ', 'BILL_CREATE', 'EVENT_READ', 'INVENTORY_READ');

-- VIEWER gets all READ permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'VIEWER'
  AND p.name LIKE '%_READ';

-- =============================================
-- 4. Admin Users (password: Admin@123)
-- =============================================
INSERT INTO users (username, password, full_name, email, active, created_at, updated_at) VALUES
    ('admin1', '$2b$12$Fi.CQA.FHSQyi1EsJ52Is.csYb1Oo14MmhHnHq.4GjlHb7VmN1vn6', 'Admin User 1', 'admin1@mandap.com', 1, NOW(6), NOW(6)),
    ('admin2', '$2b$12$Fi.CQA.FHSQyi1EsJ52Is.csYb1Oo14MmhHnHq.4GjlHb7VmN1vn6', 'Admin User 2', 'admin2@mandap.com', 1, NOW(6), NOW(6)),
    ('admin3', '$2b$12$Fi.CQA.FHSQyi1EsJ52Is.csYb1Oo14MmhHnHq.4GjlHb7VmN1vn6', 'Admin User 3', 'admin3@mandap.com', 1, NOW(6), NOW(6));

-- Assign ADMIN role to all admin users
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.username IN ('admin1', 'admin2', 'admin3') AND r.name = 'ADMIN';

-- =============================================
-- 5. Inventory Items - LEFT SIDE
-- =============================================
INSERT INTO inventory_items (name_gujarati, name_english, default_rate, category, side, display_order, total_stock, available_stock, active) VALUES
    ('છતવાળા પાલ ડબલ કાપડ', 'Chatvala Pal Double Kapad', 9000.00, 'MANDAP', 'LEFT', 1, 0, 0, 1),
    ('પાકા પાલમા મંડપ (30x60)', 'Paka Palma Mandap (30x60)', 6000.00, 'MANDAP', 'LEFT', 2, 0, 0, 1),
    ('એક્સ્ટ્રા મંડપ', 'Extra Mandap', 725.00, 'MANDAP', 'LEFT', 3, 0, 0, 1),
    ('એક્સ્ટ્રા પાર્ટીશન', 'Extra Partition', 200.00, 'MANDAP', 'LEFT', 4, 0, 0, 1),
    ('પ્લા. ખુરશી', 'Pla. Khurshi', 40.00, 'FURNITURE', 'LEFT', 5, 0, 0, 1),
    ('હેન્ડલવાળી ખુરશી', 'Handlevali Khurshi', 45.00, 'FURNITURE', 'LEFT', 6, 0, 0, 1),
    ('ગાદલા', 'Gadla', 45.00, 'BEDDING', 'LEFT', 7, 0, 0, 1),
    ('રજાઇ', 'Rajai', 35.00, 'BEDDING', 'LEFT', 8, 0, 0, 1),
    ('ઓશિકા', 'Oshika', 10.00, 'BEDDING', 'LEFT', 9, 0, 0, 1),
    ('પાણી બેરલ', 'Pani Beral', 220.00, 'MISCELLANEOUS', 'LEFT', 10, 0, 0, 1),
    ('લાકડાના ટેબલ (2X4)', 'Lakdana Table (2x4)', 100.00, 'FURNITURE', 'LEFT', 11, 0, 0, 1),
    ('લાકડાના ટેબલ (1.5X6)', 'Lakdana Table (1.5x6)', 170.00, 'FURNITURE', 'LEFT', 12, 0, 0, 1),
    ('લાકડાના ટેબલ (2.5X6)', 'Lakdana Table (2.5x6)', 250.00, 'FURNITURE', 'LEFT', 13, 0, 0, 1),
    ('બુફે જાલર', 'Buffet Jalar', 110.00, 'DECORATION', 'LEFT', 14, 0, 0, 1),
    ('પ્લા. રોલ ૨૫ ફુટ', 'Pla. Roll 25 Foot', 125.00, 'MISCELLANEOUS', 'LEFT', 15, 0, 0, 1),
    ('સોફા', 'Sofa', 700.00, 'FURNITURE', 'LEFT', 16, 0, 0, 1),
    ('જાજમ (15X15)', 'Jajam (15x15)', 250.00, 'DECORATION', 'LEFT', 17, 0, 0, 1),
    ('જાજમ (15X30)', 'Jajam (15x30)', 500.00, 'DECORATION', 'LEFT', 18, 0, 0, 1),
    ('જાજમ (15X60)', 'Jajam (15x60)', 1000.00, 'DECORATION', 'LEFT', 19, 0, 0, 1),
    ('ટેબલ ક્લોથ', 'Table Cloth', 40.00, 'DECORATION', 'LEFT', 20, 0, 0, 1),
    ('ટેબલ કવર', 'Table Cover', 100.00, 'DECORATION', 'LEFT', 21, 0, 0, 1),
    ('તપેલા (Per kg.)', 'Tapela (Per kg.)', 40.00, 'KITCHEN', 'LEFT', 22, 0, 0, 1),
    ('કડાઈ (તેલની)', 'Kadai (Telni)', 250.00, 'KITCHEN', 'LEFT', 23, 0, 0, 1),
    ('ભાત ચારણા', 'Bhat Charna', 150.00, 'KITCHEN', 'LEFT', 24, 0, 0, 1),
    ('વાસણ ટબ - નાના', 'Vasan Tub - Nana', 100.00, 'KITCHEN', 'LEFT', 25, 0, 0, 1),
    ('વાસણ ટબ - મોટા', 'Vasan Tub - Mota', 200.00, 'KITCHEN', 'LEFT', 26, 0, 0, 1),
    ('ધમેલા (બાઉલ)', 'Dhamela', 40.00, 'UTENSILS', 'LEFT', 27, 0, 0, 1),
    ('કમંડળ', 'Kamandal', 40.00, 'UTENSILS', 'LEFT', 28, 0, 0, 1),
    ('ડોલ', 'Dol', 40.00, 'UTENSILS', 'LEFT', 29, 0, 0, 1),
    ('જગ', 'Jag', 40.00, 'UTENSILS', 'LEFT', 30, 0, 0, 1),
    ('સ્ટીલ તપેલા', 'Steel Tapela', 200.00, 'KITCHEN', 'LEFT', 31, 0, 0, 1),
    ('તવેથા/જારા', 'Tavetha / Jara', 50.00, 'KITCHEN', 'LEFT', 32, 0, 0, 1),
    ('ગેસ ચુલા', 'Gas Chula', 440.00, 'KITCHEN', 'LEFT', 33, 0, 0, 1);

-- =============================================
-- 6. Inventory Items - RIGHT SIDE
-- =============================================
INSERT INTO inventory_items (name_gujarati, name_english, default_rate, category, side, display_order, total_stock, available_stock, active) VALUES
    ('ચા. થર્મોસ', 'Cha Thermos', 500.00, 'KITCHEN', 'RIGHT', 1, 0, 0, 1),
    ('સ્ટીલ પવાલી 25 થી 70 લીટર', 'Steel Pavali 25 thi 70 Liter', 200.00, 'KITCHEN', 'RIGHT', 2, 0, 0, 1),
    ('સ્ટીલ પવાલી 125 લીટર', 'Steel Pavali 125 Liter', 400.00, 'KITCHEN', 'RIGHT', 3, 0, 0, 1),
    ('એલ્યુ. પવાલી', 'Alu. Pavali', 600.00, 'KITCHEN', 'RIGHT', 4, 0, 0, 1),
    ('ચમચા / ડોયા / ભાતીયા', 'Chamcha / Doya / Bhatiya', 15.00, 'UTENSILS', 'RIGHT', 5, 0, 0, 1),
    ('થાળી / ડિશ', 'Thali / Dish', 8.00, 'UTENSILS', 'RIGHT', 6, 0, 0, 1),
    ('વાટકી', 'Vatki', 4.00, 'UTENSILS', 'RIGHT', 7, 0, 0, 1),
    ('ગ્લાસ', 'Glass', 5.00, 'UTENSILS', 'RIGHT', 8, 0, 0, 1),
    ('ચમચી', 'Chamchi', 3.00, 'UTENSILS', 'RIGHT', 9, 0, 0, 1),
    ('એલ્યુ. ત્રાસ નાના', 'Alu. Tras Nana', 125.00, 'KITCHEN', 'RIGHT', 10, 0, 0, 1),
    ('એલ્યુ. ત્રાસ મીડીયમ', 'Alu. Tras Midium', 200.00, 'KITCHEN', 'RIGHT', 11, 0, 0, 1),
    ('એલ્યુ. ત્રાસ મોટા', 'Alu. Tras Mota', 250.00, 'KITCHEN', 'RIGHT', 12, 0, 0, 1),
    ('એલ્યુ. છીબા', 'Alu. Chhiba', 150.00, 'KITCHEN', 'RIGHT', 13, 0, 0, 1),
    ('સિંગલ પાટલા', 'Single Patla', 40.00, 'FURNITURE', 'RIGHT', 14, 0, 0, 1),
    ('પાટલી - વેલણ', 'Patli - Velan', 50.00, 'KITCHEN', 'RIGHT', 15, 0, 0, 1),
    ('રોટલી તવા', 'Roti Tava', 200.00, 'KITCHEN', 'RIGHT', 16, 0, 0, 1),
    ('ચોકી નાની', 'Choki Nani', 100.00, 'FURNITURE', 'RIGHT', 17, 0, 0, 1),
    ('ચોકી મોટી', 'Choki Moti', 200.00, 'FURNITURE', 'RIGHT', 18, 0, 0, 1),
    ('બાજોઠ', 'Bajoth', 40.00, 'FURNITURE', 'RIGHT', 19, 0, 0, 1),
    ('બાજોઠ રુમાલ', 'Bajoth Rumal', 20.00, 'DECORATION', 'RIGHT', 20, 0, 0, 1),
    ('લાંબી ગાદી', 'Lambi Gadi', 45.00, 'BEDDING', 'RIGHT', 21, 0, 0, 1),
    ('ગોળ તકીયા', 'Gol Takiya', 30.00, 'BEDDING', 'RIGHT', 22, 0, 0, 1),
    ('વોશ બેસીન', 'Wash Basin', 600.00, 'MISCELLANEOUS', 'RIGHT', 23, 0, 0, 1),
    ('ફો. પલંગ', 'Fo. Palang', 190.00, 'FURNITURE', 'RIGHT', 24, 0, 0, 1),
    ('એક્સ્ટ્રા થાંભલા / વળી', 'Extra Thambhala / Vali', 110.00, 'MANDAP', 'RIGHT', 25, 0, 0, 1),
    ('કાર્પેટ ફ્લોરિંગ (Sq.ft.)', 'Carpet Flooring (Sq.ft.)', 3.00, 'DECORATION', 'RIGHT', 26, 0, 0, 1),
    ('વાહન ભાડું (એક ફેરાના)', 'Vahan Bhadu (Ek Ferana)', 500.00, 'MISCELLANEOUS', 'RIGHT', 27, 0, 0, 1);
