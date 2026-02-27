-- =============================================
-- Mandap Billing System - Customer Audit Tables
-- Flyway Migration V6
-- =============================================

-- Revision Info Table
CREATE TABLE revinfo (
    id INT NOT NULL AUTO_INCREMENT,
    timestamp BIGINT NOT NULL,
    username VARCHAR(255),
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Customer Audit Table
CREATE TABLE customers_aud (
    id BIGINT NOT NULL,
    rev INT NOT NULL,
    revtype TINYINT,
    name VARCHAR(200),
    mobile VARCHAR(15),
    alternate_contact VARCHAR(15),
    address VARCHAR(500),
    notes TEXT,
    active BIT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id, rev),
    CONSTRAINT FK_customers_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (id)
) ENGINE=InnoDB;

-- Customer Pal Numbers Audit Table
CREATE TABLE customer_pal_numbers_aud (
    customer_id BIGINT NOT NULL,
    pal_number VARCHAR(255) NOT NULL,
    rev INT NOT NULL,
    revtype TINYINT,
    PRIMARY KEY (customer_id, pal_number, rev),
    CONSTRAINT FK_customer_pal_numbers_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (id)
) ENGINE=InnoDB;
