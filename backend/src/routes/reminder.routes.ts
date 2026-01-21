import { Router, Request, Response } from 'express';
import { prisma } from '../utils/db.js';
import { createReminderSchema, updateReminderSchema } from '../utils/validation.js';

export const reminderRoutes = Router();

// GET /api/reminders - List all reminders
reminderRoutes.get('/', async (req: Request, res: Response) => {
  const triggered = req.query.triggered;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

  const where: any = {};
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
  const remindersWithParsedTags = reminders.map(reminder => ({
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
reminderRoutes.get('/due', async (_req: Request, res: Response) => {
  const now = new Date();

  const reminders = await prisma.reminder.findMany({
    where: {
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
  const remindersWithParsedTags = reminders.map(reminder => ({
    ...reminder,
    ticket: reminder.ticket ? {
      ...reminder.ticket,
      tags: JSON.parse(reminder.ticket.tags),
    } : null,
  }));

  res.json(remindersWithParsedTags);
});

// GET /api/reminders/upcoming - Get upcoming reminders (next 7 days)
reminderRoutes.get('/upcoming', async (_req: Request, res: Response) => {
  const now = new Date();
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const reminders = await prisma.reminder.findMany({
    where: {
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
  const remindersWithParsedTags = reminders.map(reminder => ({
    ...reminder,
    ticket: reminder.ticket ? {
      ...reminder.ticket,
      tags: JSON.parse(reminder.ticket.tags),
    } : null,
  }));

  res.json(remindersWithParsedTags);
});

// GET /api/reminders/:id - Get single reminder
reminderRoutes.get('/:id', async (req: Request, res: Response) => {
  const reminder = await prisma.reminder.findUnique({
    where: { id: req.params.id },
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
reminderRoutes.post('/', async (req: Request, res: Response) => {
  const data = createReminderSchema.parse(req.body);

  // If ticketId is provided, verify ticket exists
  if (data.ticketId) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: data.ticketId },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
  }

  const reminder = await prisma.reminder.create({
    data: {
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
reminderRoutes.put('/:id', async (req: Request, res: Response) => {
  const data = updateReminderSchema.parse(req.body);

  const existing = await prisma.reminder.findUnique({
    where: { id: req.params.id },
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
reminderRoutes.post('/:id/trigger', async (req: Request, res: Response) => {
  const existing = await prisma.reminder.findUnique({
    where: { id: req.params.id },
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
reminderRoutes.delete('/:id', async (req: Request, res: Response) => {
  const existing = await prisma.reminder.findUnique({
    where: { id: req.params.id },
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
reminderRoutes.post('/auto/generate', async (_req: Request, res: Response) => {
  const settings = await prisma.settings.findUnique({
    where: { id: 'singleton' },
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
      status: { in: ['NEW', 'IN_PROGRESS', 'BLOCKED'] },
      lastActivityAt: { lte: stagnantDate },
    },
  });

  for (const ticket of stagnantTickets) {
    const existing = await prisma.reminder.findFirst({
      where: {
        ticketId: ticket.id,
        autoType: 'stagnant',
        triggered: false,
      },
    });

    if (!existing) {
      const reminder = await prisma.reminder.create({
        data: {
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
      status: 'WAITING_CLIENT',
      lastActivityAt: { lte: waitingDate },
    },
  });

  for (const ticket of waitingTickets) {
    const existing = await prisma.reminder.findFirst({
      where: {
        ticketId: ticket.id,
        autoType: 'waiting_client',
        triggered: false,
      },
    });

    if (!existing) {
      const reminder = await prisma.reminder.create({
        data: {
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
      priority: { in: ['HIGH', 'CRITICAL'] },
      status: { notIn: ['DONE', 'FROZEN'] },
      lastActivityAt: { lte: highPriorityDate },
    },
  });

  for (const ticket of highPriorityTickets) {
    const existing = await prisma.reminder.findFirst({
      where: {
        ticketId: ticket.id,
        autoType: 'high_priority',
        triggered: false,
      },
    });

    if (!existing) {
      const reminder = await prisma.reminder.create({
        data: {
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
