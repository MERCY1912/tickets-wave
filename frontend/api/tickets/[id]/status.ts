import { prisma } from '../../../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../../../src/lib/auth';
import { updateTicketStatusSchema } from '../../../../src/lib/validation';

// PATCH /api/tickets/[id]/status - Update ticket status

interface Context {
  params: { id: string };
}

export async function PATCH(req: Request, context: Context): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const data = updateTicketStatusSchema.parse(await req.json());

    const existing = await prisma.ticket.findFirst({
      where: { id: context.params.id, userId: auth.userId },
    });

    if (!existing) {
      return errorResponse('Ticket not found', 404);
    }

    const ticket = await prisma.ticket.update({
      where: { id: context.params.id },
      data: {
        status: data.status,
        lastActivityAt: new Date(),
      },
    });

    // Create activity
    await prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        userId: auth.userId,
        type: 'STATUS_CHANGE',
        content: `Status changed from ${existing.status} to ${data.status}`,
      },
    });

    return jsonResponse({
      ...ticket,
      tags: JSON.parse(ticket.tags),
    });
  } catch (error: any) {
    console.error('[PATCH /api/tickets/:id/status] Error:', error);
    if (error.name === 'ZodError') {
      return errorResponse('Validation error: ' + JSON.stringify(error.errors), 400);
    }
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}
