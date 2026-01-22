import { Router, Response } from 'express';
import { prisma } from '../utils/db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import {
  createTicketSchema,
  updateTicketSchema,
  updateTicketStatusSchema,
  ticketQuerySchema,
} from '../utils/validation.js';

export const ticketRoutes = Router();

// GET /api/tickets - List tickets with filters
ticketRoutes.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const query = ticketQuerySchema.parse(req.query);

  const where: any = { userId: req.userId! };

  if (query.status) {
    where.status = query.status;
  }

  if (query.priority) {
    where.priority = query.priority;
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.tag) {
    where.tags = { contains: query.tag };
  }

  const sortBy = query.sortBy || 'lastActivityAt';
  const sortOrder = query.sortOrder || 'desc';
  const limit = query.limit || 50;
  const offset = query.offset || 0;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset,
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        reminders: {
          where: { triggered: false },
          orderBy: { remindAt: 'asc' },
          take: 1,
        },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  // Parse tags for each ticket
  const ticketsWithParsedTags = tickets.map((ticket: any) => ({
    ...ticket,
    tags: JSON.parse(ticket.tags),
  }));

  res.json({
    tickets: ticketsWithParsedTags,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
});

// IMPORTANT: Specific routes MUST come before /:id route
// Otherwise Express will match "debug", "stats", "seed" as ticket IDs

// GET /api/tickets/stats/dashboard - Dashboard statistics
ticketRoutes.get('/stats/dashboard', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const [
    totalTickets,
    statusCounts,
    priorityCounts,
    recentTickets,
    stagnantTickets,
  ] = await Promise.all([
    prisma.ticket.count({ where: { userId } }),
    prisma.ticket.groupBy({
      by: ['status'],
      _count: true,
      where: { userId },
    }),
    prisma.ticket.groupBy({
      by: ['priority'],
      _count: true,
      where: { userId },
    }),
    prisma.ticket.findMany({
      where: {
        userId,
        status: { not: 'DONE' },
      },
      orderBy: { lastActivityAt: 'desc' },
      take: 5,
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
    // Stagnant tickets (no activity for 5 days)
    prisma.ticket.findMany({
      where: {
        userId,
        status: { in: ['NEW', 'IN_PROGRESS', 'BLOCKED'] },
        lastActivityAt: {
          lte: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      },
      take: 10,
    }),
  ]);

  res.json({
    total: totalTickets,
    byStatus: statusCounts.reduce((acc: any, item: any) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>),
    byPriority: priorityCounts.reduce((acc: any, item: any) => {
      acc[item.priority] = item._count;
      return acc;
    }, {} as Record<string, number>),
    recentTickets: recentTickets.map((t: any) => ({
      ...t,
      tags: JSON.parse(t.tags),
    })),
    stagnantCount: stagnantTickets.length,
  });
});

// POST /api/tickets/seed - Create sample test tickets
ticketRoutes.post('/seed', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

  const sampleTickets = [
    {
      title: 'Login authentication failing for admin users',
      description: 'Multiple reports of admin panel login failures. Users see "Invalid credentials" even with correct password.',
      status: 'BLOCKED' as const,
      priority: 'CRITICAL' as const,
      tags: JSON.stringify(['auth', 'urgent', 'admin']),
      userId,
      createdAt: twoDaysAgo,
      lastActivityAt: twoDaysAgo,
    },
    {
      title: 'Payment gateway timeout during checkout',
      description: 'Customers report checkout failing with timeout errors. Affecting ~20 transactions per day.',
      status: 'IN_PROGRESS' as const,
      priority: 'CRITICAL' as const,
      tags: JSON.stringify(['payment', 'revenue', 'checkout']),
      userId,
      createdAt: fiveDaysAgo,
      lastActivityAt: fiveDaysAgo,
    },
    {
      title: 'Dashboard reports showing incorrect data',
      description: 'Exported CSV reports have mismatched numbers compared to dashboard view. Data accuracy concern.',
      status: 'NEW' as const,
      priority: 'HIGH' as const,
      tags: JSON.stringify(['reports', 'data-quality']),
      userId,
      createdAt: now,
      lastActivityAt: now,
    },
    {
      title: 'User onboarding flow crashes on mobile',
      description: 'App crashes during signup on iOS Safari. 15+ users affected last week.',
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      tags: JSON.stringify(['mobile', 'ios', 'crash']),
      userId,
      createdAt: eightDaysAgo,
      lastActivityAt: eightDaysAgo,
    },
    {
      title: 'Email notifications delayed by 2-3 hours',
      description: 'Notification system lag causing poor user experience. Not urgent but needs attention.',
      status: 'WAITING_CLIENT' as const,
      priority: 'MEDIUM' as const,
      tags: JSON.stringify(['email', 'notifications']),
      userId,
      createdAt: fiveDaysAgo,
      lastActivityAt: fiveDaysAgo,
    },
    {
      title: 'Search function not returning recent tickets',
      description: 'Search index appears to be out of sync. Users can\'t find tickets from last 2 days.',
      status: 'NEW' as const,
      priority: 'LOW' as const,
      tags: JSON.stringify(['search', 'bug']),
      userId,
      createdAt: now,
      lastActivityAt: now,
    },
  ];

  const created = await Promise.all(sampleTickets.map(async (data) => {
    const ticket = await prisma.ticket.create({
      data,
    });

    // Create initial activity
    await prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        userId,
        type: 'STATUS_CHANGE',
        content: `Ticket created with status: ${data.status}`,
      },
    });

    return {
      ...ticket,
      tags: JSON.parse(ticket.tags),
    };
  }));

  console.log('[Seed] Created sample tickets:', created.length);

  res.json({
    success: true,
    count: created.length,
    tickets: created,
  });
});

