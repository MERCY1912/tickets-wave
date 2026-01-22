import { Router, Response } from 'express';
import { prisma } from '../utils/db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createActivitySchema } from '../utils/validation.js';

export const activityRoutes = Router();

// GET /api/activities - List all activities (with optional filtering)
activityRoutes.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const ticketId = req.query.ticketId as string;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

  const where: any = { userId: req.userId! };
  if (ticketId) {
    where.ticketId = ticketId;
  }

  const [activities, total] = await Promise.all([
    prisma.ticketActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        ticket: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    }),
    prisma.ticketActivity.count({ where }),
  ]);

  res.json({
    activities,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
});

// GET /api/activities/:id - Get single activity
activityRoutes.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const activity = await prisma.ticketActivity.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    include: {
      ticket: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });

  if (!activity) {
    res.status(404).json({ error: 'Activity not found' });
    return;
  }

  res.json(activity);
});

// GET /api/activities/tickets/:ticketId - Get activities for a specific ticket
activityRoutes.get('/tickets/:ticketId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const ticketId = req.params.ticketId;
  const userId = req.userId!;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

  // Verify ticket exists and belongs to user
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, userId },
  });

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const [activities, total] = await Promise.all([
    prisma.ticketActivity.findMany({
      where: { ticketId, userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.ticketActivity.count({ where: { ticketId, userId } }),
  ]);

  res.json({
    activities,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
});

// POST /api/activities/tickets/:ticketId - Create activity for a ticket
activityRoutes.post('/tickets/:ticketId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const ticketId = req.params.ticketId;
  const userId = req.userId!;
  const data = createActivitySchema.parse(req.body);

  // Verify ticket exists and belongs to user
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, userId },
  });

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const activity = await prisma.ticketActivity.create({
    data: {
      ticketId,
      userId,
      type: data.type,
      content: data.content,
    },
  });

  // Update ticket's last activity timestamp
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { lastActivityAt: new Date() },
  });

  res.status(201).json(activity);
});

// DELETE /api/activities/:id - Delete activity
activityRoutes.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const existing = await prisma.ticketActivity.findFirst({
    where: { id: req.params.id, userId },
  });

  if (!existing) {
    res.status(404).json({ error: 'Activity not found' });
    return;
  }

  await prisma.ticketActivity.delete({
    where: { id: req.params.id },
  });

  res.json({ success: true, message: 'Activity deleted' });
});

// GET /api/activities/recent - Get recent activities across all tickets
activityRoutes.get('/recent/all', authenticateToken, async (req: AuthRequest, res: Response) => {
  const activities = await prisma.ticketActivity.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      ticket: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          tags: true,
        },
      },
    },
  });

  // Parse tags for tickets
  const activitiesWithParsedTags = activities.map((activity: any) => ({
    ...activity,
    ticket: {
      ...activity.ticket,
      tags: JSON.parse(activity.ticket.tags),
    },
  }));

  res.json(activitiesWithParsedTags);
});
