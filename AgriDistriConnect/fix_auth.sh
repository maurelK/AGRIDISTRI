#!/bin/bash
# Fix PostgreSQL authentication and complete database setup

echo "🔧 Fixing PostgreSQL authentication..."

# Backup original pg_hba.conf
sudo cp /var/lib/pgsql/data/pg_hba.conf /var/lib/pgsql/data/pg_hba.conf.backup

# Create new pg_hba.conf with password authentication
sudo tee /var/lib/pgsql/data/pg_hba.conf > /dev/null << 'EOF'
# PostgreSQL Client Authentication Configuration File
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     md5
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
# IPv6 local connections:
host    all             all             ::1/128                 md5
# Allow replication connections from localhost, by a user with the
# replication privilege.
local   replication     all                                     peer
host    replication     all             127.0.0.1/32            ident
host    replication     all             ::1/128                 ident
EOF

echo "✅ Updated pg_hba.conf for password authentication"

# Restart PostgreSQL to apply changes
echo "🔄 Restarting PostgreSQL..."
sudo systemctl restart postgresql

# Wait a moment for service to start
sleep 3

# Check if service is running
if ! systemctl is-active --quiet postgresql; then
    echo "❌ PostgreSQL failed to restart"
    echo "Restoring backup..."
    sudo cp /var/lib/pgsql/data/pg_hba.conf.backup /var/lib/pgsql/data/pg_hba.conf
    sudo systemctl restart postgresql
    exit 1
fi

echo "✅ PostgreSQL restarted successfully"

# Get database credentials
read -p "Enter database name (should be 'agridistri' if you used the previous script): " DB_NAME
DB_NAME=${DB_NAME:-agridistri}

read -p "Enter application user name (should be 'agridistri_user'): " APP_USER
APP_USER=${APP_USER:-agridistri_user}

echo "Enter application user password:"
read -s APP_PASSWORD
echo

# Test connection
echo "🔍 Testing connection..."
export PGPASSWORD=$APP_PASSWORD

if psql -U $APP_USER -h localhost -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Connection successful!"
else
    echo "❌ Connection still failing. Let's recreate the user with correct permissions..."
    
    # Recreate user with proper permissions
    sudo -u postgres psql << EOSQL
DROP USER IF EXISTS $APP_USER;
CREATE USER $APP_USER WITH PASSWORD '$APP_PASSWORD' LOGIN CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $APP_USER;

-- Connect to database and grant schema permissions
\c $DB_NAME;
GRANT ALL ON SCHEMA public TO $APP_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $APP_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $APP_USER;

-- Grant all existing tables and sequences
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $APP_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $APP_USER;
\q
EOSQL

    echo "✅ User recreated with proper permissions"
fi

# Import schema if database.sql exists
if [ -f "database.sql" ]; then
    echo "📋 Importing schema..."
    
    # First check if tables already exist
    TABLE_COUNT=$(psql -U $APP_USER -h localhost -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tr -d ' ' || echo "0")
    
    if [ "$TABLE_COUNT" -gt 0 ]; then
        echo "⚠️ Tables already exist ($TABLE_COUNT found). Do you want to recreate them?"
        read -p "This will delete all existing data. Continue? (y/N): " confirm
        if [[ $confirm == [yY] ]]; then
            echo "🗑️ Dropping existing tables..."
            psql -U $APP_USER -h localhost -d $DB_NAME -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
            # Re-grant permissions on new schema
            sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $APP_USER;"
        else
            echo "Skipping schema import."
            TABLE_COUNT_FINAL=$TABLE_COUNT
        fi
    fi
    
    if [ "$TABLE_COUNT" -eq 0 ] || [[ $confirm == [yY] ]]; then
        psql -U $APP_USER -h localhost -d $DB_NAME -f database.sql
        
        if [ $? -eq 0 ]; then
            echo "✅ Schema imported successfully"
            TABLE_COUNT_FINAL=$(psql -U $APP_USER -h localhost -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | tr -d ' ')
        else
            echo "❌ Schema import failed"
            exit 1
        fi
    fi
else
    echo "⚠️ database.sql not found, skipping schema import"
    TABLE_COUNT_FINAL=0
fi

# Verify setup
echo ""
echo "🔍 Verifying database setup..."
echo "Tables found: $TABLE_COUNT_FINAL"

if [ "$TABLE_COUNT_FINAL" -gt 0 ]; then
    echo ""
    echo "�� Database tables:"
    psql -U $APP_USER -h localhost -d $DB_NAME -c "\dt"
    
    echo ""
    echo "📊 Sample data counts:"
    psql -U $APP_USER -h localhost -d $DB_NAME -c "
        SELECT 
            (SELECT COUNT(*) FROM roles) as roles,
            (SELECT COUNT(*) FROM organizations) as organizations,
            (SELECT COUNT(*) FROM agricultural_inputs) as inputs;
    " 2>/dev/null || echo "Some tables might not exist yet"
fi

# Create/update .env file
echo ""
echo "📝 Creating .env file..."
cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$APP_USER
DB_PASSWORD=$APP_PASSWORD

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)

# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
EOF

echo "✅ .env file created"

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    echo "📦 Creating package.json..."
    cat > package.json << 'EOF'
{
  "name": "agridistri-connect",
  "version": "1.0.0",
  "description": "Agricultural Input Distribution Management System",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "node test_connection.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "helmet": "^7.0.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^6.10.0",
    "multer": "^1.4.5-lts.1",
    "qrcode": "^1.5.3",
    "dotenv": "^16.3.1"
  }
}
EOF
    echo "✅ package.json created"
fi

# Create test script
echo "📝 Creating test script..."
cat > test_connection.js << 'EOF'
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
EOF

echo "✅ Test script created"

# Cleanup
unset PGPASSWORD

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Summary:"
echo "  Database: $DB_NAME"
echo "  User: $APP_USER"
echo "  Tables: $TABLE_COUNT_FINAL"
echo ""
echo "🚀 Next steps:"
echo "  1. Install dependencies: npm install"
echo "  2. Test connection: npm test"
echo "  3. Start building your API!"
echo ""
echo "💡 Manual connection: psql -U $APP_USER -h localhost -d $DB_NAME"
echo ""
echo "📁 Files created:"
echo "  - .env (database configuration)"
echo "  - package.json (project dependencies)"
echo "  - test_connection.js (connection test)"
