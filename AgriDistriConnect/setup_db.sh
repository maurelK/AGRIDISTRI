#!/bin/bash
# AgriDistriConnect Database Setup for Existing PostgreSQL on Fedora (Fixed)

set -e  # Exit on any error

echo "🌾 AgriDistriConnect Database Setup (Existing PostgreSQL)"
echo "========================================================"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL command line tools not found"
    echo "Installing PostgreSQL client tools..."
    sudo dnf install -y postgresql
fi

# Check if PostGIS is available
echo "📍 Checking PostGIS availability..."
sudo dnf install -y postgis

# Start PostgreSQL service if not running
echo "🚀 Ensuring PostgreSQL service is running..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check if service is running
if ! systemctl is-active --quiet postgresql; then
    echo "❌ PostgreSQL service failed to start"
    echo "Let's check the status:"
    sudo systemctl status postgresql
    exit 1
fi

echo "✅ PostgreSQL service is running"

# Check if we can connect as postgres user
echo "🔍 Testing PostgreSQL connection..."
if ! sudo -u postgres psql -c "SELECT version();" &> /dev/null; then
    echo "❌ Cannot connect to PostgreSQL as postgres user"
    echo "This might be a configuration issue. Let's check:"
    sudo systemctl status postgresql
    exit 1
fi

echo "✅ PostgreSQL connection successful"

# Get database credentials with validation
echo ""
echo "📋 Database Configuration:"
echo "Note: Database names should be lowercase and contain only letters, numbers, and underscores"
echo ""

