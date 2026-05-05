import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getStats = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalLeads, hotLeads, tasksDueToday, enrolledThisMonth, leadsByStatus] = await Promise.all([
      prisma.lead.count({ where: { institutionId } }),
      prisma.lead.count({ where: { institutionId, activityScore: { gte: 80 } } }),
      prisma.task.count({
        where: {
          lead: { institutionId },
          dueAt: { gte: todayStart, lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) },
          isCompleted: false
        }
      }),
      prisma.lead.count({
        where: {
          institutionId,
          status: 'ENROLLED',
          createdAt: { gte: thisMonthStart }
        }
      }),
      prisma.lead.groupBy({
        by: ['status'],
        where: { institutionId },
        _count: true
      })
    ]);

    const statusData = {};
    leadsByStatus.forEach(item => {
      statusData[item.status] = item._count;
    });

    res.json({
      totalLeads,
      hotLeads,
      tasksDueToday,
      enrolledThisMonth,
      leadsByStatus: statusData
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getHotLeads = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    const { limit = 10 } = req.query;

    const hotLeads = await prisma.lead.findMany({
      where: {
        institutionId,
        activityScore: { gte: 80 }
      },
      include: { assignedTo: { select: { name: true } } },
      orderBy: { activityScore: 'desc' },
      take: parseInt(limit)
    });

    res.json(hotLeads);
  } catch (error) {
    console.error('Get hot leads error:', error);
    res.status(500).json({ error: 'Failed to fetch hot leads' });
  }
};
