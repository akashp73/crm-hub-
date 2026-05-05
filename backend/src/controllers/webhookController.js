import { PrismaClient } from '@prisma/client';
import { updateLeadScore } from '../services/scoringService.js';
import { redisClient } from '../services/redisService.js';

const prisma = new PrismaClient();

export const recordActivity = async (req, res) => {
  try {
    const { leadId, activityType, idempotencyKey } = req.body;

    if (!leadId || !activityType || !idempotencyKey) {
      return res.status(400).json({ error: 'leadId, activityType, and idempotencyKey are required' });
    }

    const existingActivity = await redisClient.get(`idempotency:${idempotencyKey}`);
    if (existingActivity) {
      return res.json({ message: 'Activity already processed', skipped: true });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { institution: true }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const scoreRule = await prisma.scoreRule.findFirst({
      where: {
        institutionId: lead.institutionId,
        activityType
      }
    });

    if (!scoreRule) {
      return res.status(404).json({ error: 'Activity type not configured' });
    }

    await updateLeadScore(leadId, activityType, scoreRule.points, lead.institutionId, idempotencyKey);
    await redisClient.setEx(`idempotency:${idempotencyKey}`, 24 * 60 * 60, '1');

    res.json({ message: 'Activity recorded successfully' });
  } catch (error) {
    console.error('Record activity error:', error);
    res.status(500).json({ error: 'Failed to record activity' });
  }
};
