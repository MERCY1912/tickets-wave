import { prisma } from '../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, jsonResponse } from '../../src/lib/auth';

// GET /api/activities - List all activities (with optional filtering)

export async function GET(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const url = new URL(req.url);
    const ticketId = url.searchParams.get('ticketId');
    const limit = url.searchParams.get('limit')
      ? parseInt(url.searchParams.get('limit')!)
      : 50;
    const offset = url.searchParams.get('offset')
      ? parseInt(url.searchParams.get('offset')!)
      : 0;

    const where: any = { userId: auth.userId };
    if (ticketId) {
      where.ticketId = ticketId;
    }

    const [activities, total] = await Promise.all([
      prisma.ticketActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          ticket: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
        },
      }),
      prisma.ticketActivity.count({ where }),
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
    console.error('[GET /api/activities] Error:', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
}
