#!/bin/bash

# Production Deployment Script for SA Student Management System
# Run this script on your Ubuntu VPS to deploy the application

set -e

echo "🚀 SA Student Management System - Production Deployment"
echo "======================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

print_header "📋 Pre-deployment Checks"

# Check Node.js version
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v) ✓"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

print_status "npm version: $(npm -v) ✓"

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    print_warning "PostgreSQL is not running. Starting PostgreSQL..."
    sudo systemctl start postgresql
    if ! systemctl is-active --quiet postgresql; then
        print_error "Failed to start PostgreSQL"
        exit 1
    fi
fi

print_status "PostgreSQL is running ✓"

print_header "📦 Installing Dependencies"

# Install dependencies
print_status "Installing Node.js dependencies..."
npm ci --production=false

print_header "🔧 Environment Configuration"

# Check if .env exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_status "Created .env from .env.example"
        print_warning "Please edit .env file with your actual configuration"
        
        # Generate random session secret
        SESSION_SECRET=$(openssl rand -base64 32)
        sed -i "s/your_session_secret_here_minimum_32_characters/$SESSION_SECRET/" .env
        print_status "Generated secure session secret"
    else
        print_error ".env.example not found. Cannot create environment file."
        exit 1
    fi
fi

# Check if DATABASE_URL is configured
if ! grep -q "^DATABASE_URL=" .env || grep -q "your_secure_password_here" .env; then
    print_warning "DATABASE_URL is not properly configured in .env"
    print_warning "Please update .env with correct database credentials"
fi

print_header "🗄️ Database Setup"

# Check if database connection works
print_status "Testing database connection..."
if timeout 10 npm run db:push 2>/dev/null; then
    print_status "Database connection successful ✓"
    print_status "Database schema updated ✓"
else
    print_error "Database connection failed. Please check your DATABASE_URL in .env"
    print_warning "Example: DATABASE_URL=postgresql://username:password@localhost:5432/database"
    exit 1
fi

print_header "🏗️ Building Application"

# Build the application
print_status "Building application..."
npm run build

if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

print_status "Application built successfully ✓"

print_header "🔥 Setting up PM2 (Production Process Manager)"

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
fi

print_status "PM2 version: $(pm2 -v) ✓"

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sa-student-management',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    max_restarts: 5,
    restart_delay: 4000,
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=1024'
  }]
}
EOF

# Create logs directory
mkdir -p logs

print_status "PM2 ecosystem configured ✓"

print_header "🔒 Setting up Nginx (Reverse Proxy)"

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt update
    sudo apt install -y nginx
fi

# Create Nginx configuration
DOMAIN_NAME=${DOMAIN_NAME:-$(hostname)}
SERVER_NAME=${SERVER_NAME:-$DOMAIN_NAME}

sudo tee /etc/nginx/sites-available/sa-student-management << EOF
server {
    listen 80;
    server_name $SERVER_NAME;
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;
    
    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Login rate limiting
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3000;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/sa-student-management /etc/nginx/sites-enabled/

# Remove default site if it exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
if sudo nginx -t; then
    print_status "Nginx configuration is valid ✓"
    sudo systemctl reload nginx
    print_status "Nginx reloaded ✓"
else
    print_error "Nginx configuration is invalid"
    exit 1
fi

print_header "🚦 Starting Application Services"

# Stop any existing PM2 processes
pm2 stop sa-student-management 2>/dev/null || true
pm2 delete sa-student-management 2>/dev/null || true

# Start the application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
print_status "Setting up PM2 startup script..."
pm2 startup systemd -u $(whoami) --hp $(pwd) | tail -n 1 | sudo bash

print_status "Application started successfully ✓"

print_header "🔍 Health Check"

# Wait a moment for the application to start
sleep 5

# Check if the application is responding
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302"; then
    print_status "Application health check passed ✓"
else
    print_warning "Application may not be fully ready yet..."
fi

print_header "📊 System Status"

# Show PM2 status
pm2 status

# Show Nginx status
if systemctl is-active --quiet nginx; then
    print_status "Nginx is running ✓"
else
    print_warning "Nginx is not running"
fi

# Show PostgreSQL status  
if systemctl is-active --quiet postgresql; then
    print_status "PostgreSQL is running ✓"
else
    print_warning "PostgreSQL is not running"
fi

print_header "🎉 Deployment Complete!"

echo
echo "✅ SA Student Management System deployed successfully!"
echo
echo "📱 Application Details:"
echo "   • URL: http://$SERVER_NAME"
echo "   • Default Teacher: 01762602056 / sir@123@"
echo "   • Default Super User: 01818291546 / sahidx@123"
echo
echo "🔧 Management Commands:"
echo "   • Check status: pm2 status"
echo "   • View logs: pm2 logs sa-student-management"
echo "   • Restart app: pm2 restart sa-student-management"
echo "   • Stop app: pm2 stop sa-student-management"
echo "   • Update app: git pull && npm run build && pm2 restart sa-student-management"
echo
echo "📁 Important Files:"
echo "   • Application: $(pwd)"
echo "   • Logs: $(pwd)/logs/"
echo "   • Environment: $(pwd)/.env"
echo "   • Nginx config: /etc/nginx/sites-available/sa-student-management"
echo
echo "🔒 Security Recommendations:"
echo "   • Setup SSL/TLS certificate (Let's Encrypt recommended)"
echo "   • Configure firewall (ufw enable, allow 22,80,443)"
echo "   • Regular backups of database and .env file"
echo "   • Monitor logs regularly"
echo
print_status "Deployment completed successfully! 🎉"