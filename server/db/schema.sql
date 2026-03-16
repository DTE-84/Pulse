-- Pulse-Ai: High-Fidelity Star Schema
-- Primary Fact: Transactions
-- Dimensions: Users, Categories, Merchants

CREATE TABLE dim_users (
    user_id SERIAL PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    baseline_spend DECIMAL(10, 2) DEFAULT 2500.00,
    nova_tone VARCHAR(50) DEFAULT 'Balanced'
);

CREATE TABLE dim_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    risk_level VARCHAR(20) DEFAULT 'Medium' -- Low, Medium, High, Critical
);

CREATE TABLE fact_transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES dim_users(user_id),
    category_id INT REFERENCES dim_categories(category_id),
    amount DECIMAL(10, 2) NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Completed' -- Completed, Pending, Flagged
);

-- SUPER POWER 1: Strategic vs. Impulsive (VIP vs. Standard)
-- This logic segments users based on their deviation from baseline + total volume.
CREATE VIEW view_user_segmentation AS
SELECT 
    u.user_name,
    COUNT(f.transaction_id) as total_purchases,
    SUM(f.amount) as lifetime_spend,
    CASE 
        WHEN SUM(f.amount) > (u.baseline_spend * 5) THEN 'High-Velocity Spender'
        WHEN SUM(f.amount) < u.baseline_spend THEN 'Strategic Saver'
        ELSE 'Balanced Rhythm'
    END AS behavioral_segment
FROM fact_transactions f
JOIN dim_users u ON f.user_id = u.user_id
GROUP BY u.user_id, u.user_name, u.baseline_spend;

-- SUPER POWER 2: Behavioral Drift (Churn/Latency)
-- Detects when a user's spending "rhythm" has stalled or shifted significantly.
CREATE VIEW view_behavioral_drift AS
WITH LastPurchase AS (
    SELECT 
        user_id, 
        MAX(purchase_date) as last_order_date
    FROM fact_transactions
    GROUP BY user_id
)
SELECT 
    u.user_name,
    lp.last_order_date,
    CURRENT_DATE - lp.last_order_date::DATE AS days_since_last_pulse,
    CASE
        WHEN CURRENT_DATE - lp.last_order_date::DATE > 30 THEN 'Pulse Stalled (Churned)'
        WHEN CURRENT_DATE - lp.last_order_date::DATE > 7 THEN 'Rhythm Drifting (At Risk)'
        ELSE 'Pulse Active'
    END as behavioral_status
FROM LastPurchase lp
JOIN dim_users u ON lp.user_id = u.user_id;
