#!/bin/bash
# PM2 Installation Script for Taaleem Clinic Management System

set -e

echo "=========================================="
echo "PM2 Installation Script"
echo "Taaleem Clinic Management System"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 20+ first."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "Detected Node.js: $NODE_VERSION"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

echo "Installing PM2 globally..."
sudo npm install -g pm2

echo ""
echo "Installing PM2 log rotation module..."
pm2 install pm2-logrotate

echo ""
echo "Configuring PM2 log rotation..."
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss

# Verify installation
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 -v)
    echo ""
    echo "✅ PM2 installed successfully!"
    echo "   Version: $PM2_VERSION"
    echo ""
    
    echo "Next steps:"
    echo "1. Copy PM2 configuration:"
    echo "   cp deployment/pm2/ecosystem.config.js ./"
    echo ""
    echo "2. Start application:"
    echo "   pm2 start ecosystem.config.js"
    echo ""
    echo "3. Save PM2 configuration:"
    echo "   pm2 save"
    echo ""
    echo "4. Setup PM2 to start on boot:"
    echo "   pm2 startup"
    echo "   (Follow the instructions shown)"
    echo ""
else
    echo "❌ PM2 installation failed"
    exit 1
fi

