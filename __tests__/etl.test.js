const { execSync } = require('child_process');
const { Client } = require('pg');

describe('Financial ETL Pipeline Integration Tests', () => {
    let client;

    beforeAll(async () => {
        client = new Client({ connectionString: 'postgresql://user:pass@localhost:5432/finance_db' });
        await client.connect();
        await client.query('TRUNCATE fact_spending, dim_merchants CASCADE');
    });

    afterAll(async () => await client.end());

    test('Pandas pipeline accurately identifies and loads impulse flags', async () => {
        // 1. Run the Python Pandas script
        execSync('python process_spending.py');

        // 2. Validate Data Integrity: Did it drop invalid transactions?
        const totalRes = await client.query('SELECT COUNT(*) FROM fact_spending');
        expect(parseInt(totalRes.rows[0].count)).toBeGreaterThan(0);

        // 3. Validate Business Logic: Did Pandas correctly flag late-night Amazon purchases as impulse?
        const impulseRes = await client.query(`
            SELECT is_impulse 
            FROM fact_spending f
            JOIN dim_merchants m ON f.merchant_id = m.merchant_id
            WHERE m.merchant_name = 'Amazon' AND EXTRACT(HOUR FROM f.transaction_date) = 2
        `);
        
        expect(impulseRes.rows[0].is_impulse).toBe(true);
    });
});