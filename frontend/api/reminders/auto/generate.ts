import { prisma } from '../../../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../../../src/lib/auth';

// POST /api/reminders/auto/generate - Generate automatic reminders based on rules

export async function POST(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const settings = await prisma.settings.findFirst({
      where: { userId: auth.userId },
    });

    if (!settings) {
      return errorResponse('Settings not found', 400);
    }

    const now = new Date();
    const createdReminders = [];

    // Stagnant tickets (no activity for X days)
    const stagnantDays = settings.reminderStagnantDays;
    const stagnantDate = new Date(Date.now() - stagnantDays * 24 * 60 * 60 * 1000);

    const stagnantTickets = await prisma.ticket.findMany({
      where: {
        userId: auth.userId,
        status: { in: ['NEW', 'IN_PROGRESS', 'BLOCKED'] },
        lastActivityAt: { lte: stagnantDate },
      },
    });

    for (const ticket of stagnantTickets) {
      const existing = await prisma.reminder.findFirst({
        where: {
          userId: auth.userId,
          ticketId: ticket.id,
          autoType: 'stagnant',
          triggered: false,
        },
      });

      if (!existing) {
        const reminder = await prisma.reminder.create({
          data: {
            userId: auth.userId,
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
        userId: auth.userId,
        status: 'WAITING_CLIENT',
        lastActivityAt: { lte: waitingDate },
      },
    });

    for (const ticket of waitingTickets) {
      const existing = await prisma.reminder.findFirst({
        where: {
          userId: auth.userId,
          ticketId: ticket.id,
          autoType: 'waiting_client',
          triggered: false,
        },
      });

      if (!existing) {
        const reminder = await prisma.reminder.create({
          data: {
            userId: auth.userId,
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
        userId: auth.userId,
        priority: { in: ['HIGH', 'CRITICAL'] },
        status: { notIn: ['DONE', 'FROZEN'] },
        lastActivityAt: { lte: highPriorityDate },
      },
    });

    for (const ticket of highPriorityTickets) {
      const existing = await prisma.reminder.findFirst({
        where: {
          userId: auth.userId,
          ticketId: ticket.id,
          autoType: 'high_priority',
          triggered: false,
        },
      });

      if (!existing) {
        const reminder = await prisma.reminder.create({
          data: {
            userId: auth.userId,
            ticketId: ticket.id,
            remindAt: now,
            message: `High priority ticket "${ticket.title}" has no activity for ${highPriorityDays} days`,
            autoType: 'high_priority',
          },
        });
        createdReminders.push(reminder);
      }
    }

    return jsonResponse({
      created: createdReminders.length,
      reminders: createdReminders,
    });
  } catch (error: any) {
    console.error('[POST /api/reminders/auto/generate] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}
