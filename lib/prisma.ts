import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma connection pooling configuration
// Connection pooling parameters should be set in DATABASE_URL:
// postgresql://user:password@host:port/database?connection_limit=20&pool_timeout=20
// For production, recommended settings:
// - connection_limit: 20-50 (based on server capacity and PM2 instances)
// - pool_timeout: 20 seconds
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Connection pooling is handled via DATABASE_URL parameters
    // Prisma automatically uses connection pooling when connection_limit is set in DATABASE_URL
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

