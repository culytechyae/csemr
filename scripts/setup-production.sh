#!/bin/bash

# Production Setup Script for School Clinic EMR System
# This script sets up the production environment

set -e

echo "🚀 Setting up School Clinic EMR System for Production..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it from .env.example"
    exit 1
fi

# Load environment variables
source .env

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set in .env file"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install --production=false

echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "🗄️  Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding initial data..."
npm run db:seed

echo "✅ Production setup complete!"
echo ""
echo "Next steps:"
echo "1. Update JWT_SECRET in .env with a strong random string"
echo "2. Update MALAFFI_API_KEY in .env with your production API key"
echo "3. Run 'npm run build' to build the application"
echo "4. Run 'npm start' to start the production server"

