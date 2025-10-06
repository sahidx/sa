#!/bin/bash

# SA Student Management System - System Monitor
# Collect and display system metrics

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}$1${NC}"
}

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check service status with color
check_service_status() {
    local service=$1
    if systemctl is-active --quiet "$service"; then
        print_status "$service: Active"
    else
        print_error "$service: Inactive"
    fi
}

# Function to get memory usage percentage
get_memory_usage() {
    free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}'
}

# Function to get disk usage percentage
get_disk_usage() {
    df / | tail -1 | awk '{print $5}' | sed 's/%//'
}

# Function to get load average
get_load_average() {
    uptime | awk -F'load average:' '{print $2}' | xargs
}

# Function to check port
check_port() {
    local port=$1
    if netstat -tuln | grep -q ":$port "; then
        print_status "Port $port: Open"
    else
        print_error "Port $port: Closed"
    fi
}

clear
echo "📊 SA Student Management System - System Monitor"
echo "================================================="
echo "$(date)"
echo

# System Information
print_header "🖥️  System Information"
echo "   Hostname: $(hostname)"
echo "   Uptime: $(uptime -p)"
echo "   Load Average: $(get_load_average)"
echo "   Users: $(who | wc -l) logged in"
echo

# Resource Usage
print_header "📈 Resource Usage"
MEMORY_USAGE=$(get_memory_usage)
DISK_USAGE=$(get_disk_usage)

echo "   Memory Usage: ${MEMORY_USAGE}%"
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    print_warning "High memory usage detected"
fi

echo "   Disk Usage: ${DISK_USAGE}%"
if [ "$DISK_USAGE" -gt 80 ]; then
    print_warning "High disk usage detected"
fi

echo "   CPU Cores: $(nproc)"
echo

# Service Status
print_header "🔧 Service Status"
check_service_status "postgresql"
check_service_status "nginx"
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "sa-student-management"; then
        local pm2_status=$(pm2 jlist | jq -r '.[] | select(.name=="sa-student-management") | .pm2_env.status' 2>/dev/null || echo "unknown")
        if [ "$pm2_status" = "online" ]; then
            print_status "PM2 Application: Online"
        else
            print_error "PM2 Application: $pm2_status"
        fi
    else
        print_error "PM2 Application: Not found"
    fi
else
    print_error "PM2: Not installed"
fi
echo

# Network Status
print_header "🌐 Network Status"
check_port 22    # SSH
check_port 80    # HTTP
check_port 443   # HTTPS
check_port 3000  # Application
check_port 5432  # PostgreSQL
echo

# Database Status
print_header "🗄️  Database Status"
if [ -f ".env" ] && grep -q "DATABASE_URL" .env; then
    export $(grep -v '^#' .env | xargs) 2>/dev/null
    
    if [ ! -z "$DATABASE_URL" ]; then
        if timeout 5 psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
            print_status "Database Connection: OK"
            
            # Get database stats
            DB_SIZE=$(psql "$DATABASE_URL" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));" 2>/dev/null | xargs)
            DB_CONNECTIONS=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs)
            
            echo "   Database Size: $DB_SIZE"
            echo "   Active Connections: $DB_CONNECTIONS"
        else
            print_error "Database Connection: Failed"
        fi
    else
        print_error "Database URL: Not configured"
    fi
else
    print_error "Environment: .env file not found"
fi
echo

# Application Metrics
print_header "📱 Application Metrics"
if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "Application: Responding"
    
    # Check if we can access the API
    if curl -s -f http://localhost:3000/api/public/batches > /dev/null 2>&1; then
        print_status "API Endpoint: Accessible"
    else
        print_warning "API Endpoint: May have issues"
    fi
else
    print_error "Application: Not responding"
fi
echo

# Log Files
print_header "📋 Recent Log Activity"
if [ -d "logs" ]; then
    echo "   Application Logs:"
    if [ -f "logs/combined.log" ]; then
        RECENT_ERRORS=$(tail -100 logs/combined.log | grep -i error | wc -l)
        echo "     Recent Errors: $RECENT_ERRORS"
    fi
    
    if [ -f "logs/err.log" ]; then
        ERROR_SIZE=$(du -h logs/err.log | cut -f1)
        echo "     Error Log Size: $ERROR_SIZE"
    fi
