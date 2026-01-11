#!/bin/bash
# Start Production Services
# Starts PM2 and verifies NGINX configuration

set -e

echo "Starting production services..."

# Start PM2 if not running
if ! pm2 list | grep -q "taaleem-emr.*online"; then
    echo "Starting PM2 application..."
    pm2 start ecosystem.config.js
    pm2 save
else
    echo "PM2 application is already running"
fi

# Check NGINX
if sudo systemctl is-active --quiet nginx; then
    echo "NGINX is running"
    
    # Test configuration
    if sudo nginx -t; then
        echo "NGINX configuration is valid"
    else
        echo "⚠️  NGINX configuration has errors"
    fi
else
    echo "⚠️  NGINX is not running"
    echo "Start with: sudo systemctl start nginx"
fi

# Show status
echo ""
echo "PM2 Status:"
pm2 status

echo ""
echo "NGINX Status:"
sudo systemctl status nginx --no-pager -l

echo ""
echo "Application Health:"
curl -s http://localhost:5005/api/health | jq . || echo "Health check endpoint not responding"

