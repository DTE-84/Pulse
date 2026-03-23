-- Pulse-Ai: High-Fidelity Star Schema
-- Primary Fact: Transactions
-- Dimensions: Users, Categories, Merchants, Threads, Messages

BEGIN;

-- 1. Dimension: Users (Core Identity)
CREATE TABLE IF NOT EXISTS "dim_users" (
    user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    baseline_spend DECIMAL(10, 2) DEFAULT 2500.00,
    monthly_income DECIMAL(10, 2) DEFAULT 5200.00,
    initial_balance DECIMAL(10, 2) DEFAULT 15000.00,
    nova_tone VARCHAR(50) DEFAULT 'Balanced',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Dimension: Categories (Behavioral Taxonomy)
CREATE TABLE IF NOT EXISTS "dim_categories" (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    risk_level VARCHAR(20) DEFAULT 'Medium' -- Low, Medium, High, Critical
);

-- 3. Fact: Transactions (Financial Telemetry)
CREATE TABLE IF NOT EXISTS "fact_transactions" (
    transaction_id SERIAL PRIMARY KEY,
    user_id uuid REFERENCES "dim_users"(user_id) ON DELETE CASCADE,
    category_id INT REFERENCES "dim_categories"(category_id),
    amount DECIMAL(10, 2) NOT NULL,
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'Completed' -- Completed, Pending, Flagged
);

-- 4. Dimension: Threads (Conversation Nexus)
CREATE TABLE IF NOT EXISTS "threads" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    created_by uuid REFERENCES "dim_users"(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Fact: Messages (AI Interaction Logs)
CREATE TABLE IF NOT EXISTS "messages" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id uuid REFERENCES "threads"(id) ON DELETE CASCADE,
    user_id uuid REFERENCES "dim_users"(user_id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- user, system, assistant
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance & Integrity Indexes
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON "messages"(thread_id);
CREATE INDEX IF NOT EXISTS idx_fact_transactions_user_id ON "fact_transactions"(user_id);
CREATE INDEX IF NOT EXISTS idx_fact_transactions_date ON "fact_transactions"(purchase_date);

-- Analytical Views
CREATE OR REPLACE VIEW view_user_segmentation AS
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

COMMIT;
