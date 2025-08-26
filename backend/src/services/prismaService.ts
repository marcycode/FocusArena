import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export const initializePrisma = async () => {
  try {
    prisma = new PrismaClient();
    
    // Test the connection
    await prisma.$connect();
    
    console.log('✅ Database connection established');
    
    // Set up connection event handlers (Prisma 5.0+ compatible)
    process.on('beforeExit', async () => {
      console.log('🔄 Database connection closing...');
      await prisma.$disconnect();
    });
    
    process.on('uncaughtException', async (e) => {
      console.error('❌ Uncaught exception:', e);
      await closePrisma();
      process.exit(1);
    });
    
    return prisma;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
};

export const getPrisma = () => {
  if (!prisma) {
    throw new Error('Prisma client not initialized. Call initializePrisma() first.');
  }
  return prisma;
};

export const closePrisma = async () => {
  if (prisma) {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await closePrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePrisma();
  process.exit(0);
});
