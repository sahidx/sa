#!/bin/bash

# 🚀 SA Student Management System - VPS Auto Deployment Script
# Run this script on your Ubuntu VPS after setting up domain and database

set -e  # Exit on any error

echo "🚀 Starting SA Student Management System Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Get domain from user
read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN
if [[ -z "$DOMAIN" ]]; then
    print_error "Domain name is required!"
    exit 1
fi

# Get database details from user
print_status "Please provide your database connection details:"
read -p "Database host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database name: " DB_NAME
if [[ -z "$DB_NAME" ]]; then
    print_error "Database name is required!"
    exit 1
fi

read -p "Database username: " DB_USER
if [[ -z "$DB_USER" ]]; then
    print_error "Database username is required!"
    exit 1
fi

read -s -p "Database password: " DB_PASS
echo
if [[ -z "$DB_PASS" ]]; then
    print_error "Database password is required!"
    exit 1
fi

read -p "Database port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

# Step 1: Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install curl wget git unzip nginx -y
print_success "System updated successfully"

# Step 2: Install Node.js 20
print_status "Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
print_success "Node.js $(node --version) installed"

# Step 3: Install PM2
print_status "Installing PM2..."
sudo npm install -g pm2
print_success "PM2 installed successfully"

# Step 4: Clone repository
print_status "Cloning SA repository..."
cd /opt
if [[ -d "/opt/sa" ]]; then
    print_warning "Directory /opt/sa already exists. Backing up..."
    sudo mv /opt/sa /opt/sa.backup.$(date +%Y%m%d_%H%M%S)
fi
sudo git clone https://github.com/sahidx/sa.git
sudo chown -R $USER:$USER /opt/sa
cd /opt/sa
print_success "Repository cloned successfully"

# Step 5: Install dependencies
print_status "Installing Node.js dependencies..."
npm install
print_success "Dependencies installed"

# Step 6: Create environment file
print_status "Creating environment configuration..."
cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Application Settings
NODE_ENV=production
PORT=3000
JWT_SECRET=$(openssl rand -base64 32)
BCRYPT_ROUNDS=12

# Domain Configuration
FRONTEND_URL=https://${DOMAIN}
ALLOWED_ORIGINS=https://${DOMAIN},https://www.${DOMAIN}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760

# Database Pool Settings
DB_POOL_MIN=5
DB_POOL_MAX=20

# SSL Settings
HTTPS=true
SSL_CERT_PATH=/etc/letsencrypt/live/${DOMAIN}/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/${DOMAIN}/privkey.pem

# Health Check
TEST_DB_CONNECTION=true
EOF
print_success "Environment file created"

# Step 7: Test database connection and push schema
print_status "Testing database connection and creating tables..."
if npm run db:push; then
    print_success "Database schema created successfully"
else
    print_error "Database connection failed! Please check your database settings."
    print_warning "You can manually edit /opt/sa/.env and run 'npm run db:push' later"
fi

# Step 8: Build application
print_status "Building application..."
npm run build
print_success "Application built successfully"

# Step 9: Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'sa-app',
    script: './server/index.js',
    cwd: '/opt/sa',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/opt/sa/logs/err.log',
    out_file: '/opt/sa/logs/out.log',
    log_file: '/opt/sa/logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    autorestart: true,
    watch: false
  }]
}
EOF

# Create logs directory
mkdir -p logs
print_success "PM2 configuration created"

# Step 10: Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/sa-app > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # Temporary configuration before SSL
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # SSL Configuration (will be updated after SSL setup)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!3DES:!MD5:!PSK;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Static files
    location /assets/ {
        alias /opt/sa/client/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Frontend (React app)
    location / {
        root /opt/sa/client/dist;
        try_files \$uri \$uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public";
    }
    
    # Error pages
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /opt/sa/client/dist;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/sa-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
if sudo nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors!"
    exit 1
fi

print_success "Nginx configured successfully"

# Step 11: Install SSL Certificate
print_status "Installing SSL certificate..."
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

# Start nginx first
sudo systemctl restart nginx

# Get SSL certificate
if sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN}; then
    print_success "SSL certificate installed successfully"
else
    print_warning "SSL certificate installation failed. You can run it manually later:"
    print_warning "sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
fi

# Step 12: Start application
print_status "Starting SA application..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup > /tmp/pm2_startup.sh
chmod +x /tmp/pm2_startup.sh
sudo /tmp/pm2_startup.sh

print_success "Application started successfully"

# Step 13: Setup monitoring
print_status "Setting up monitoring..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# Make backup script executable
chmod +x backup.sh

print_success "Monitoring configured"

# Step 14: Final restart
sudo systemctl restart nginx

print_success "Deployment completed successfully!"

echo
echo "================================================================"
echo "🎉 SA Student Management System is now live!"
echo "================================================================"
echo
echo "🌐 Website: https://${DOMAIN}"
echo "📊 Health Check: https://${DOMAIN}/health"
echo
echo "📋 Management Commands:"
echo "  pm2 status           - Check application status"
echo "  pm2 logs sa-app      - View application logs"
echo "  pm2 restart sa-app   - Restart application"
echo "  sudo systemctl status nginx - Check Nginx status"
echo
echo "📁 Important Files:"
echo "  Application: /opt/sa"
echo "  Environment: /opt/sa/.env"
echo "  Nginx Config: /etc/nginx/sites-available/sa-app"
echo "  Logs: /opt/sa/logs/"
echo
echo "🔧 Next Steps:"
echo "1. Test your application at https://${DOMAIN}"
echo "2. Create your first teacher/admin account"
echo "3. Configure automated backups (optional)"
echo "4. Setup monitoring alerts (optional)"
echo
echo "🚨 Important Security Notes:"
echo "- Change the default JWT secret in .env if needed"
echo "- Setup firewall rules (ufw enable)"
echo "- Regularly update the system and application"
echo
print_success "Happy learning with SA Student Management System! 🎓"