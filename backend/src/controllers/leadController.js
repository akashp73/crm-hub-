import { PrismaClient } from '@prisma/client';
import csvtojson from 'csvtojson';

const prisma = new PrismaClient();

export const getLeads = async (req, res) => {
  try {
    const { status, source, scoreMin, scoreMax, assignedTo, search, page = 1, limit = 10 } = req.query;
    const institutionId = req.user.institutionId;
    const skip = (page - 1) * limit;

    const where = { institutionId };
    if (status) where.status = status;
    if (source) where.source = source;
    if (scoreMin || scoreMax) where.activityScore = {};
    if (scoreMin) where.activityScore.gte = parseInt(scoreMin);
    if (scoreMax) where.activityScore.lte = parseInt(scoreMax);
    if (assignedTo) where.assignedToId = assignedTo;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.lead.count({ where })
    ]);

    res.json({ leads, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

export const getLead = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.institutionId;

    const lead = await prisma.lead.findFirst({
      where: { id, institutionId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        activityLogs: { orderBy: { createdAt: 'desc' } },
        tasks: { orderBy: { dueAt: 'asc' } },
        notes: { include: { createdBy: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
};

export const createLead = async (req, res) => {
  try {
    const { name, email, phone, city, courseInterested, source } = req.body;
    const institutionId = req.user.institutionId;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required' });
    }

    const existingLead = await prisma.lead.findFirst({
      where: {
        institutionId,
        OR: [
          { email: email.toLowerCase() },
          { phone }
        ]
      }
    });

    if (existingLead) {
      return res.status(409).json({ error: 'Lead with this email or phone already exists' });
    }

    const lead = await prisma.lead.create({
      data: {
        institutionId,
        name,
        email: email.toLowerCase(),
        phone,
        city,
        courseInterested,
        source: source || 'OTHER'
      },
      include: { assignedTo: true }
    });

    res.status(201).json(lead);
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
};

export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.institutionId;
    const { name, email, phone, city, courseInterested, source, status } = req.body;

    const lead = await prisma.lead.findFirst({
      where: { id, institutionId }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email: email.toLowerCase() }),
        ...(phone && { phone }),
        ...(city && { city }),
        ...(courseInterested && { courseInterested }),
        ...(source && { source }),
        ...(status && { status })
      },
      include: { assignedTo: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
};

export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.institutionId;

    const lead = await prisma.lead.findFirst({
      where: { id, institutionId }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    await prisma.lead.delete({ where: { id } });
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
};

export const assignLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;
    const institutionId = req.user.institutionId;

    if (!assignedToId) {
      return res.status(400).json({ error: 'Assigned user ID is required' });
    }

    const lead = await prisma.lead.findFirst({
      where: { id, institutionId }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: { assignedToId },
      include: { assignedTo: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Assign lead error:', error);
    res.status(500).json({ error: 'Failed to assign lead' });
  }
};

export const bulkImport = async (req, res) => {
  try {
    const institutionId = req.user.institutionId;
    
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const jsonData = await csvtojson().fromString(csvData);

    const results = { success: 0, failed: 0, errors: [] };

    for (const row of jsonData) {
      try {
        const { name, email, phone, city, course_interested, source } = row;

        if (!name || !email || !phone) {
          results.failed++;
          results.errors.push(`Row skipped: Missing required fields`);
          continue;
        }

        const existingLead = await prisma.lead.findFirst({
          where: {
            institutionId,
            OR: [{ email: email.toLowerCase() }, { phone }]
          }
        });

        if (existingLead) {
          results.failed++;
          continue;
        }

        await prisma.lead.create({
          data: {
            institutionId,
            name,
            email: email.toLowerCase(),
            phone,
            city,
            courseInterested: course_interested,
            source: source || 'OTHER'
          }
        });

        results.success++;
      } catch (rowError) {
        results.failed++;
        results.errors.push(rowError.message);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to import leads' });
  }
};
