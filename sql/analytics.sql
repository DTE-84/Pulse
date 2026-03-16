SELECT 
    t.trigger_name,
    COUNT(f.transaction_id) as total_impulse_purchases,
    SUM(f.amount) as total_money_spent,
    AVG(f.amount) as average_impulse_cost
FROM fact_spending f
JOIN dim_triggers t ON f.trigger_id = t.trigger_id
WHERE f.is_impulse = TRUE AND f.user_id = 101
GROUP BY t.trigger_name
ORDER BY total_money_spent DESC;


SELECT 
    EXTRACT(HOUR FROM transaction_date) as hour_of_day,
    COUNT(*) as impulse_frequency,
    SUM(amount) as money_wasted
FROM fact_spending
WHERE is_impulse = TRUE
GROUP BY hour_of_day
ORDER BY impulse_frequency DESC
LIMIT 3;