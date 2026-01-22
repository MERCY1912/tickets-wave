import { prisma } from '../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../src/lib/auth';
import { createTicketSchema, ticketQuerySchema } from '../../src/lib/validation';

interface TicketQuery {
  status?: string;
  priority?: string;
  search?: string;
  tag?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: string;
  offset?: string;
}

// GET /api/tickets - List tickets with filters
// POST /api/tickets - Create ticket
export async function GET(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const url = new URL(req.url);
    const query: TicketQuery = Object.fromEntries(url.searchParams.entries());

    // Parse and validate query parameters
    const validatedQuery = ticketQuerySchema.safeParse(query);
    if (!validatedQuery.success) {
      return errorResponse('Invalid query parameters', 400);
    }

    const q = validatedQuery.data;

    const where: any = { userId: auth.userId };

    if (q.status) {
      where.status = q.status;
    }

    if (q.priority) {
      where.priority = q.priority;
    }

    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: 'insensitive' } },
        { description: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    if (q.tag) {
      where.tags = { contains: q.tag };
    }

    const sortBy = q.sortBy || 'lastActivityAt';
    const sortOrder = q.sortOrder || 'desc';
    const limit = q.limit || 50;
    const offset = q.offset || 0;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
        include: {
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          reminders: {
            where: { triggered: false },
            orderBy: { remindAt: 'asc' },
            take: 1,
          },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    // Parse tags for each ticket
    const ticketsWithParsedTags = tickets.map((ticket: any) => ({
      ...ticket,
      tags: JSON.parse(ticket.tags),
    }));

    return jsonResponse({
      tickets: ticketsWithParsedTags,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('[GET /api/tickets] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}

export async function POST(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const body = await req.json();
    const data = createTicketSchema.parse(body);

    const tags = data.tags || [];
    const ticket = await prisma.ticket.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || 'NEW',
        priority: data.priority || 'MEDIUM',
        tags: JSON.stringify(tags),
        userId: auth.userId,
      },
      include: {
        activities: true,
        reminders: true,
      },
    });

    // Create initial activity
    await prisma.ticketActivity.create({
      data: {
        ticketId: ticket.id,
        userId: auth.userId,
        type: 'STATUS_CHANGE',
        content: `Ticket created with status: ${ticket.status}`,
      },
    });

    return jsonResponse(
      {
        ...ticket,
        tags: JSON.parse(ticket.tags),
      },
      201
    );
  } catch (error: any) {
    console.error('[POST /api/tickets] Error:', error);
    if (error.name === 'ZodError') {
      return errorResponse('Validation error: ' + JSON.stringify(error.errors), 400);
    }
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}
