#!/bin/bash
# Stop Production Services
# Gracefully stops PM2 and NGINX

set -e

echo "Stopping production services..."

# Stop PM2
if pm2 list | grep -q "taaleem-emr"; then
    echo "Stopping PM2 application..."
    pm2 stop taaleem-emr
    echo "PM2 application stopped"
else
    echo "PM2 application is not running"
fi

# Stop NGINX (optional - usually keep running)
read -p "Stop NGINX? (y/N): " stop_nginx
if [ "$stop_nginx" == "y" ] || [ "$stop_nginx" == "Y" ]; then
    sudo systemctl stop nginx
    echo "NGINX stopped"
fi

echo ""
echo "Services stopped"

