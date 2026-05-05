import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMyTasks = async (req, res) => {
  try {
    const userId = req.user.userId;

    const tasks = await prisma.task.findMany({
      where: {
        assignedToId: userId
      },
      include: {
        lead: { select: { id: true, name: true, email: true } }
      },
      orderBy: { dueAt: 'asc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const createTask = async (req, res) => {
  try {
    const { leadId, assignedToId, title, dueAt } = req.body;

    if (!leadId || !assignedToId || !title || !dueAt) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const task = await prisma.task.create({
      data: {
        leadId,
        assignedToId,
        title,
        dueAt: new Date(dueAt)
      },
      include: { lead: true, assignedTo: true }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.assignedToId !== userId) {
      return res.status(403).json({ error: 'Not authorized to complete this task' });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: { isCompleted: true, updatedAt: new Date() },
      include: { lead: true, assignedTo: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
};
