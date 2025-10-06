# 🚀 Complete VPS Deployment Guide

## Step 1: Initial VPS Setup

### 1.1 Connect to Your VPS
```bash
ssh root@your_vps_ip
# or if you have a user account:
ssh your_username@your_vps_ip
```

### 1.2 Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl wget git unzip -y
```

### 1.3 Install Node.js 20 (LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should show v20.x.x
npm --version   # Should show v10.x.x
```

## Step 2: Domain Setup

### 2.1 Point Domain to VPS
**In your domain registrar (GoDaddy, Namecheap, etc.):**
- Create an **A record** pointing to your VPS IP address:
  ```
  Type: A
  Name: @ (for root domain) or www
  Value: YOUR_VPS_IP_ADDRESS
  TTL: 3600 (1 hour)
  ```

### 2.2 Verify Domain Resolution
```bash
# Wait 5-10 minutes, then test:
nslookup yourdomain.com
dig yourdomain.com
```

## Step 3: Clone and Setup Project

### 3.1 Clone Repository
```bash
cd /opt
sudo git clone https://github.com/sahidx/sa.git
sudo chown -R $USER:$USER /opt/sa
cd /opt/sa
```

### 3.2 Install Dependencies
```bash
npm install
```

## Step 4: Database Configuration

### 4.1 Since you already created the database, get your connection details:
```bash
# You need these details:
# - Database host (usually localhost if on same VPS)
# - Database name
# - Username
# - Password
# - Port (usually 5432)
```

### 4.2 Configure Environment Variables
```bash
cp .env.example .env
nano .env
```

**Configure your .env file:**
```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Application Settings
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-characters-long
BCRYPT_ROUNDS=12

# Domain Configuration (replace with your actual domain)
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

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
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem

# Health Check
TEST_DB_CONNECTION=true
```

### 4.3 Initialize Database Schema
```bash
npm run db:push
```

## Step 5: Build Application
```bash
npm run build
```

## Step 6: Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

## Step 7: Install and Configure Nginx

### 7.1 Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 7.2 Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/sa-app
```

**Add this configuration (replace yourdomain.com):**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration (will be updated after SSL setup)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Frontend (React app)
    location / {
        root /opt/sa/client/dist;
        try_files $uri $uri/ /index.html;
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
```

### 7.3 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/sa-app /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
```

## Step 8: SSL Certificate Setup

### 8.1 Install Certbot
```bash
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 8.2 Get SSL Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Follow the prompts:**
- Enter your email address
- Agree to terms of service
- Choose whether to share email with EFF
- Certbot will automatically configure Nginx with SSL

### 8.3 Test SSL Auto-Renewal
```bash
sudo certbot renew --dry-run
```

## Step 9: Start Application

### 9.1 Create PM2 Ecosystem File
```bash
nano /opt/sa/ecosystem.config.js
```

**Add this configuration:**
```javascript
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
```

### 9.2 Create Logs Directory
```bash
mkdir -p /opt/sa/logs
```

### 9.3 Start Application with PM2
```bash
cd /opt/sa
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Run the command that PM2 provides (something like):**
```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 9.4 Restart Nginx
```bash
sudo systemctl restart nginx
```

## Step 10: Verify Deployment

### 10.1 Check Services
```bash
# Check PM2 processes
pm2 status
pm2 logs sa-app

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check if app is responding
curl http://localhost:3000/health
curl https://yourdomain.com/health
```

### 10.2 Test Application
1. Open `https://yourdomain.com` in your browser
2. You should see the SA Student Management System
3. Try logging in as a teacher or student
4. Test key features

## Step 11: Setup Monitoring (Optional but Recommended)

### 11.1 PM2 Web Monitoring
```bash
pm2 install pm2-server-monit
```

### 11.2 Setup Log Rotation
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

## Step 12: Database Backup Setup

### 12.1 Make Backup Script Executable
```bash
chmod +x /opt/sa/backup.sh
```

### 12.2 Setup Automated Backups
```bash
sudo crontab -e
```

**Add this line for daily backups at 2 AM:**
```bash
0 2 * * * /opt/sa/backup.sh
```

## 🔥 Quick Deployment Commands (All-in-One)

If you want to run everything quickly:

```bash
# 1. Clone and setup
cd /opt && sudo git clone https://github.com/sahidx/sa.git && sudo chown -R $USER:$USER /opt/sa && cd /opt/sa

# 2. Install dependencies and build
npm install && npm run build

# 3. Configure environment (you'll need to edit this manually)
cp .env.example .env && nano .env

# 4. Setup database schema
npm run db:push

# 5. Install global dependencies
sudo npm install -g pm2

# 6. Create directories
mkdir -p logs

# 7. Start with PM2
pm2 start ecosystem.config.js && pm2 save && pm2 startup
```

## 🚨 Troubleshooting

### Common Issues:

1. **Port 3000 already in use:**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Database connection failed:**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   # Check connection string in .env
   ```

3. **Nginx 502 Bad Gateway:**
   ```bash
   # Check if Node.js app is running
   pm2 status
   # Check Nginx logs
   sudo tail -f /var/log/nginx/error.log
   ```

4. **SSL Certificate Issues:**
   ```bash
   sudo certbot certificates
   sudo certbot renew
   ```

## 🎉 Final Checklist

- [ ] Domain points to VPS IP
- [ ] SSL certificate installed and working
- [ ] Database connected and tables created
- [ ] Application starts without errors
- [ ] All features working (login, dashboard, etc.)
- [ ] PM2 monitoring active
- [ ] Nginx serving static files
- [ ] Automated backups configured

Your SA Student Management System is now live at `https://yourdomain.com`! 🚀