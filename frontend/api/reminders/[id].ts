import { prisma } from '../../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../../src/lib/auth';
import { updateReminderSchema } from '../../../src/lib/validation';

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

// GET /api/reminders/[id] - Get single reminder
// PUT /api/reminders/[id] - Update reminder
// DELETE /api/reminders/[id] - Delete reminder

interface Context {
  params: { id: string };
}

export async function GET(req: Request, context: Context): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const reminder = await prisma.reminder.findFirst({
      where: { id: context.params.id, userId: auth.userId },
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
      return errorResponse('Reminder not found', 404);
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
    console.error('[GET /api/reminders/:id] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

export async function PUT(req: Request, context: Context): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const data = updateReminderSchema.parse(await req.json());

    const existing = await prisma.reminder.findFirst({
      where: { id: context.params.id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse('Reminder not found', 404);
    }

    const updateData: any = {};
    if (data.remindAt !== undefined) updateData.remindAt = new Date(data.remindAt);
    if (data.message !== undefined) updateData.message = data.message;
    if (data.repeat !== undefined) updateData.repeat = data.repeat;
    if (data.triggered !== undefined) updateData.triggered = data.triggered;

    const reminder = await prisma.reminder.update({
      where: { id: context.params.id },
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
    console.error('[PUT /api/reminders/:id] Error:', error);
    if (error.name === 'ZodError') {
      return errorResponse('Validation error: ' + JSON.stringify(error.errors), 400);
    }
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

export async function DELETE(req: Request, context: Context): Promise<Response> {
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

    await prisma.reminder.delete({
      where: { id: context.params.id },
    });

    return jsonResponse({ success: true, message: 'Reminder deleted' });
  } catch (error: any) {
    console.error('[DELETE /api/reminders/:id] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}
