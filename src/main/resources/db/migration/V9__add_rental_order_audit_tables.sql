-- =============================================
-- Mandap Billing System - Rental Order Audit Tables
-- Flyway Migration V9
-- =============================================

-- Rental Order Audit Table
CREATE TABLE rental_orders_aud (
    id BIGINT NOT NULL,
    rev INT NOT NULL,
    revtype TINYINT,
    order_number VARCHAR(20),
    customer_id BIGINT,
    order_date DATE,
    dispatch_date DATE,
    expected_return_date DATE,
    actual_return_date DATE,
    status ENUM('BOOKED','DISPATCHED','PARTIALLY_RETURNED','RETURNED','COMPLETED','CANCELLED'),
    bill_id BIGINT,
    bill_out_of_sync BIT,
    remarks VARCHAR(500),
    created_by BIGINT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id, rev),
    CONSTRAINT FK_rental_orders_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (id)
) ENGINE=InnoDB;

-- Rental Order Items Audit Table
CREATE TABLE rental_order_items_aud (
    id BIGINT NOT NULL,
    rev INT NOT NULL,
    revtype TINYINT,
    rental_order_id BIGINT,
    inventory_item_id BIGINT,
    booked_qty INT,
    dispatched_qty INT,
    returned_qty INT,
    dispatch_date DATE,
    return_date DATE,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id, rev),
    CONSTRAINT FK_rental_order_items_aud_revinfo FOREIGN KEY (rev) REFERENCES revinfo (id)
) ENGINE=InnoDB;
