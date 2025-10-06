#!/bin/bash

# SA Student Management System - Database Backup Script
# This script creates automated backups of your PostgreSQL database

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/sa-student-management}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
else
    print_error ".env file not found"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL not found in .env"
    exit 1
fi

# Create backup directory
sudo mkdir -p "$BACKUP_DIR"
sudo chown $(whoami):$(whoami) "$BACKUP_DIR"

print_status "Creating database backup..."

# Create database backup
BACKUP_FILE="$BACKUP_DIR/sa_backup_$DATE.sql"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    print_status "Database backup created: $BACKUP_FILE"
    
    # Compress the backup
    gzip "$BACKUP_FILE"
    print_status "Backup compressed: $BACKUP_FILE.gz"
    
    # Create a latest symlink
    ln -sf "sa_backup_$DATE.sql.gz" "$BACKUP_DIR/latest.sql.gz"
    print_status "Latest backup symlink updated"
else
    print_error "Database backup failed"
    exit 1
fi

# Clean up old backups
print_status "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "sa_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# Show backup information
BACKUP_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
TOTAL_BACKUPS=$(ls -1 "$BACKUP_DIR"/sa_backup_*.sql.gz | wc -l)

print_status "Backup completed successfully!"
echo "  File: $BACKUP_FILE.gz"
echo "  Size: $BACKUP_SIZE"
echo "  Total backups: $TOTAL_BACKUPS"

# Optional: Upload to remote storage (uncomment and configure as needed)
# if [ ! -z "$BACKUP_UPLOAD_URL" ]; then
#     print_status "Uploading backup to remote storage..."
#     # Example: rsync, scp, aws s3 cp, etc.
#     # rsync -av "$BACKUP_FILE.gz" "$BACKUP_UPLOAD_URL/"
# fi