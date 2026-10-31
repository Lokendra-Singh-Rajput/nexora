-- NEXORA AI ANALYST INTELLIGENCE PLATFORM SCHEMA
-- Target Database: MySQL 8 (H2 compatible)

CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ANALYST',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS datasets (
    id VARCHAR(64) PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    row_count INT DEFAULT 0,
    validation_status VARCHAR(50) DEFAULT 'PENDING',
    quality_score DECIMAL(5, 2) DEFAULT 0.00,
    version INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_datasets_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    dataset_id VARCHAR(64) NOT NULL,
    order_id VARCHAR(64) NOT NULL,
    order_date DATE NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    product_id VARCHAR(64) NOT NULL,
    region VARCHAR(64),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(5, 4) NOT NULL DEFAULT 0.0000,
    sales DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    profit DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    order_status VARCHAR(50) DEFAULT 'Completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_dataset FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

CREATE INDEX idx_orders_company_date ON orders(company_id, order_date);
CREATE INDEX idx_orders_region ON orders(company_id, region);
CREATE INDEX idx_orders_product ON orders(company_id, product_id);

CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    dataset_id VARCHAR(64) NOT NULL,
    product_id VARCHAR(64) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    sub_category VARCHAR(100),
    unit_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX idx_products_company_id ON products(company_id, product_id);

CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    dataset_id VARCHAR(64) NOT NULL,
    customer_id VARCHAR(64) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    segment VARCHAR(64),
    region VARCHAR(64),
    acquisition_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customers_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    dataset_id VARCHAR(64) NOT NULL,
    product_id VARCHAR(64) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    reorder_level INT NOT NULL DEFAULT 20,
    supplier_lead_time INT NOT NULL DEFAULT 14,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    dataset_id VARCHAR(64) NOT NULL,
    campaign_id VARCHAR(64) NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    marketing_spend DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    campaign_revenue DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    campaign_date DATE,
    channel VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_marketing_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    company_id VARCHAR(64) NOT NULL,
    dataset_id VARCHAR(64) NOT NULL,
    metric_type VARCHAR(64) NOT NULL,
    snapshot_json LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
