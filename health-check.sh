#!/bin/bash

# SA Student Management System - Health Check Script
# Monitor system health and restart services if needed

set -e

# Configuration
APP_URL="${APP_URL:-http://localhost:3000}"
MAX_RETRIES=3
RESTART_THRESHOLD=2

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Initialize failure count file
FAILURE_COUNT_FILE="/tmp/sa_health_failures"
if [ ! -f "$FAILURE_COUNT_FILE" ]; then
    echo "0" > "$FAILURE_COUNT_FILE"
fi

CURRENT_FAILURES=$(cat "$FAILURE_COUNT_FILE")

# Function to check service status
check_service() {
    local service=$1
    if systemctl is-active --quiet "$service"; then
        print_status "$service is running"
        return 0
    else
        print_error "$service is not running"
        return 1
    fi
}

# Function to check HTTP endpoint
check_http() {
    local url=$1
    local max_retries=$2
    
    for i in $(seq 1 $max_retries); do
        if curl -s -f -o /dev/null --max-time 10 "$url"; then
            print_status "HTTP check passed ($url)"
            return 0
        fi
        
        if [ $i -lt $max_retries ]; then
            print_warning "HTTP check failed, retrying... ($i/$max_retries)"
            sleep 2
        fi
    done
    
    print_error "HTTP check failed after $max_retries attempts ($url)"
    return 1
}

# Function to check database connection
check_database() {
    if [ -f ".env" ]; then
        export $(grep -v '^#' .env | xargs)
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL not found"
        return 1
    fi
    
    if timeout 10 psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        print_status "Database connection OK"
        return 0
    else
        print_error "Database connection failed"
        return 1
    fi
}

# Function to check PM2 application
check_pm2_app() {
    local app_name="sa-student-management"
    
    if pm2 describe "$app_name" > /dev/null 2>&1; then
        local status=$(pm2 jlist | jq -r ".[] | select(.name==\"$app_name\") | .pm2_env.status")
        if [ "$status" = "online" ]; then
            print_status "PM2 application is online"
            return 0
        else
            print_error "PM2 application status: $status"
            return 1
        fi
    else
        print_error "PM2 application not found"
        return 1
    fi
}

# Function to restart services
restart_services() {
    print_warning "Attempting to restart services..."
    
    # Restart PM2 application
    if pm2 restart sa-student-management; then
        print_status "PM2 application restarted"
        sleep 5
    else
        print_error "Failed to restart PM2 application"
    fi
    
    # Restart Nginx if needed
    if ! systemctl is-active --quiet nginx; then
        sudo systemctl restart nginx
        print_status "Nginx restarted"
    fi
}

# Main health check
echo "🔍 SA Student Management System - Health Check"
echo "=============================================="
echo "$(date)"
echo

HEALTH_OK=true

# Check PostgreSQL
if ! check_service postgresql; then
    HEALTH_OK=false
fi

# Check Nginx
if ! check_service nginx; then
    HEALTH_OK=false
fi

# Check database connection
if ! check_database; then
    HEALTH_OK=false
fi

# Check PM2 application
if ! check_pm2_app; then
    HEALTH_OK=false
fi

# Check HTTP endpoint
if ! check_http "$APP_URL" $MAX_RETRIES; then
    HEALTH_OK=false
fi

# Handle health check results
if [ "$HEALTH_OK" = true ]; then
    print_status "All health checks passed ✓"
    echo "0" > "$FAILURE_COUNT_FILE"
    exit 0
else
    NEW_FAILURES=$((CURRENT_FAILURES + 1))
    echo "$NEW_FAILURES" > "$FAILURE_COUNT_FILE"
    
    print_error "Health check failed (failure count: $NEW_FAILURES)"
    
    if [ "$NEW_FAILURES" -ge "$RESTART_THRESHOLD" ]; then
        print_warning "Failure threshold reached, attempting service restart..."
        restart_services
        
        # Reset failure count after restart attempt
        echo "0" > "$FAILURE_COUNT_FILE"
        
        # Wait and recheck
        sleep 10
        if check_http "$APP_URL" 1; then
            print_status "Service restart successful"
            exit 0
        else
            print_error "Service restart failed"
            exit 1
        fi
    else
        print_warning "Failure count below threshold, not restarting services"
        exit 1
    fi
fi