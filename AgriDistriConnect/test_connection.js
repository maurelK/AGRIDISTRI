const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function testConnection() {
    try {
        console.log('🔍 Testing database connection...');
        console.log(`Database: ${process.env.DB_NAME}`);
        console.log(`User: ${process.env.DB_USER}`);
        
        const client = await pool.connect();
        
        // Test connection
        const version = await client.query('SELECT version()');
        console.log('✅ Connection successful!');
        console.log('📊 PostgreSQL version:', version.rows[0].version.split(' ')[0] + ' ' + version.rows[0].version.split(' ')[1]);
        
        // Count tables
        const tables = await client.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
        console.log('📋 Tables found:', tables.rows[0].count);
        
        // Test each main table
        const testTables = ['roles', 'organizations', 'agricultural_inputs', 'users', 'beneficiaries'];
        console.log('\n📊 Table data:');
        
        for (const table of testTables) {
            try {
                const count = await client.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`  ${table}: ${count.rows[0].count} records`);
            } catch (err) {
                console.log(`  ${table}: table not found or empty`);
            }
        }
        
        client.release();
        await pool.end();
        console.log('\n🎉 All tests passed!');
        
    } catch (err) {
        console.error('❌ Test failed:', err.message);
        process.exit(1);
    }
}

testConnection();
