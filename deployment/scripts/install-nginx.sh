#!/bin/bash
# NGINX Installation Script for Taaleem Clinic Management System
# Compatible with Ubuntu/Debian and CentOS/RHEL

set -e

echo "=========================================="
echo "NGINX Installation Script"
echo "Taaleem Clinic Management System"
echo "=========================================="
echo ""

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    echo "Cannot detect OS. Exiting."
    exit 1
fi

echo "Detected OS: $OS $VER"
echo ""

# Install NGINX based on OS
if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
    echo "Installing NGINX for Ubuntu/Debian..."
    sudo apt-get update
    sudo apt-get install -y nginx
    
    # Enable and start NGINX
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ] || [ "$OS" == "fedora" ]; then
    echo "Installing NGINX for CentOS/RHEL/Fedora..."
    
    if [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
        sudo yum install -y epel-release
        sudo yum install -y nginx
    else
        sudo dnf install -y nginx
    fi
    
    # Enable and start NGINX
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
else
    echo "Unsupported OS: $OS"
    echo "Please install NGINX manually."
    exit 1
fi

# Verify installation
if command -v nginx &> /dev/null; then
    NGINX_VERSION=$(nginx -v 2>&1 | awk -F/ '{print $2}')
    echo ""
    echo "✅ NGINX installed successfully!"
    echo "   Version: $NGINX_VERSION"
    echo ""
    
    # Check NGINX status
    if sudo systemctl is-active --quiet nginx; then
        echo "✅ NGINX is running"
    else
        echo "⚠️  NGINX is not running. Starting..."
        sudo systemctl start nginx
    fi
    
    echo ""
    echo "Next steps:"
    echo "1. Copy NGINX configuration:"
    echo "   sudo cp deployment/nginx/nginx.conf /etc/nginx/sites-available/taaleem-emr"
    echo ""
    echo "2. Create symbolic link:"
    echo "   sudo ln -s /etc/nginx/sites-available/taaleem-emr /etc/nginx/sites-enabled/"
    echo ""
    echo "3. Test configuration:"
    echo "   sudo nginx -t"
    echo ""
    echo "4. Reload NGINX:"
    echo "   sudo systemctl reload nginx"
    echo ""
else
    echo "❌ NGINX installation failed"
    exit 1
fi

