package com.mandap.config;

import com.mandap.entity.*;
import com.mandap.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

/**
 * Initializes the database with default data on application startup.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public DataInitializer(UserRepository userRepository, RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            InventoryItemRepository inventoryItemRepository,
            PasswordEncoder passwordEncoder,
            org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // Aggressive cleanup on startup
        try {
            System.out.println("Running manual DB cleanup...");

            // Checks for 'bills'
            if (columnExists("bills", "event_id")) {
                System.out.println("Found event_id in bills.");
                // 1. Make Nullable
                try {
                    jdbcTemplate.execute("ALTER TABLE bills MODIFY COLUMN event_id BIGINT NULL");
                    System.out.println("Made bills.event_id NULLABLE.");
                } catch (Exception e) {
                    System.err.println("Failed to make bills.event_id nullable: " + e.getMessage());
                }
                // 2. Drop
                cleanupColumn("bills", "event_id");
            }

            // Checks for 'rental_orders'
            if (columnExists("rental_orders", "event_id")) {
                System.out.println("Found event_id in rental_orders.");
                try {
                    jdbcTemplate.execute("ALTER TABLE rental_orders MODIFY COLUMN event_id BIGINT NULL");
                    System.out.println("Made rental_orders.event_id NULLABLE.");
                } catch (Exception e) {
                    System.err.println("Failed to make rental_orders.event_id nullable: " + e.getMessage());
                }
                cleanupColumn("rental_orders", "event_id");
            }

        } catch (Exception e) {
            System.err.println("DB Cleanup warning: " + e.getMessage());
        }

        // Only initialize if no users exist
        if (userRepository.count() == 0) {
            initializePermissions();
            initializeRoles();
            initializeAdminUsers();
        }

        // Initialize inventory if empty
        if (inventoryItemRepository.count() == 0) {
            initializeInventoryItems();
        }
    }

    private boolean columnExists(String tableName, String columnName) {
        List<Map<String, Object>> columns = jdbcTemplate.queryForList(
                "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                tableName, columnName);
        return !columns.isEmpty();
    }

    private void cleanupColumn(String tableName, String columnName) {
        try {
            // Drop FKs
            List<Map<String, Object>> fks = jdbcTemplate.queryForList(
                    "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL",
                    tableName, columnName);
            for (Map<String, Object> fk : fks) {
                String constraintName = (String) fk.get("CONSTRAINT_NAME");
                try {
                    jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP FOREIGN KEY " + constraintName);
                    System.out.println("Dropped FK: " + constraintName);
                } catch (Exception e) {
                    System.err.println("Failed to drop FK " + constraintName);
                }
            }

            // Drop Index
            List<Map<String, Object>> indexes = jdbcTemplate.queryForList(
                    "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS " +
                            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? AND INDEX_NAME != 'PRIMARY'",
                    tableName, columnName);
            for (Map<String, Object> idx : indexes) {
                String indexName = (String) idx.get("INDEX_NAME");
                try {
                    jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP INDEX " + indexName);
                } catch (Exception ignore) {
                }
            }

            // Drop Column
            jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP COLUMN " + columnName);
            System.out.println("Dropped " + columnName + " from " + tableName);
        } catch (Exception e) {
            System.err.println("Failed to cleanup " + columnName + " from " + tableName + ": " + e.getMessage());
        }
    }

    private void initializePermissions() {
        String[] permissionNames = {
                "CUSTOMER_READ", "CUSTOMER_WRITE",
                "EVENT_READ", "EVENT_WRITE",
                "BILL_READ", "BILL_CREATE", "BILL_EDIT", "BILL_DELETE",
                "INVENTORY_READ", "INVENTORY_WRITE",
                "USER_MANAGE", "ROLE_MANAGE"
        };

        for (String name : permissionNames) {
            Permission p = new Permission();
            p.setName(name);
            p.setDescription(name.replace("_", " ").toLowerCase());
            permissionRepository.save(p);
        }
    }

    private void initializeRoles() {
        List<Permission> allPermissions = permissionRepository.findAll();

        // ADMIN - all permissions
        Role admin = new Role();
        admin.setName("ADMIN");
        admin.setDescription("Full system access");
        admin.setPermissions(new HashSet<>(allPermissions));
        roleRepository.save(admin);

        // MANAGER - most permissions
        Role manager = new Role();
        manager.setName("MANAGER");
        manager.setDescription("Manage events, customers, billing");
        Set<Permission> managerPerms = new HashSet<>();
        for (Permission p : allPermissions) {
            if (!p.getName().contains("USER") && !p.getName().contains("ROLE") && !p.getName().contains("DELETE")) {
                managerPerms.add(p);
            }
        }
        manager.setPermissions(managerPerms);
        roleRepository.save(manager);

        // BILLING_CLERK
        Role clerk = new Role();
        clerk.setName("BILLING_CLERK");
        clerk.setDescription("Create customers and bills");
        Set<Permission> clerkPerms = new HashSet<>();
        for (Permission p : allPermissions) {
            if (p.getName().contains("CUSTOMER") || p.getName().equals("BILL_READ") ||
                    p.getName().equals("BILL_CREATE") || p.getName().contains("EVENT_READ") ||
                    p.getName().equals("INVENTORY_READ")) {
                clerkPerms.add(p);
            }
        }
        clerk.setPermissions(clerkPerms);
        roleRepository.save(clerk);

        // VIEWER
        Role viewer = new Role();
        viewer.setName("VIEWER");
        viewer.setDescription("Read-only access");
        Set<Permission> viewerPerms = new HashSet<>();
        for (Permission p : allPermissions) {
            if (p.getName().contains("READ")) {
                viewerPerms.add(p);
            }
        }
        viewer.setPermissions(viewerPerms);
        roleRepository.save(viewer);
    }

    private void initializeAdminUsers() {
        Role adminRole = roleRepository.findByName("ADMIN").orElseThrow();
        String encodedPassword = passwordEncoder.encode("Admin@123");

        for (int i = 1; i <= 3; i++) {
            User user = new User();
            user.setUsername("admin" + i);
            user.setPassword(encodedPassword);
            user.setFullName("Admin User " + i);
            user.setEmail("admin" + i + "@mandap.com");
            user.setActive(true);
            user.setRoles(Set.of(adminRole));
            userRepository.save(user);
        }
    }

    private void initializeInventoryItems() {
        // LEFT SIDE ITEMS
        Object[][] leftItems = {
                { "છતવાળા પાલ ડબલ કાપડ", "Double Cloth Roof Pal", 9000.00, "MANDAP" },
                { "પાકા પાલમા મંડપ (30x60)", "Paka Palma Mandap (30x60)", 6000.00, "MANDAP" },
                { "એક્સ્ટ્રા મંડપ", "Extra Mandap", 725.00, "MANDAP" },
                { "એક્સ્ટ્રા પાર્ટીશન", "Extra Partition", 200.00, "MANDAP" },
                { "પ્લા. ખુરશી", "Plastic Chair", 40.00, "FURNITURE" },
                { "હેન્ડલવાળી ખુરશી", "Chair with Handle", 45.00, "FURNITURE" },
                { "ગાદલા", "Mattress", 45.00, "BEDDING" },
                { "રજાઇ", "Quilt", 35.00, "BEDDING" },
                { "ઓશિકા", "Pillow", 10.00, "BEDDING" },
                { "પાણી બેરલ", "Water Barrel", 220.00, "MISCELLANEOUS" },
                { "લાકડાના ટેબલ (2X4)", "Wooden Table (2X4)", 100.00, "FURNITURE" },
                { "લાકડાના ટેબલ (1.5X6)", "Wooden Table (1.5X6)", 170.00, "FURNITURE" },
                { "લાકડાના ટેબલ (2.5X6)", "Wooden Table (2.5X6)", 250.00, "FURNITURE" },
                { "બુફે જાલર", "Buffet Jalar", 110.00, "DECORATION" },
                { "પ્લા. રોલ ૨૫ ફુટ", "Plastic Roll 25 Feet", 125.00, "MISCELLANEOUS" },
                { "સોફા", "Sofa", 700.00, "FURNITURE" },
                { "જાજમ (15X15)", "Jajam (15X15)", 250.00, "DECORATION" },
                { "જાજમ (15X30)", "Jajam (15X30)", 500.00, "DECORATION" },
                { "જાજમ (15X60)", "Jajam (15X60)", 1000.00, "DECORATION" },
                { "ટેબલ ક્લોથ", "Table Cloth", 40.00, "DECORATION" },
                { "ટેબલ કવર", "Table Cover", 100.00, "DECORATION" },
                { "તપેલા (Per kg.)", "Tapela (Per kg.)", 40.00, "KITCHEN" },
                { "કડાઈ (તેલની)", "Kadai (Oil)", 250.00, "KITCHEN" },
                { "ભાત ચારણા", "Rice Charana", 150.00, "KITCHEN" },
                { "વાસણ ટબ - નાના", "Utensil Tub - Small", 100.00, "KITCHEN" },
                { "વાસણ ટબ - મોટા", "Utensil Tub - Large", 200.00, "KITCHEN" },
                { "ધમેલા (બાઉલ)", "Dhamela (Bowl)", 40.00, "UTENSILS" },
                { "કમંડળ", "Kamandal", 40.00, "UTENSILS" },
                { "ડોલ", "Bucket", 40.00, "UTENSILS" },
                { "જગ", "Jug", 40.00, "UTENSILS" },
                { "સ્ટીલ તપેલા", "Steel Tapela", 200.00, "KITCHEN" },
                { "તવેથા/જારા", "Tavetha/Jara", 50.00, "KITCHEN" },
                { "ગેસ ચુલા", "Gas Stove", 440.00, "KITCHEN" }
        };

        int order = 1;
        for (Object[] item : leftItems) {
            InventoryItem inv = new InventoryItem();
            inv.setNameGujarati((String) item[0]);
            inv.setNameEnglish((String) item[1]);
            inv.setDefaultRate(BigDecimal.valueOf((Double) item[2]));
            inv.setCategory(InventoryItem.ItemCategory.valueOf((String) item[3]));
            inv.setSide(InventoryItem.ItemSide.LEFT);
            inv.setDisplayOrder(order++);
            inv.setActive(true);
            inventoryItemRepository.save(inv);
        }

        // RIGHT SIDE ITEMS
        Object[][] rightItems = {
                { "ચા. થર્મોસ", "Tea Thermos", 500.00, "KITCHEN" },
                { "સ્ટીલ પવાલી 25 થી 70 લીટર", "Steel Pavali 25-70 Liter", 200.00, "KITCHEN" },
                { "સ્ટીલ પવાલી 125 લીટર", "Steel Pavali 125 Liter", 400.00, "KITCHEN" },
                { "એલ્યુ. પવાલી", "Aluminium Pavali", 600.00, "KITCHEN" },
                { "ચમચા / ડોયા / ભાતીયા", "Spoon/Doya/Bhatiya", 15.00, "UTENSILS" },
                { "થાળી / ડિશ", "Thali/Dish", 8.00, "UTENSILS" },
                { "વાટકી", "Vatki (Bowl)", 4.00, "UTENSILS" },
                { "ગ્લાસ", "Glass", 5.00, "UTENSILS" },
                { "ચમચી", "Spoon", 3.00, "UTENSILS" },
                { "એલ્યુ. ત્રાસ નાના", "Aluminium Tras Small", 125.00, "KITCHEN" },
                { "એલ્યુ. ત્રાસ મીડીયમ", "Aluminium Tras Medium", 200.00, "KITCHEN" },
                { "એલ્યુ. ત્રાસ મોટા", "Aluminium Tras Large", 250.00, "KITCHEN" },
                { "એલ્યુ. છીબા", "Aluminium Chhiba", 150.00, "KITCHEN" },
                { "સિંગલ પાટલા", "Single Patla", 40.00, "FURNITURE" },
                { "પાટલી - વેલણ", "Patli - Velan", 50.00, "KITCHEN" },
                { "રોટલી તવા", "Roti Tava", 200.00, "KITCHEN" },
                { "ચોકી નાની", "Small Choki", 100.00, "FURNITURE" },
                { "ચોકી મોટી", "Large Choki", 200.00, "FURNITURE" },
                { "બાજોઠ", "Bajoth", 40.00, "FURNITURE" },
                { "બાજોઠ રુમાલ", "Bajoth Rumal", 20.00, "DECORATION" },
                { "લાંબી ગાદી", "Long Mattress", 45.00, "BEDDING" },
                { "ગોળ તકીયા", "Round Cushion", 30.00, "BEDDING" },
                { "વોશ બેસીન", "Wash Basin", 600.00, "MISCELLANEOUS" },
                { "ફો. પલંગ", "Folding Bed", 190.00, "FURNITURE" },
                { "એક્સ્ટ્રા થાંભલા / વળી", "Extra Poles", 110.00, "MANDAP" },
                { "કાર્પેટ ફ્લોરિંગ (Sq.ft.)", "Carpet Flooring (Sq.ft.)", 3.00, "DECORATION" },
                { "વાહન ભાડું (એક ફેરાના)", "Vehicle Rent (One Way)", 500.00, "MISCELLANEOUS" }
        };

        order = 1;
        for (Object[] item : rightItems) {
            InventoryItem inv = new InventoryItem();
            inv.setNameGujarati((String) item[0]);
            inv.setNameEnglish((String) item[1]);
            inv.setDefaultRate(BigDecimal.valueOf((Double) item[2]));
            inv.setCategory(InventoryItem.ItemCategory.valueOf((String) item[3]));
            inv.setSide(InventoryItem.ItemSide.RIGHT);
            inv.setDisplayOrder(order++);
            inv.setActive(true);
            inventoryItemRepository.save(inv);
        }
    }
}