else
    print_warning "Log directory not found"
fi

# System Logs
RECENT_SYSTEM_ERRORS=$(journalctl --since "1 hour ago" -p err | wc -l)
echo "   System Errors (last hour): $RECENT_SYSTEM_ERRORS"
echo

# Backup Status
print_header "💾 Backup Status"
BACKUP_DIR="/var/backups/sa-student-management"
if [ -d "$BACKUP_DIR" ]; then
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/sa_backup_*.sql.gz 2>/dev/null | head -1)
    if [ ! -z "$LATEST_BACKUP" ]; then
        BACKUP_AGE=$(( ($(date +%s) - $(stat -c %Y "$LATEST_BACKUP")) / 86400 ))
        BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
        
        echo "   Latest Backup: $(basename "$LATEST_BACKUP")"
        echo "   Backup Age: $BACKUP_AGE days"
        echo "   Backup Size: $BACKUP_SIZE"
        
        if [ "$BACKUP_AGE" -gt 1 ]; then
            print_warning "Backup is older than 1 day"
        else
            print_status "Recent backup available"
        fi
    else
        print_error "No backups found"
    fi
else
    print_error "Backup directory not found"
fi
echo

# Security Status
print_header "🔒 Security Status"
if command -v ufw &> /dev/null; then
    UFW_STATUS=$(ufw status | head -1 | awk '{print $2}')
    if [ "$UFW_STATUS" = "active" ]; then
        print_status "Firewall: Active"
    else
        print_warning "Firewall: Inactive"
    fi
else
    print_warning "UFW Firewall: Not installed"
fi

# Check for failed login attempts
FAILED_LOGINS=$(journalctl --since "24 hours ago" | grep -i "failed password" | wc -l)
echo "   Failed SSH Logins (24h): $FAILED_LOGINS"
if [ "$FAILED_LOGINS" -gt 10 ]; then
    print_warning "High number of failed login attempts detected"
fi

# SSL Certificate check (if applicable)
if [ -d "/etc/letsencrypt/live" ]; then
    CERT_DOMAINS=$(ls /etc/letsencrypt/live/ 2>/dev/null | head -5)
    if [ ! -z "$CERT_DOMAINS" ]; then
        echo "   SSL Certificates: Present"
        for domain in $CERT_DOMAINS; do
            if [ -f "/etc/letsencrypt/live/$domain/cert.pem" ]; then
                CERT_EXPIRY=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$domain/cert.pem" | cut -d= -f 2)
                DAYS_TO_EXPIRY=$(( ($(date -d "$CERT_EXPIRY" +%s) - $(date +%s)) / 86400 ))
                
                if [ "$DAYS_TO_EXPIRY" -lt 30 ]; then
                    print_warning "SSL certificate for $domain expires in $DAYS_TO_EXPIRY days"
                fi
            fi
        done
    fi
fi
echo

# Performance Summary
print_header "⚡ Performance Summary"
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )) || [ "$DISK_USAGE" -gt 80 ]; then
    print_warning "System resources running high"
elif (( $(echo "$MEMORY_USAGE > 60" | bc -l) )) || [ "$DISK_USAGE" -gt 60 ]; then
    print_warning "System resources moderately used"
else
    print_status "System resources normal"
fi

# Recommendations
if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "   💡 Consider: Restart PM2 applications or increase server memory"
fi

if [ "$DISK_USAGE" -gt 80 ]; then
    echo "   💡 Consider: Clean up old logs or backup files"
fi

if [ "$RECENT_SYSTEM_ERRORS" -gt 5 ]; then
    echo "   💡 Consider: Check system logs with 'journalctl -p err'"
fi

echo
echo "📊 Monitoring completed at $(date)"
echo "═══════════════════════════════════════════════════════"