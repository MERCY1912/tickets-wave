import { Router, Response } from 'express';
import { prisma } from '../utils/db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { createReminderSchema, updateReminderSchema } from '../utils/validation.js';

export const reminderRoutes = Router();

// GET /api/reminders - List all reminders
reminderRoutes.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const triggered = req.query.triggered;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

  const where: any = { userId: req.userId! };
  if (triggered !== undefined) {
    where.triggered = triggered === 'true';
  }

  const [reminders, total] = await Promise.all([
    prisma.reminder.findMany({
      where,
      orderBy: { remindAt: 'asc' },
      take: limit,
      skip: offset,
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
    }),
    prisma.reminder.count({ where }),
  ]);

  // Parse tags for tickets
  const remindersWithParsedTags = reminders.map((reminder: any) => ({
    ...reminder,
    ticket: reminder.ticket ? {
      ...reminder.ticket,
      tags: JSON.parse(reminder.ticket.tags),
    } : null,
  }));

  res.json({
    reminders: remindersWithParsedTags,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
});

// GET /api/reminders/due - Get due (not triggered) reminders
reminderRoutes.get('/due', authenticateToken, async (req: AuthRequest, res: Response) => {
  const now = new Date();

  const reminders = await prisma.reminder.findMany({
    where: {
      userId: req.userId!,
      triggered: false,
      remindAt: { lte: now },
    },
    orderBy: { remindAt: 'asc' },
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
  const remindersWithParsedTags = reminders.map((reminder: any) => ({
    ...reminder,
    ticket: reminder.ticket ? {
      ...reminder.ticket,
      tags: JSON.parse(reminder.ticket.tags),
    } : null,
  }));

  res.json(remindersWithParsedTags);
});

// GET /api/reminders/upcoming - Get upcoming reminders (next 7 days)
reminderRoutes.get('/upcoming', authenticateToken, async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const reminders = await prisma.reminder.findMany({
    where: {
      userId: req.userId!,
      triggered: false,
      remindAt: {
        gte: now,
        lte: weekFromNow,
      },
    },
    orderBy: { remindAt: 'asc' },
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
  const remindersWithParsedTags = reminders.map((reminder: any) => ({
    ...reminder,
    ticket: reminder.ticket ? {
      ...reminder.ticket,
      tags: JSON.parse(reminder.ticket.tags),
    } : null,
  }));

  res.json(remindersWithParsedTags);
});

// GET /api/reminders/:id - Get single reminder
reminderRoutes.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const reminder = await prisma.reminder.findFirst({
    where: { id: req.params.id, userId: req.userId! },
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

  if (!reminder) {
    res.status(404).json({ error: 'Reminder not found' });
    return;
  }

  res.json({
    ...reminder,
    ticket: reminder.ticket ? {
      ...reminder.ticket,
      tags: JSON.parse(reminder.ticket.tags),
    } : null,
  });
});

// POST /api/reminders - Create reminder
reminderRoutes.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const data = createReminderSchema.parse(req.body);
  const userId = req.userId!;

  // If ticketId is provided, verify ticket exists and belongs to user
  if (data.ticketId) {
    const ticket = await prisma.ticket.findFirst({
      where: { id: data.ticketId, userId },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
  }

  const reminder = await prisma.reminder.create({
    data: {
      userId,
      ticketId: data.ticketId,
      remindAt: new Date(data.remindAt),
      message: data.message,
      repeat: data.repeat || 'none',
      autoType: data.autoType,
    },
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

  res.status(201).json({
    ...reminder,
    ticket: reminder.ticket ? {
      ...reminder.ticket,
      tags: JSON.parse(reminder.ticket.tags),
    } : null,
  });
});

// PUT /api/reminders/:id - Update reminder
reminderRoutes.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const data = updateReminderSchema.parse(req.body);
  const userId = req.userId!;

  const existing = await prisma.reminder.findFirst({
    where: { id: req.params.id, userId },
  });

  if (!existing) {
    res.status(404).json({ error: 'Reminder not found' });
    return;
  }

  const updateData: any = {};
  if (data.remindAt !== undefined) updateData.remindAt = new Date(data.remindAt);
  if (data.message !== undefined) updateData.message = data.message;
  if (data.repeat !== undefined) updateData.repeat = data.repeat;
  if (data.triggered !== undefined) updateData.triggered = data.triggered;

  const reminder = await prisma.reminder.update({
    where: { id: req.params.id },
    data: updateData,
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

  res.json({
    ...reminder,
    ticket: reminder.ticket ? {
      ...reminder.ticket,
      tags: JSON.parse(reminder.ticket.tags),
    } : null,
  });
});

// POST /api/reminders/:id/trigger - Mark reminder as triggered
reminderRoutes.post('/:id/trigger', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const existing = await prisma.reminder.findFirst({
    where: { id: req.params.id, userId },
  });

  if (!existing) {
    res.status(404).json({ error: 'Reminder not found' });
    return;
  }

  const reminder = await prisma.reminder.update({
    where: { id: req.params.id },
    data: { triggered: true },
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

  // If it's a repeating reminder, create the next one
  if (reminder.repeat && reminder.repeat !== 'none') {
    const nextRemindAt = calculateNextReminderDate(reminder.remindAt, reminder.repeat);

    await prisma.reminder.create({
      data: {
        userId,
        ticketId: reminder.ticketId,
        remindAt: nextRemindAt,
        message: reminder.message,
        repeat: reminder.repeat,
        autoType: reminder.autoType,
      },
    });
  }

  res.json({
    ...reminder,
    ticket: reminder.ticket ? {
      ...reminder.ticket,
      tags: JSON.parse(reminder.ticket.tags),
    } : null,
  });
});

// DELETE /api/reminders/:id - Delete reminder
reminderRoutes.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const existing = await prisma.reminder.findFirst({
    where: { id: req.params.id, userId },
  });

  if (!existing) {
    res.status(404).json({ error: 'Reminder not found' });
    return;
  }

  await prisma.reminder.delete({
    where: { id: req.params.id },
  });

  res.json({ success: true, message: 'Reminder deleted' });
});

// POST /api/reminders/auto/generate - Generate automatic reminders based on rules
reminderRoutes.post('/auto/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  const settings = await prisma.settings.findFirst({
    where: { userId },
  });

  if (!settings) {
    res.status(400).json({ error: 'Settings not found' });
    return;
  }

  const now = new Date();
  const createdReminders = [];

  // Stagnant tickets (no activity for X days)
  const stagnantDays = settings.reminderStagnantDays;
  const stagnantDate = new Date(Date.now() - stagnantDays * 24 * 60 * 60 * 1000);

  const stagnantTickets = await prisma.ticket.findMany({
    where: {
      userId,
      status: { in: ['NEW', 'IN_PROGRESS', 'BLOCKED'] },
      lastActivityAt: { lte: stagnantDate },
    },
  });

  for (const ticket of stagnantTickets) {
    const existing = await prisma.reminder.findFirst({
      where: {
        userId,
        ticketId: ticket.id,
        autoType: 'stagnant',
        triggered: false,
      },
    });

    if (!existing) {
      const reminder = await prisma.reminder.create({
        data: {
          userId,
          ticketId: ticket.id,
          remindAt: now,
          message: `Ticket "${ticket.title}" has no activity for ${stagnantDays} days`,
          autoType: 'stagnant',
        },
      });
      createdReminders.push(reminder);
    }
  }

  // Waiting client tickets (status unchanged for X days)
  const waitingDays = settings.reminderWaitingClientDays;
  const waitingDate = new Date(Date.now() - waitingDays * 24 * 60 * 60 * 1000);

  const waitingTickets = await prisma.ticket.findMany({
    where: {
      userId,
      status: 'WAITING_CLIENT',
      lastActivityAt: { lte: waitingDate },
    },
  });

  for (const ticket of waitingTickets) {
    const existing = await prisma.reminder.findFirst({
      where: {
        userId,
        ticketId: ticket.id,
        autoType: 'waiting_client',
        triggered: false,
      },
    });

    if (!existing) {
      const reminder = await prisma.reminder.create({
        data: {
          userId,
          ticketId: ticket.id,
          remindAt: now,
          message: `Ticket "${ticket.title}" has been waiting on client for ${waitingDays} days`,
          autoType: 'waiting_client',
        },
      });
      createdReminders.push(reminder);
    }
  }

  // High priority tickets with no activity
  const highPriorityDays = settings.reminderHighPriorityDays;
  const highPriorityDate = new Date(Date.now() - highPriorityDays * 24 * 60 * 60 * 1000);

  const highPriorityTickets = await prisma.ticket.findMany({
    where: {
      userId,
      priority: { in: ['HIGH', 'CRITICAL'] },
      status: { notIn: ['DONE', 'FROZEN'] },
      lastActivityAt: { lte: highPriorityDate },
    },
  });

  for (const ticket of highPriorityTickets) {
    const existing = await prisma.reminder.findFirst({
      where: {
        userId,
        ticketId: ticket.id,
        autoType: 'high_priority',
        triggered: false,
      },
    });

    if (!existing) {
      const reminder = await prisma.reminder.create({
        data: {
          userId,
          ticketId: ticket.id,
          remindAt: now,
          message: `High priority ticket "${ticket.title}" has no activity for ${highPriorityDays} days`,
          autoType: 'high_priority',
        },
      });
      createdReminders.push(reminder);
    }
  }

  res.json({
    created: createdReminders.length,
    reminders: createdReminders,
  });
});

// Helper function to calculate next reminder date
function calculateNextReminderDate(from: Date, repeat: string): Date {
  const date = new Date(from);

  switch (repeat) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
  }

  return date;
}
