#!/bin/bash
# Simple AgriDistriConnect Database Setup for Fedora (No temp files)

echo "🌾 AgriDistriConnect Database Setup"
echo "==================================="

# Check if database.sql exists
if [ ! -f "database.sql" ]; then
    echo "❌ database.sql file not found in current directory"
    echo "Current directory: $(pwd)"
    exit 1
fi

echo "✅ Found database.sql schema file"

# Get database credentials
echo "📋 Database Configuration:"
read -p "Enter database name (default: agridistri): " DB_NAME
DB_NAME=${DB_NAME:-agridistri}

read -p "Enter application user name (default: agridistri_user): " APP_USER
APP_USER=${APP_USER:-agridistri_user}

echo "Enter application user password:"
read -s APP_PASSWORD
echo

# Start PostgreSQL service
echo "🚀 Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user using here-doc to avoid temp files
echo "🔧 Creating database and user..."
sudo -u postgres psql << EOSQL
-- Drop and recreate database
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME;

-- Drop and recreate user
DROP USER IF EXISTS $APP_USER;
CREATE USER $APP_USER WITH PASSWORD '$APP_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $APP_USER;
GRANT CREATEDB TO $APP_USER;

-- Connect to database and set up extensions
\\c $DB_NAME;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO $APP_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $APP_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $APP_USER;

-- Quit
\\q
EOSQL

if [ $? -eq 0 ]; then
    echo "✅ Database and user created successfully"
else
    echo "❌ Failed to create database and user"
    exit 1
fi

# Import schema
echo "📋 Importing schema..."
export PGPASSWORD=$APP_PASSWORD
psql -U $APP_USER -h localhost -d $DB_NAME -f database.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema imported successfully"
else
    echo "❌ Schema import failed"
    echo "Let's check what went wrong..."
    psql -U $APP_USER -h localhost -d $DB_NAME -c "\\dt"
    exit 1
fi

# Verify setup
echo "🔍 Verifying setup..."
TABLE_COUNT=$(psql -U $APP_USER -h localhost -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | tr -d ' ')

echo "Found $TABLE_COUNT tables"

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✅ Database setup complete!"
    
    # Show tables
    echo ""
    echo "📋 Created tables:"
    psql -U $APP_USER -h localhost -d $DB_NAME -c "\\dt"
    
    # Show sample data
    echo ""
    echo "📊 Sample data:"
    psql -U $APP_USER -h localhost -d $DB_NAME -c "SELECT COUNT(*) as roles_count FROM roles;"
    psql -U $APP_USER -h localhost -d $DB_NAME -c "SELECT COUNT(*) as orgs_count FROM organizations;"
    psql -U $APP_USER -h localhost -d $DB_NAME -c "SELECT COUNT(*) as inputs_count FROM agricultural_inputs;"
else
    echo "⚠️ No tables found"
    exit 1
fi

# Create .env file
echo ""
echo "📝 Creating .env file..."
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$APP_USER
DB_PASSWORD=$APP_PASSWORD
JWT_SECRET=$(openssl rand -base64 32)
PORT=3000
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
EOF

echo "✅ .env file created"

# Create simple test
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

async function test() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT COUNT(*) FROM roles');
        console.log('✅ Connection successful! Roles:', result.rows[0].count);
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    }
}

test();
EOF

echo "✅ Test script created"

# Cleanup
unset PGPASSWORD

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Summary:"
echo "  Database: $DB_NAME"
echo "  User: $APP_USER"
echo "  Tables: $TABLE_COUNT"
echo ""
echo "🚀 Next steps:"
echo "  1. npm install pg dotenv"
echo "  2. node test_connection.js"
echo ""
echo "💡 Connect manually: psql -U $APP_USER -h localhost -d $DB_NAME"
