import { prisma } from '../../../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../../../src/lib/auth';
import { createActivitySchema } from '../../../../src/lib/validation';

// GET /api/activities/tickets/[ticketId] - Get activities for a specific ticket
// POST /api/activities/tickets/[ticketId] - Create activity for a ticket

interface Context {
  params: { ticketId: string };
}

export async function GET(req: Request, context: Context): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const ticketId = context.params.ticketId;
    const url = new URL(req.url);
    const limit = url.searchParams.get('limit')
      ? parseInt(url.searchParams.get('limit')!)
      : 50;
    const offset = url.searchParams.get('offset')
      ? parseInt(url.searchParams.get('offset')!)
      : 0;

    // Verify ticket exists and belongs to user
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, userId: auth.userId },
    });

    if (!ticket) {
      return errorResponse('Ticket not found', 404);
    }

    const [activities, total] = await Promise.all([
      prisma.ticketActivity.findMany({
        where: { ticketId, userId: auth.userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.ticketActivity.count({ where: { ticketId, userId: auth.userId } }),
    ]);

    return jsonResponse({
      activities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('[GET /api/activities/tickets/:ticketId] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

export async function POST(req: Request, context: Context): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const ticketId = context.params.ticketId;
    const data = createActivitySchema.parse(await req.json());

    // Verify ticket exists and belongs to user
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, userId: auth.userId },
    });

    if (!ticket) {
      return errorResponse('Ticket not found', 404);
    }

    const activity = await prisma.ticketActivity.create({
      data: {
        ticketId,
        userId: auth.userId,
        type: data.type,
        content: data.content,
      },
    });

    // Update ticket's last activity timestamp
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { lastActivityAt: new Date() },
    });

    return jsonResponse(activity, 201);
  } catch (error: any) {
    console.error('[POST /api/activities/tickets/:ticketId] Error:', error);
    if (error.name === 'ZodError') {
      return errorResponse('Validation error: ' + JSON.stringify(error.errors), 400);
    }
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}
