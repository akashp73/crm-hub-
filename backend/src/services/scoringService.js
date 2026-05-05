import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const updateLeadScore = async (leadId, activityType, points, institutionId, idempotencyKey) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) throw new Error('Lead not found');

    const newScore = Math.max(0, lead.activityScore + points);

    let statusUpdate = {};
    if (newScore > 80) {
      statusUpdate.status = 'QUALIFIED';
    }

    const [updatedLead, activityLog] = await Promise.all([
      prisma.lead.update({
        where: { id: leadId },
        data: {
          activityScore: newScore,
          lastActivityAt: new Date(),
          ...statusUpdate
        }
      }),
      prisma.activityLog.create({
        data: {
          leadId,
          institutionId,
          activityType,
          pointsAdded: points,
          description: `${activityType} recorded`,
          idempotencyKey
        }
      })
    ]);

    return { lead: updatedLead, activityLog };
  } catch (error) {
    console.error('Score update error:', error);
    throw error;
  }
};

export const decayScores = async (institutionId) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const leadsToDecay = await prisma.lead.findMany({
      where: {
        institutionId,
        lastActivityAt: { lt: sevenDaysAgo }
      }
    });

    for (const lead of leadsToDecay) {
      const decayedScore = Math.max(0, Math.floor(lead.activityScore * 0.9));
      const pointsLost = lead.activityScore - decayedScore;

      await Promise.all([
        prisma.lead.update({
          where: { id: lead.id },
          data: { activityScore: decayedScore }
        }),
        prisma.activityLog.create({
          data: {
            leadId: lead.id,
            institutionId,
            activityType: 'score_decay',
            pointsAdded: -pointsLost,
            description: `Score decay: ${lead.activityScore} -> ${decayedScore}`
          }
        })
      ]);
    }

    console.log(`✅ Score decay completed for ${leadsToDecay.length} leads`);
    return leadsToDecay.length;
  } catch (error) {
    console.error('Score decay error:', error);
    throw error;
  }
};
