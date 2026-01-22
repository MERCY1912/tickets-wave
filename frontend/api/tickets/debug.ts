import { prisma } from '../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, jsonResponse } from '../../src/lib/auth';

// GET /api/tickets/debug - Debug endpoint to check DB state

export async function GET(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return jsonResponse({
      totalTickets: await prisma.ticket.count({ where: { userId: auth.userId } }),
      recentTickets: tickets.map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        tags: JSON.parse(t.tags),
        createdAt: t.createdAt,
        lastActivityAt: t.lastActivityAt,
      })),
    });
  } catch (error: any) {
    console.error('[GET /api/tickets/debug] Error:', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
}
