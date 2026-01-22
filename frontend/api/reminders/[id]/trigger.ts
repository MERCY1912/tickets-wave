import { prisma } from '../../../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../../../src/lib/auth';

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

// POST /api/reminders/[id]/trigger - Mark reminder as triggered

interface Context {
  params: { id: string };
}

export async function POST(req: Request, context: Context): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const existing = await prisma.reminder.findFirst({
      where: { id: context.params.id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse('Reminder not found', 404);
    }

    const reminder = await prisma.reminder.update({
      where: { id: context.params.id },
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
          userId: auth.userId,
          ticketId: reminder.ticketId,
          remindAt: nextRemindAt,
          message: reminder.message,
          repeat: reminder.repeat,
          autoType: reminder.autoType,
        },
      });
    }

    return jsonResponse({
      ...reminder,
      ticket: reminder.ticket
        ? {
            ...reminder.ticket,
            tags: JSON.parse(reminder.ticket.tags),
          }
        : null,
    });
  } catch (error: any) {
    console.error('[POST /api/reminders/:id/trigger] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}
