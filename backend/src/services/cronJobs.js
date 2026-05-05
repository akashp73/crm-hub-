import cron from 'node-cron';
import { decayScores } from './scoringService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const startCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running score decay job...');
    try {
      const institutions = await prisma.institution.findMany();
      for (const institution of institutions) {
        await decayScores(institution.id);
      }
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });

  console.log('✅ Cron jobs scheduled');
};
