import { prisma } from '../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../src/lib/auth';
import { createReminderSchema, updateReminderSchema } from '../../src/lib/validation';

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

// GET /api/reminders - List all reminders
// POST /api/reminders - Create reminder

export async function GET(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const url = new URL(req.url);
    const triggered = url.searchParams.get('triggered');
    const limit = url.searchParams.get('limit')
      ? parseInt(url.searchParams.get('limit')!)
      : 100;
    const offset = url.searchParams.get('offset')
      ? parseInt(url.searchParams.get('offset')!)
      : 0;

    const where: any = { userId: auth.userId };
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
      ticket: reminder.ticket
        ? {
            ...reminder.ticket,
            tags: JSON.parse(reminder.ticket.tags),
          }
        : null,
    }));

    return jsonResponse({
      reminders: remindersWithParsedTags,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('[GET /api/reminders] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

export async function POST(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const data = createReminderSchema.parse(await req.json());

    // If ticketId is provided, verify ticket exists and belongs to user
    if (data.ticketId) {
      const ticket = await prisma.ticket.findFirst({
        where: { id: data.ticketId, userId: auth.userId },
      });

      if (!ticket) {
        return errorResponse('Ticket not found', 404);
      }
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId: auth.userId,
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

    return jsonResponse(
      {
        ...reminder,
        ticket: reminder.ticket
          ? {
              ...reminder.ticket,
              tags: JSON.parse(reminder.ticket.tags),
            }
          : null,
      },
      201
    );
  } catch (error: any) {
    console.error('[POST /api/reminders] Error:', error);
    if (error.name === 'ZodError') {
      return errorResponse('Validation error: ' + JSON.stringify(error.errors), 400);
    }
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}