// GET /api/tickets/debug - Debug endpoint to check DB state
ticketRoutes.get('/debug', authenticateToken, async (req: AuthRequest, res: Response) => {
  const tickets = await prisma.ticket.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  res.json({
    totalTickets: await prisma.ticket.count({ where: { userId: req.userId! } }),
    recentTickets: tickets.map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      tags: JSON.parse(t.tags),
      createdAt: t.createdAt,
      lastActivityAt: t.lastActivityAt,
    })),
  });
});

// GET /api/tickets/:id - Get single ticket
ticketRoutes.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const ticket = await prisma.ticket.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    include: {
      activities: {
        orderBy: { createdAt: 'desc' },
      },
      reminders: {
        orderBy: { remindAt: 'asc' },
      },
    },
  });

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  res.json({
    ...ticket,
    tags: JSON.parse(ticket.tags),
  });
});

// POST /api/tickets - Create ticket
ticketRoutes.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const data = createTicketSchema.parse(req.body);
  const userId = req.userId!;

  const tags = data.tags || [];
  const ticket = await prisma.ticket.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status || 'NEW',
      priority: data.priority || 'MEDIUM',
      tags: JSON.stringify(tags),
      userId,
    },
    include: {
      activities: true,
      reminders: true,
    },
  });

  // Create initial activity
  await prisma.ticketActivity.create({
    data: {
      ticketId: ticket.id,
      userId,
      type: 'STATUS_CHANGE',
      content: `Ticket created with status: ${ticket.status}`,
    },
  });

  res.status(201).json({
    ...ticket,
    tags: JSON.parse(ticket.tags),
  });
});

// PUT /api/tickets/:id - Update ticket
ticketRoutes.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const data = updateTicketSchema.parse(req.body);
  const userId = req.userId!;

  const existing = await prisma.ticket.findFirst({
    where: { id: req.params.id, userId },
  });

  if (!existing) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const updateData: any = {};
  const activitiesToCreate: Array<{ type: string; content: string }> = [];

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.aiNotes !== undefined) updateData.aiNotes = data.aiNotes;

  if (data.status !== undefined && data.status !== existing.status) {
    updateData.status = data.status;
    activitiesToCreate.push({
      type: 'STATUS_CHANGE',
      content: `Status changed from ${existing.status} to ${data.status}`,
    });
  }

  if (data.priority !== undefined && data.priority !== existing.priority) {
    updateData.priority = data.priority;
    activitiesToCreate.push({
      type: 'PRIORITY_CHANGE',
      content: `Priority changed from ${existing.priority} to ${data.priority}`,
    });
  }

  if (data.tags !== undefined) {
    const existingTags = JSON.parse(existing.tags);
    if (JSON.stringify(existingTags.sort()) !== JSON.stringify(data.tags.sort())) {
      updateData.tags = JSON.stringify(data.tags);
      activitiesToCreate.push({
        type: 'TAG_CHANGE',
        content: `Tags updated: ${data.tags.join(', ')}`,
      });
    }
  }

  updateData.lastActivityAt = new Date();

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      activities: true,
      reminders: true,
    },
  });

  // Create activities for changes
  if (activitiesToCreate.length > 0) {
    await prisma.ticketActivity.createMany({
      data: activitiesToCreate.map(a => ({
        ticketId: ticket.id,
        userId,
        type: a.type as any,
        content: a.content,
      })),
    });
  }

  res.json({
    ...ticket,
    tags: JSON.parse(ticket.tags),
  });
});

// PATCH /api/tickets/:id/status - Update ticket status
ticketRoutes.patch('/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  const data = updateTicketStatusSchema.parse(req.body);
  const userId = req.userId!;

  const existing = await prisma.ticket.findFirst({
    where: { id: req.params.id, userId },
  });

  if (!existing) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: {
      status: data.status,
      lastActivityAt: new Date(),
    },
  });

  // Create activity
  await prisma.ticketActivity.create({
    data: {
      ticketId: ticket.id,
      userId,
      type: 'STATUS_CHANGE',
      content: `Status changed from ${existing.status} to ${data.status}`,
    },
  });

  res.json({
    ...ticket,
    tags: JSON.parse(ticket.tags),
  });
});

// DELETE /api/tickets/:id - Delete ticket
ticketRoutes.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const existing = await prisma.ticket.findFirst({
    where: { id: req.params.id, userId },
  });

  if (!existing) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  await prisma.ticket.delete({
    where: { id: req.params.id },
  });

  res.json({ success: true, message: 'Ticket deleted' });
});
