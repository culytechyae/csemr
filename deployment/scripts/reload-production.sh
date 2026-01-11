#!/bin/bash
# Reload Production Services
# Zero-downtime reload of PM2 and NGINX

set -e

echo "Reloading production services..."

# Reload PM2 (zero-downtime)
if pm2 list | grep -q "taaleem-emr"; then
    echo "Reloading PM2 application (zero-downtime)..."
    pm2 reload taaleem-emr
    echo "✅ PM2 application reloaded"
else
    echo "PM2 application is not running. Starting..."
    pm2 start ecosystem.config.js
    pm2 save
fi

# Reload NGINX
if sudo systemctl is-active --quiet nginx; then
    echo "Testing NGINX configuration..."
    if sudo nginx -t; then
        echo "Reloading NGINX..."
        sudo systemctl reload nginx
        echo "✅ NGINX reloaded"
    else
        echo "❌ NGINX configuration has errors. Not reloading."
        exit 1
    fi
else
    echo "⚠️  NGINX is not running"
fi

echo ""
echo "✅ All services reloaded successfully"

