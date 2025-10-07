#!/bin/bash

# 🚀 GSTeaching.com Deployment Script
# Deploy SA Student Management System to Ubuntu VPS

set -e  # Exit on any error

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

echo "🚀 Deploying SA Student Management System for gsteaching.com..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Step 1: Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install curl wget git unzip nginx -y
print_success "System updated successfully"

# Step 2: Install Node.js 20 if not installed
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null || [[ "$(node -v)" < "v20" ]]; then
    print_status "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
print_success "Node.js $(node --version) is ready"

# Step 3: Install PM2 globally
print_status "Installing PM2 process manager..."
sudo npm install -g pm2
print_success "PM2 installed successfully"

# Step 4: Ensure we're in the correct directory
cd /opt/sa || {
    print_error "Directory /opt/sa not found. Please clone the repository first."
    exit 1
}

# Step 5: Install all dependencies (including dev for building)
print_status "Installing Node.js dependencies..."
npm install --include=dev
print_success "Dependencies installed"

# Step 6: Build the application
print_status "Building application for production..."
rm -rf dist/ # Clean previous builds
npm run build || {
    print_error "Build failed! Check the error messages above."
    exit 1
}
print_success "Application built successfully"

# Step 7: Setup database schema
print_status "Setting up database schema..."
if npm run db:push; then
    print_success "Database schema updated successfully"
else
    print_warning "Database schema update failed. You may need to configure DATABASE_URL in .env"
fi

# Step 8: Configure PM2
print_status "Setting up PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'gsteaching-app',
    script: './dist/index.js',
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
    watch: false,
    ignore_watch: ["node_modules", "logs", ".git"],
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
EOF

# Create logs directory
mkdir -p logs
print_success "PM2 configuration created"

# Step 9: Configure Nginx
print_status "Configuring Nginx for gsteaching.com..."
sudo cp nginx-gsteaching.conf /etc/nginx/sites-available/gsteaching
sudo ln -sf /etc/nginx/sites-available/gsteaching /etc/nginx/sites-enabled/gsteaching
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
if sudo nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors!"
    exit 1
fi

# Step 10: Setup SSL with Let's Encrypt
print_status "Setting up SSL certificate for gsteaching.com..."
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/bin/certbot

# Start nginx first
sudo systemctl restart nginx

# Get SSL certificate
if sudo certbot --nginx -d gsteaching.com -d www.gsteaching.com --non-interactive --agree-tos --email admin@gsteaching.com; then
    print_success "SSL certificate installed successfully"
else
    print_warning "SSL certificate installation failed. You can run it manually later:"
    print_warning "sudo certbot --nginx -d gsteaching.com -d www.gsteaching.com"
fi

# Step 11: Start the application
print_status "Starting GSTeaching application..."
pm2 delete gsteaching-app 2>/dev/null || true  # Delete if exists
pm2 start ecosystem.config.js
pm2 save
pm2 startup > /tmp/pm2_startup.sh
chmod +x /tmp/pm2_startup.sh
sudo /tmp/pm2_startup.sh

print_success "Application started successfully"

# Step 12: Setup monitoring and log rotation
print_status "Setting up monitoring..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# Make scripts executable
chmod +x backup.sh health-check.sh monitor.sh

print_success "Monitoring configured"

# Step 13: Final restart and verification
sudo systemctl restart nginx

# Step 14: Setup basic firewall (optional but recommended)
print_status "Setting up basic firewall..."
sudo ufw --force enable
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force reload
print_success "Firewall configured"

print_success "Deployment completed successfully!"

echo
echo "================================================================"
echo "🎉 GSTeaching.com is now live!"
echo "================================================================"
echo
echo "🌐 Website: https://gsteaching.com"
echo "🌐 Alt URL: https://www.gsteaching.com"
echo "📊 Health Check: https://gsteaching.com/health"
echo
echo "📋 Management Commands:"
echo "  pm2 status                    - Check application status"
echo "  pm2 logs gsteaching-app       - View application logs"
echo "  pm2 restart gsteaching-app    - Restart application"
echo "  sudo systemctl status nginx   - Check Nginx status"
echo "  sudo certbot renew --dry-run  - Test SSL renewal"
echo
echo "📁 Important Files:"
echo "  Application: /opt/sa"
echo "  Environment: /opt/sa/.env"
echo "  Nginx Config: /etc/nginx/sites-available/gsteaching"
echo "  Logs: /opt/sa/logs/"
echo "  PM2 Config: /opt/sa/ecosystem.config.js"
echo
echo "🔧 Next Steps:"
echo "1. Test your application at https://gsteaching.com"
echo "2. Create your first admin account"
echo "3. Configure SMS settings in .env (optional)"
echo "4. Setup automated backups: ./backup.sh"
echo
echo "🚨 Important Notes:"
echo "- Database: postgresql://saro:password@localhost:5432/saro_db"
echo "- SSL certificates will auto-renew"
echo "- Application runs in cluster mode for better performance"
echo "- Logs are automatically rotated"
echo
print_success "Welcome to GSTeaching - Happy Learning! 🎓"