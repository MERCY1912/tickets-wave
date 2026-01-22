import { prisma } from '../../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../../src/lib/auth';
import { updateTicketSchema } from '../../../src/lib/validation';

// GET /api/tickets/[id] - Get single ticket
// PUT /api/tickets/[id] - Update ticket
// DELETE /api/tickets/[id] - Delete ticket

interface Context {
  params: { id: string };
}

export async function GET(req: Request, context: Context): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const ticket = await prisma.ticket.findFirst({
      where: { id: context.params.id, userId: auth.userId },
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
      return errorResponse('Ticket not found', 404);
    }

    return jsonResponse({
      ...ticket,
      tags: JSON.parse(ticket.tags),
    });
  } catch (error: any) {
    console.error('[GET /api/tickets/:id] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

export async function PUT(req: Request, context: Context): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const data = updateTicketSchema.parse(await req.json());

    const existing = await prisma.ticket.findFirst({
      where: { id: context.params.id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse('Ticket not found', 404);
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
      where: { id: context.params.id },
      data: updateData,
      include: {
        activities: true,
        reminders: true,
      },
    });

    // Create activities for changes
    if (activitiesToCreate.length > 0) {
      await prisma.ticketActivity.createMany({
        data: activitiesToCreate.map((a) => ({
          ticketId: ticket.id,
          userId: auth.userId,
          type: a.type as any,
          content: a.content,
        })),
      });
    }

    return jsonResponse({
      ...ticket,
      tags: JSON.parse(ticket.tags),
    });
  } catch (error: any) {
    console.error('[PUT /api/tickets/:id] Error:', error);
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
    const existing = await prisma.ticket.findFirst({
      where: { id: context.params.id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse('Ticket not found', 404);
    }

    await prisma.ticket.delete({
      where: { id: context.params.id },
    });

    return jsonResponse({ success: true, message: 'Ticket deleted' });
  } catch (error: any) {
    console.error('[DELETE /api/tickets/:id] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}