while true; do
    read -p "Enter database name (default: agridistri): " DB_NAME
    DB_NAME=${DB_NAME:-agridistri}
    # Convert to lowercase and replace invalid characters
    DB_NAME=$(echo "$DB_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_]/_/g')
    echo "Database name will be: $DB_NAME"
    read -p "Is this correct? (y/n): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        break
    fi
done

while true; do
    read -p "Enter application user name (default: agridistri_user): " APP_USER
    APP_USER=${APP_USER:-agridistri_user}
    # Convert to lowercase and replace invalid characters
    APP_USER=$(echo "$APP_USER" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_]/_/g')
    echo "User name will be: $APP_USER"
    read -p "Is this correct? (y/n): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        break
    fi
done

while true; do
    echo "Enter application user password (minimum 8 characters):"
    read -s APP_PASSWORD
    echo
    if [ ${#APP_PASSWORD} -lt 8 ]; then
        echo "❌ Password must be at least 8 characters long"
        continue
    fi
    echo "Confirm password:"
    read -s APP_PASSWORD_CONFIRM
    echo
    if [ "$APP_PASSWORD" = "$APP_PASSWORD_CONFIRM" ]; then
        break
    else
        echo "❌ Passwords do not match. Please try again."
    fi
done

# Check if database.sql file exists
if [ ! -f "database.sql" ]; then
    echo "❌ database.sql file not found in current directory"
    echo "Please make sure your schema file is named 'database.sql' and is in the current directory"
    echo "Current directory: $(pwd)"
    echo "Files in current directory:"
    ls -la *.sql 2>/dev/null || echo "No .sql files found"
    exit 1
fi

echo "✅ Found database.sql schema file"

# Create database and user using a temporary SQL file to avoid issues
echo "🔧 Creating database and user..."

# Create a temporary SQL file
TEMP_SQL=$(mktemp)
cat > "$TEMP_SQL" << EOF
-- Drop existing database if it exists (be careful!)
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME;

-- Drop existing user if it exists
DO \$\$
BEGIN
    IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$APP_USER') THEN
        DROP ROLE $APP_USER;
    END IF;
END
\$\$;

CREATE USER $APP_USER WITH PASSWORD '$APP_PASSWORD';

-- Grant privileges to the database
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $APP_USER;
GRANT CREATEDB TO $APP_USER;
EOF

# Execute the SQL file as postgres user
sudo -u postgres psql -f "$TEMP_SQL"

if [ $? -eq 0 ]; then
    echo "✅ Database and user created successfully"
else
    echo "❌ Failed to create database and user"
    rm -f "$TEMP_SQL"
    exit 1
fi

# Clean up temp file
rm -f "$TEMP_SQL"

# Now connect to the specific database to set up extensions and permissions
echo "🔧 Setting up database extensions and permissions..."
TEMP_DB_SQL=$(mktemp)
cat > "$TEMP_DB_SQL" << EOF
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Grant all privileges on schema
GRANT ALL ON SCHEMA public TO $APP_USER;

-- Grant privileges on future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $APP_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $APP_USER;
EOF

sudo -u postgres psql -d "$DB_NAME" -f "$TEMP_DB_SQL"

if [ $? -eq 0 ]; then
    echo "✅ Extensions and permissions set up successfully"
else
    echo "❌ Failed to set up extensions and permissions"
    rm -f "$TEMP_DB_SQL"
    exit 1
fi

rm -f "$TEMP_DB_SQL"

# Import the schema using the application user
echo "📋 Importing database schema from database.sql..."
export PGPASSWORD=$APP_PASSWORD

# First, let's see what's in the SQL file (first few lines)
echo "📄 Schema file preview (first 5 lines):"
head -5 database.sql
echo "..."
echo ""

echo "🔄 Importing schema..."
psql -U $APP_USER -h localhost -d $DB_NAME -f database.sql -v ON_ERROR_STOP=1

if [ $? -eq 0 ]; then
    echo "✅ Schema imported successfully"
else
    echo "❌ Failed to import schema"
    echo ""
    echo "🔍 Let's check what went wrong..."
    echo "Trying to connect and see what exists:"
    psql -U $APP_USER -h localhost -d $DB_NAME -c "\dt" || echo "No tables found"
    echo ""
    echo "Checking for any existing objects:"
    psql -U $APP_USER -h localhost -d $DB_NAME -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public';" || echo "Query failed"
    exit 1
fi

# Verify the setup
echo "🔍 Verifying database setup..."
TABLE_COUNT=$(psql -U $APP_USER -h localhost -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | tr -d ' ')

echo "Found $TABLE_COUNT tables"

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✅ Database setup complete! Found $TABLE_COUNT tables."
    
    # Show created tables
    echo ""
    echo "📋 Created tables:"
    psql -U $APP_USER -h localhost -d $DB_NAME -c "\dt"
    
    # Show sample data if tables exist
    echo ""
    echo "📊 Sample data verification:"
    
    # Check if roles table exists and has data
    ROLES_COUNT=$(psql -U $APP_USER -h localhost -d $DB_NAME -t -c "SELECT COUNT(*) FROM roles;" 2>/dev/null | tr -d ' ' || echo "0")
    echo "Roles: $ROLES_COUNT"
    if [ "$ROLES_COUNT" -gt 0 ]; then
        psql -U $APP_USER -h localhost -d $DB_NAME -c "SELECT name, description FROM roles LIMIT 5;"
    fi
    
    # Check if organizations table exists and has data
    ORGS_COUNT=$(psql -U $APP_USER -h localhost -d $DB_NAME -t -c "SELECT COUNT(*) FROM organizations;" 2>/dev/null | tr -d ' ' || echo "0")
    echo "Organizations: $ORGS_COUNT"
    if [ "$ORGS_COUNT" -gt 0 ]; then
        psql -U $APP_USER -h localhost -d $DB_NAME -c "SELECT name, code FROM organizations LIMIT 5;"
    fi
    
    # Check if agricultural_inputs table exists and has data
    INPUTS_COUNT=$(psql -U $APP_USER -h localhost -d $DB_NAME -t -c "SELECT COUNT(*) FROM agricultural_inputs;" 2>/dev/null | tr -d ' ' || echo "0")
    echo "Agricultural Inputs: $INPUTS_COUNT"
    if [ "$INPUTS_COUNT" -gt 0 ]; then
        psql -U $APP_USER -h localhost -d $DB_NAME -c "SELECT name, code, category, unit FROM agricultural_inputs LIMIT 5;"
    fi
    
else
    echo "⚠️ Database created but no tables found."
    echo "Let's check what happened:"
    psql -U $APP_USER -h localhost -d $DB_NAME -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public';"
    echo ""
    echo "This might be due to an error in the SQL file. Check the database.sql file for syntax errors."
    exit 1
fi

# Create .env file for Node.js application
echo ""
echo "📝 Creating .env file for your application..."
cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$APP_USER
DB_PASSWORD=$APP_PASSWORD

# JWT Configuration - Generate a random secret
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-this-to-a-secure-random-string-32-chars-min")

# Server Configuration
PORT=3000
NODE_ENV=development

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
EOF

echo "✅ Environment file (.env) created"

# Create package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    echo "📦 Creating package.json..."
    cat > package.json << EOF
{
  "name": "agridistri-connect",
  "version": "1.0.0",
  "description": "Agricultural Input Distribution Management System",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "node test_db_connection.js"
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
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF
    echo "✅ package.json created"
fi

# Create a simple test script
echo "📝 Creating database connection test script..."
cat > test_db_connection.js << 'EOF'
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
        console.log(`Connecting to: ${process.env.DB_NAME} as ${process.env.DB_USER}`);
        
        const client = await pool.connect();
        
        // Test basic query
        const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
        console.log('✅ Database connection successful!');
        console.log('📅 Current time:', result.rows[0].current_time);
        console.log('🗄️ PostgreSQL version:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]);
        
        // Count tables
        const tableCount = await client.query("SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
        console.log('📊 Tables found:', tableCount.rows[0].count);
        
        // Test sample data if tables exist
        if (parseInt(tableCount.rows[0].count) > 0) {
            try {
                const roles = await client.query('SELECT COUNT(*) as count FROM roles');
                console.log('👥 Roles in database:', roles.rows[0].count);
            } catch (e) {
                console.log('👥 Roles table not found or empty');
            }
            
            try {
                const orgs = await client.query('SELECT COUNT(*) as count FROM organizations');
                console.log('🏢 Organizations in database:', orgs.rows[0].count);
            } catch (e) {
                console.log('🏢 Organizations table not found or empty');
            }
            
            try {
                const inputs = await client.query('SELECT COUNT(*) as count FROM agricultural_inputs');
                console.log('🌱 Agricultural inputs in database:', inputs.rows[0].count);
            } catch (e) {
                console.log('🌱 Agricultural inputs table not found or empty');
            }
        }
        
        client.release();
        await pool.end();
        console.log('✅ All tests passed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('📋 Connection details:');
        console.error('  Host:', process.env.DB_HOST);
        console.error('  Port:', process.env.DB_PORT);
        console.error('  Database:', process.env.DB_NAME);
        console.error('  User:', process.env.DB_USER);
        process.exit(1);
    }
}

testConnection();
EOF

echo "✅ Database connection test script created (test_db_connection.js)"

# Final instructions
echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Database Information:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: $DB_NAME"
echo "  User: $APP_USER"
echo "  Tables: $TABLE_COUNT"
echo ""
echo "🚀 Next steps:"
echo "  1. Install Node.js dependencies:"
echo "     npm install"
echo ""
echo "  2. Test database connection:"
echo "     npm test"
echo ""
echo "  3. Start developing your API server!"
echo ""
echo "💡 Useful commands:"
echo "  - Connect to database: psql -U $APP_USER -h localhost -d $DB_NAME"
echo "  - View tables: \\dt"
echo "  - View sample roles: SELECT * FROM roles;"
echo "  - Check PostgreSQL status: sudo systemctl status postgresql"
echo ""
echo "📁 Files created:"
echo "  - .env (database configuration)"
echo "  - package.json (Node.js project file)"
echo "  - test_db_connection.js (connection test)"
echo ""

# Cleanup password from environment
unset PGPASSWORD

echo "🔒 Setup completed securely!"
echo ""
echo "⚠️  Important Notes:"
echo "  - Database name was converted to lowercase: $DB_NAME"
echo "  - User name was converted to lowercase: $APP_USER"
echo "  - Your credentials are stored in .env file"
echo "  - Keep your .env file secure and don't commit it to version control"