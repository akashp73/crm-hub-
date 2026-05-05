import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getScoreRules = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;

    const rules = await prisma.scoreRule.findMany({
      where: { institutionId },
      orderBy: { activityType: 'asc' }
    });

    res.json(rules);
  } catch (error) {
    console.error('Get score rules error:', error);
    res.status(500).json({ error: 'Failed to fetch score rules' });
  }
};

export const createScoreRule = async (req, res) => {
  try {
    const { activityType, points } = req.body;
    const institutionId = req.user.institutionId;

    if (!activityType || points === undefined) {
      return res.status(400).json({ error: 'Activity type and points are required' });
    }

    const rule = await prisma.scoreRule.create({
      data: {
        institutionId,
        activityType,
        points: parseInt(points)
      }
    });

    res.status(201).json(rule);
  } catch (error) {
    console.error('Create score rule error:', error);
    res.status(500).json({ error: 'Failed to create score rule' });
  }
};

export const updateScoreRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { points } = req.body;
    const institutionId = req.user.institutionId;

    if (points === undefined) {
      return res.status(400).json({ error: 'Points value is required' });
    }

    const rule = await prisma.scoreRule.findFirst({
      where: { id, institutionId }
    });

    if (!rule) {
      return res.status(404).json({ error: 'Score rule not found' });
    }

    const updated = await prisma.scoreRule.update({
      where: { id },
      data: { points: parseInt(points) }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update score rule error:', error);
    res.status(500).json({ error: 'Failed to update score rule' });
  }
};
