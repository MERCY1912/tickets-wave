import { prisma } from '../../../../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../../../../src/lib/auth';
import { summarizeTicket } from '../../../../../src/lib/ai.service';

// POST /api/ai/tickets/[id]/summary - Generate ticket summary

interface Context {
  params: { id: string };
}

export async function POST(req: Request, context: Context): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const ticketId = context.params.id;

    // Verify ticket belongs to user
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, userId: auth.userId },
    });

    if (!ticket) {
      return errorResponse('Ticket not found', 404);
    }

    const result = await summarizeTicket(ticketId, auth.userId);
    return jsonResponse(result);
  } catch (error: any) {
    console.error('[POST /api/ai/tickets/:id/summary] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}
