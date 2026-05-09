-- Unified High-Fidelity Schema for Pulse-Ai
-- Handles Finance, Auth (Supabase Auth Linked), and Messaging

BEGIN;

-- 1. Dimension: Users (Core Identity)
-- Note: Links to Supabase auth.users via uuid
CREATE TABLE IF NOT EXISTS public.dim_users (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    baseline_spend DECIMAL(10, 2) DEFAULT 2500.00,
    monthly_income DECIMAL(10, 2) DEFAULT 5200.00,
    initial_balance DECIMAL(10, 2) DEFAULT 15000.00,
    nova_tone VARCHAR(50) DEFAULT 'Balanced',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Dimension: Categories (Behavioral Taxonomy)
CREATE TABLE IF NOT EXISTS public.dim_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    risk_level VARCHAR(20) DEFAULT 'Medium' -- Low, Medium, High, Critical
);

-- 3. Dimension: Triggers (Emotional Catalysts)
CREATE TABLE IF NOT EXISTS public.dim_triggers (
    trigger_id SERIAL PRIMARY KEY,
    trigger_name VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'Stress', 'Boredom', 'Social'
    risk_level VARCHAR(20) DEFAULT 'Medium'
);

-- 4. Fact: Transactions (Financial Telemetry)
CREATE TABLE IF NOT EXISTS public.fact_transactions (
    transaction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.dim_users(user_id) ON DELETE CASCADE,
    category_id INT REFERENCES public.dim_categories(category_id),
    trigger_id INT REFERENCES public.dim_triggers(trigger_id),
    amount DECIMAL(10, 2) NOT NULL,
    purchase_date TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'Completed' -- Completed, Pending, Flagged
);

-- 5. Dimension: Threads (Conversation Nexus)
CREATE TABLE IF NOT EXISTS public.threads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    created_by uuid REFERENCES public.dim_users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Fact: Messages (AI Interaction Logs)
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id uuid REFERENCES public.threads(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.dim_users(user_id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- user, assistant, system
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Dimension: Goals (Target Nodes)
CREATE TABLE IF NOT EXISTS public.dim_goals (
    goal_id SERIAL PRIMARY KEY,
    user_id uuid REFERENCES public.dim_users(user_id) ON DELETE CASCADE,
    goal_name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL,
    current_progress DECIMAL(12, 2) DEFAULT 0,
    deadline DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance & Integrity Indexes
CREATE INDEX IF NOT EXISTS idx_fact_transactions_user_id ON public.fact_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fact_transactions_date ON public.fact_transactions(purchase_date);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_dim_goals_user_id ON public.dim_goals(user_id);

-- Insert Default Values for Signal Clarity
INSERT INTO public.dim_categories (category_name, risk_level) VALUES
('Housing', 'Low'), ('Transport', 'Medium'), ('Food & Drink', 'Medium'), 
('Shopping', 'High'), ('Leisure', 'High'), ('Health', 'Low'),
('Education', 'Low'), ('Finance', 'Medium')
ON CONFLICT DO NOTHING;

INSERT INTO public.dim_triggers (trigger_name, risk_level) VALUES 
('Stress', 'High'),
('Boredom', 'Medium'),
('Social Pressure', 'Medium'),
('Celebration', 'Low'),
('Late Night', 'High')
ON CONFLICT DO NOTHING;

COMMIT;
