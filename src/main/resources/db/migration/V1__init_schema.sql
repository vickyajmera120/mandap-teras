-- =============================================
-- Mandap Billing System - Initial Schema
-- Flyway Migration V1
-- =============================================

-- Customers
CREATE TABLE customers (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    alternate_contact VARCHAR(15),
    address VARCHAR(500),
    notes TEXT,
    active BIT NOT NULL,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE customer_pal_numbers (
    customer_id BIGINT NOT NULL,
    pal_number VARCHAR(255),
    CONSTRAINT UKg5ecux9bb007l1wci902umfig UNIQUE (pal_number)
) ENGINE=InnoDB;

-- Inventory
CREATE TABLE inventory_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name_gujarati VARCHAR(200) NOT NULL,
    name_english VARCHAR(200),
    default_rate DECIMAL(10,2) NOT NULL,
    category ENUM('MANDAP','FURNITURE','BEDDING','KITCHEN','UTENSILS','DECORATION','MISCELLANEOUS'),
    side ENUM('LEFT','RIGHT'),
    display_order INT,
    total_stock INT NOT NULL DEFAULT 0,
    available_stock INT NOT NULL DEFAULT 0,
    active BIT NOT NULL,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Bills
CREATE TABLE bills (
    id BIGINT NOT NULL AUTO_INCREMENT,
    bill_number VARCHAR(20) NOT NULL,
    bill_date DATE NOT NULL,
    customer_id BIGINT NOT NULL,
    total_amount DECIMAL(12,2),
    deposit DECIMAL(12,2),
    settlement_discount DECIMAL(12,2),
    net_payable DECIMAL(12,2),
    pal_numbers VARCHAR(50),
    remarks VARCHAR(500),
    bill_type ENUM('ESTIMATE','INVOICE'),
    payment_status ENUM('DUE','PAID','PARTIAL'),
    created_by BIGINT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT UK_7959pofuil5cipraog67b4j29 UNIQUE (bill_number)
) ENGINE=InnoDB;

CREATE TABLE bill_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    bill_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    rate DECIMAL(10,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    is_lost_item BIT,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Payments
CREATE TABLE payments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    bill_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('CASH','CHEQUE','ONLINE'),
    cheque_number VARCHAR(50),
    remarks VARCHAR(500),
    is_deposit BIT,
    created_by BIGINT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Rental Orders
CREATE TABLE rental_orders (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_number VARCHAR(20) NOT NULL,
    order_date DATE NOT NULL,
    customer_id BIGINT NOT NULL,
    dispatch_date DATE,
    expected_return_date DATE,
    actual_return_date DATE,
    status ENUM('BOOKED','DISPATCHED','PARTIALLY_RETURNED','RETURNED','COMPLETED','CANCELLED') NOT NULL,
    bill_id BIGINT,
    remarks VARCHAR(500),
    created_by BIGINT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT UK_k970k5j6xk49s2ha8g0k77ixm UNIQUE (order_number)
) ENGINE=InnoDB;

CREATE TABLE rental_order_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    rental_order_id BIGINT NOT NULL,
    inventory_item_id BIGINT NOT NULL,
    booked_qty INT NOT NULL,
    dispatched_qty INT,
    returned_qty INT,
    dispatch_date DATE,
    return_date DATE,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE rental_order_transactions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    rental_order_id BIGINT NOT NULL,
    type ENUM('DISPATCH','RETURN') NOT NULL,
    transaction_date DATE NOT NULL,
    vehicle_number VARCHAR(50),
    voucher_number VARCHAR(50),
    created_at DATETIME(6),
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE rental_order_transaction_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    transaction_id BIGINT NOT NULL,
    inventory_item_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Auth: Permissions, Roles, Users
CREATE TABLE permissions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT UK_pnvtwliis6p05pn6i3ndjrqt2 UNIQUE (name)
) ENGINE=InnoDB;

CREATE TABLE roles (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    PRIMARY KEY (id),
    CONSTRAINT UK_ofx66keruapi6vyqpv6f2or37 UNIQUE (name)
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (permission_id, role_id)
) ENGINE=InnoDB;

CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    active BIT NOT NULL,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    PRIMARY KEY (id),
    CONSTRAINT UK_r43af9ap4edm43mmtq01oddj6 UNIQUE (username)
) ENGINE=InnoDB;

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, user_id)
) ENGINE=InnoDB;

-- =============================================
-- Foreign Keys
-- =============================================

ALTER TABLE customer_pal_numbers ADD CONSTRAINT FKtnhomg2pykai2xy11pd3ui3oq FOREIGN KEY (customer_id) REFERENCES customers (id);

ALTER TABLE bills ADD CONSTRAINT FKoy9sc2dmxj2qwjeiiilf3yuxp FOREIGN KEY (customer_id) REFERENCES customers (id);
ALTER TABLE bill_items ADD CONSTRAINT FKj9o7g8krc56gf6t6f0sy4ic5p FOREIGN KEY (bill_id) REFERENCES bills (id);
ALTER TABLE bill_items ADD CONSTRAINT FKe4hiaffl1873j03xqckb1k8rl FOREIGN KEY (item_id) REFERENCES inventory_items (id);

ALTER TABLE payments ADD CONSTRAINT FK9565r6579khpdjxnyla0l2ycd FOREIGN KEY (bill_id) REFERENCES bills (id);

ALTER TABLE rental_orders ADD CONSTRAINT FK41hffrl9ydlm3m2jcda4duqqu FOREIGN KEY (customer_id) REFERENCES customers (id);
ALTER TABLE rental_orders ADD CONSTRAINT FK7jl7gko8b5ygsqt46vy7ghvna FOREIGN KEY (bill_id) REFERENCES bills (id);
ALTER TABLE rental_order_items ADD CONSTRAINT FK3gx6gi3pmb4nctfw1alnqxi4a FOREIGN KEY (rental_order_id) REFERENCES rental_orders (id);
ALTER TABLE rental_order_items ADD CONSTRAINT FK7e4t3hwmikgvem34dvd9gl2pe FOREIGN KEY (inventory_item_id) REFERENCES inventory_items (id);
ALTER TABLE rental_order_transactions ADD CONSTRAINT FK1e7jbq2wpj4k230gl8boq8y7r FOREIGN KEY (rental_order_id) REFERENCES rental_orders (id);
ALTER TABLE rental_order_transaction_items ADD CONSTRAINT FKliievg1bqqab66m5ynhcampr5 FOREIGN KEY (transaction_id) REFERENCES rental_order_transactions (id);
ALTER TABLE rental_order_transaction_items ADD CONSTRAINT FKrygrhems5kqd8us0p723rydp1 FOREIGN KEY (inventory_item_id) REFERENCES inventory_items (id);

ALTER TABLE role_permissions ADD CONSTRAINT FKn5fotdgk8d1xvo8nav9uv3muc FOREIGN KEY (role_id) REFERENCES roles (id);
ALTER TABLE role_permissions ADD CONSTRAINT FKegdk29eiy7mdtefy5c7eirr6e FOREIGN KEY (permission_id) REFERENCES permissions (id);
ALTER TABLE user_roles ADD CONSTRAINT FKhfh9dx7w3ubf1co1vdev94g3f FOREIGN KEY (user_id) REFERENCES users (id);
ALTER TABLE user_roles ADD CONSTRAINT FKh8ciramu9cc9q3qcqiv4ue8a6 FOREIGN KEY (role_id) REFERENCES roles (id);
