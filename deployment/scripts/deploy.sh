#!/bin/bash
# Complete Deployment Script
# Installs and configures NGINX + PM2 for Taaleem Clinic Management System

set -e

echo "=========================================="
echo "Taaleem Clinic Management System"
echo "Production Deployment Script"
echo "=========================================="
echo ""

# Check if running as root for NGINX setup
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Some steps require root privileges"
    echo "You may be prompted for sudo password"
    echo ""
fi

# Get application directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

echo "Application directory: $APP_DIR"
cd "$APP_DIR"

# Step 1: Install PM2
echo ""
echo "Step 1: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    bash "$SCRIPT_DIR/install-pm2.sh"
else
    echo "✅ PM2 already installed"
fi

# Step 2: Install NGINX
echo ""
echo "Step 2: Installing NGINX..."
if ! command -v nginx &> /dev/null; then
    bash "$SCRIPT_DIR/install-nginx.sh"
else
    echo "✅ NGINX already installed"
fi

# Step 3: Setup PM2 configuration
echo ""
echo "Step 3: Setting up PM2 configuration..."
if [ ! -f "ecosystem.config.js" ]; then
    cp deployment/pm2/ecosystem.config.js ./
    echo "✅ PM2 configuration copied"
else
    echo "⚠️  ecosystem.config.js already exists, skipping..."
fi

# Step 4: Build application
echo ""
echo "Step 4: Building application..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Generating Prisma client..."
npx prisma generate

echo "Building application..."
npm run build

# Step 5: Start PM2
echo ""
echo "Step 5: Starting application with PM2..."
if pm2 list | grep -q "taaleem-emr"; then
    echo "Application already running, reloading..."
    pm2 reload taaleem-emr
else
    pm2 start ecosystem.config.js
fi

pm2 save

# Step 6: Setup NGINX configuration
echo ""
echo "Step 6: Setting up NGINX configuration..."
if [ ! -f "/etc/nginx/sites-available/taaleem-emr" ]; then
    sudo cp deployment/nginx/nginx.conf /etc/nginx/sites-available/taaleem-emr
    echo "✅ NGINX configuration copied"
    
    if [ ! -L "/etc/nginx/sites-enabled/taaleem-emr" ]; then
        sudo ln -s /etc/nginx/sites-available/taaleem-emr /etc/nginx/sites-enabled/
        echo "✅ NGINX site enabled"
    fi
else
    echo "⚠️  NGINX configuration already exists"
    read -p "Overwrite? (y/N): " overwrite
    if [ "$overwrite" == "y" ] || [ "$overwrite" == "Y" ]; then
        sudo cp deployment/nginx/nginx.conf /etc/nginx/sites-available/taaleem-emr
        echo "✅ NGINX configuration updated"
    fi
fi

# Step 7: Update NGINX configuration paths
echo ""
echo "Step 7: Updating NGINX configuration..."
read -p "Enter application path [$APP_DIR]: " app_path
app_path=${app_path:-$APP_DIR}

# Update paths in NGINX config
sudo sed -i "s|/opt/taaleem-emr|$app_path|g" /etc/nginx/sites-available/taaleem-emr

read -p "Enter your domain name (or press Enter to skip): " domain
if [ -n "$domain" ]; then
    sudo sed -i "s|your-domain.com|$domain|g" /etc/nginx/sites-available/taaleem-emr
    sudo sed -i "s|www.your-domain.com|www.$domain|g" /etc/nginx/sites-available/taaleem-emr
fi

# Step 8: Test NGINX configuration
echo ""
echo "Step 8: Testing NGINX configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ NGINX configuration is valid"
    sudo systemctl reload nginx
    echo "✅ NGINX reloaded"
else
    echo "❌ NGINX configuration has errors"
    echo "Please fix the configuration and run: sudo nginx -t"
    exit 1
fi

# Step 9: SSL Certificate
echo ""
echo "Step 9: SSL Certificate Setup"
read -p "Setup SSL certificate now? (y/N): " setup_ssl
if [ "$setup_ssl" == "y" ] || [ "$setup_ssl" == "Y" ]; then
    bash "$SCRIPT_DIR/setup-ssl.sh"
fi

# Step 10: Final checks
echo ""
echo "Step 10: Final checks..."
echo ""

# Check PM2
if pm2 list | grep -q "taaleem-emr.*online"; then
    echo "✅ PM2: Application is running"
else
    echo "❌ PM2: Application is not running"
fi

# Check NGINX
if sudo systemctl is-active --quiet nginx; then
    echo "✅ NGINX: Service is running"
else
    echo "❌ NGINX: Service is not running"
fi

# Check health endpoint
echo ""
echo "Testing health endpoint..."
if curl -f -s http://localhost:5005/api/health > /dev/null; then
    echo "✅ Application health check passed"
else
    echo "⚠️  Application health check failed (may need to wait a few seconds)"
fi

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Configure SSL certificate (if not done)"
echo "2. Update firewall rules to allow ports 80 and 443"
echo "3. Test the application: https://your-domain.com"
echo "4. Monitor logs:"
echo "   - PM2: pm2 logs taaleem-emr"
echo "   - NGINX: sudo tail -f /var/log/nginx/taaleem-emr-access.log"
echo ""
echo "For detailed documentation, see: deployment/README.md"

