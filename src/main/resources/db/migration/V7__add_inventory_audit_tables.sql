-- =============================================
-- Mandap Billing System - Inventory Audit Tables
-- Flyway Migration V7
-- =============================================

-- Inventory Audit Table
CREATE TABLE inventory_items_aud (
    id BIGINT NOT NULL,
    rev INT NOT NULL,
    revtype TINYINT,
    name_gujarati VARCHAR(200),
    name_english VARCHAR(200),
    default_rate DECIMAL(10,2),
    category VARCHAR(20),
    display_order INT,
    total_stock INT,
    available_stock INT,
    active BIT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id, rev),
    CONSTRAINT FK_inventory_items_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (id)
) ENGINE=InnoDB;
