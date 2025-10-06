#!/bin/bash

# PostgreSQL Setup Script for Ubuntu Production Environment
# This script sets up PostgreSQL for production use

set -e

echo "🚀 Setting up PostgreSQL for production..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install PostgreSQL and required packages
echo "🐘 Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib postgresql-client

# Start and enable PostgreSQL service
echo "🔧 Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
DB_NAME="${DB_NAME:-sa_production}"
DB_USER="${DB_USER:-sa_user}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 32)}"

echo "🔐 Creating database and user..."
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE ${DB_NAME};

-- Create user
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Grant schema privileges
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Exit
\q
EOF

# Configure PostgreSQL for production
echo "⚙️ Configuring PostgreSQL for production..."

# Backup original postgresql.conf
sudo cp /etc/postgresql/*/main/postgresql.conf /etc/postgresql/*/main/postgresql.conf.backup

# Update PostgreSQL configuration for production
sudo tee -a /etc/postgresql/*/main/postgresql.conf << EOF

# Production Configuration Settings
# Memory Settings
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# Connection Settings
max_connections = 200
listen_addresses = 'localhost'

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'all'
log_duration = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Performance
random_page_cost = 1.1
EOF

# Configure pg_hba.conf for local connections
echo "🔒 Configuring authentication..."
sudo cp /etc/postgresql/*/main/pg_hba.conf /etc/postgresql/*/main/pg_hba.conf.backup

# Allow local connections with password
sudo sed -i "s/#local   replication     all                                     peer/local   replication     all                                     md5/" /etc/postgresql/*/main/pg_hba.conf
sudo sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" /etc/postgresql/*/main/pg_hba.conf

# Restart PostgreSQL to apply changes
echo "🔄 Restarting PostgreSQL..."
sudo systemctl restart postgresql

# Create .env file with database connection string
echo "📄 Creating .env file..."
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}
NODE_ENV=production

# Application Settings
PORT=3000
SESSION_SECRET=$(openssl rand -base64 32)

# SMS Configuration (configure as needed)
SMS_API_KEY=your_sms_api_key_here
SMS_SENDER_ID=8809617628909
SMS_API_URL=http://bulksmsbd.net/api/smsapi
EOF

echo "✅ PostgreSQL setup completed!"
echo ""
echo "📋 Database Details:"
echo "   Database Name: ${DB_NAME}"
echo "   Username: ${DB_USER}"
echo "   Password: ${DB_PASSWORD}"
echo ""
echo "🔗 Connection String:"
echo "   postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"
echo ""
echo "📁 Environment file created: .env"
echo ""
echo "🚀 Next Steps:"
echo "1. Install dependencies: npm install"
echo "2. Push database schema: npm run db:push"
echo "3. Start the application: npm run dev"
echo ""
echo "⚠️  Important: Save the database password securely!"