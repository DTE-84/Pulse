-- Dimension: Triggers/Moods (The core of your app)
CREATE TABLE dim_triggers (
    trigger_id INT PRIMARY KEY,
    trigger_name VARCHAR(50), -- e.g., 'Stress', 'Celebration', 'Boredom', 'Late Night'
    risk_level VARCHAR(20)
);

-- Dimension: Merchants
CREATE TABLE dim_merchants (
    merchant_id VARCHAR(50) PRIMARY KEY,
    merchant_name VARCHAR(100),
    category VARCHAR(50)
);

-- Fact: Spending Transactions
CREATE TABLE fact_spending (
    transaction_id INT PRIMARY KEY,
    user_id INT, -- Links to your existing users table
    merchant_id VARCHAR(50) REFERENCES dim_merchants(merchant_id),
    trigger_id INT REFERENCES dim_triggers(trigger_id),
    transaction_date TIMESTAMP,
    amount DECIMAL(10, 2),
    is_impulse BOOLEAN
);