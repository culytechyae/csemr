const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🚀 Setting up School Clinic EMR System for Production...\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.error('❌ .env file not found. Please create it from .env.example');
  process.exit(1);
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env file');
  process.exit(1);
}

try {
  console.log('📦 Installing dependencies...');
  execSync('npm install --production=false', { stdio: 'inherit' });

  console.log('\n🔧 Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('\n🗄️  Running database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });

  console.log('\n🌱 Seeding initial data...');
  execSync('npm run db:seed', { stdio: 'inherit' });

  console.log('\n✅ Production setup complete!');
  console.log('\nNext steps:');
  console.log('1. Update JWT_SECRET in .env with a strong random string');
  console.log('   (Run: node scripts/generate-jwt-secret.js)');
  console.log('2. Update MALAFFI_API_KEY in .env with your production API key');
  console.log('3. Run: npm run build');
  console.log('4. Run: npm start');
} catch (error) {
  console.error('\n❌ Setup failed:', error.message);
  process.exit(1);
}

