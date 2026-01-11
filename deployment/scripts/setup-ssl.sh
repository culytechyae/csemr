#!/bin/bash
# SSL Certificate Setup Script
# Supports Let's Encrypt and manual certificate installation

set -e

echo "=========================================="
echo "SSL Certificate Setup"
echo "Taaleem Clinic Management System"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Create SSL directory
SSL_DIR="/etc/nginx/ssl"
mkdir -p $SSL_DIR

echo "Choose SSL certificate option:"
echo "1. Let's Encrypt (Recommended - Free, Auto-renewal)"
echo "2. Manual certificate installation"
read -p "Enter choice [1-2]: " choice

case $choice in
    1)
        echo ""
        echo "Setting up Let's Encrypt certificate..."
        
        # Check if certbot is installed
        if ! command -v certbot &> /dev/null; then
            echo "Installing certbot..."
            
            if [ -f /etc/os-release ]; then
                . /etc/os-release
                OS=$ID
            fi
            
            if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
                apt-get update
                apt-get install -y certbot python3-certbot-nginx
            elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
                yum install -y certbot python3-certbot-nginx
            else
                echo "Please install certbot manually"
                exit 1
            fi
        fi
        
        read -p "Enter your domain name: " domain
        read -p "Enter email for certificate notifications: " email
        
        echo ""
        echo "Obtaining certificate for $domain..."
        certbot --nginx -d $domain -d www.$domain --email $email --agree-tos --non-interactive
        
        echo ""
        echo "✅ Let's Encrypt certificate installed!"
        echo ""
        echo "Certificate will auto-renew. To test renewal:"
        echo "  certbot renew --dry-run"
        ;;
        
    2)
        echo ""
        echo "Manual certificate installation"
        echo ""
        read -p "Enter path to certificate file (.crt): " cert_path
        read -p "Enter path to private key file (.key): " key_path
        read -p "Enter path to CA chain file (optional, press Enter to skip): " chain_path
        
        if [ ! -f "$cert_path" ]; then
            echo "❌ Certificate file not found: $cert_path"
            exit 1
        fi
        
        if [ ! -f "$key_path" ]; then
            echo "❌ Private key file not found: $key_path"
            exit 1
        fi
        
        # Copy certificate files
        cp "$cert_path" "$SSL_DIR/taaleem-emr.crt"
        cp "$key_path" "$SSL_DIR/taaleem-emr.key"
        
        # Set permissions
        chmod 644 "$SSL_DIR/taaleem-emr.crt"
        chmod 600 "$SSL_DIR/taaleem-emr.key"
        
        if [ -n "$chain_path" ] && [ -f "$chain_path" ]; then
            cp "$chain_path" "$SSL_DIR/ca-chain.crt"
            chmod 644 "$SSL_DIR/ca-chain.crt"
            echo "✅ CA chain installed"
        fi
        
        echo ""
        echo "✅ Certificate files installed to $SSL_DIR"
        echo ""
        echo "Update NGINX configuration to use:"
        echo "  ssl_certificate $SSL_DIR/taaleem-emr.crt;"
        echo "  ssl_certificate_key $SSL_DIR/taaleem-emr.key;"
        if [ -f "$SSL_DIR/ca-chain.crt" ]; then
            echo "  ssl_trusted_certificate $SSL_DIR/ca-chain.crt;"
        fi
        ;;
        
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "Next steps:"
echo "1. Update NGINX configuration with certificate paths"
echo "2. Test NGINX configuration: sudo nginx -t"
echo "3. Reload NGINX: sudo systemctl reload nginx"

