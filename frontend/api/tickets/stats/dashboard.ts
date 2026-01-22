import { prisma } from '../../../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../../../src/lib/auth';

// GET /api/tickets/stats/dashboard - Dashboard statistics

export async function GET(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const [
      totalTickets,
      statusCounts,
      priorityCounts,
      recentTickets,
      stagnantTickets,
    ] = await Promise.all([
      prisma.ticket.count({ where: { userId: auth.userId } }),
      prisma.ticket.groupBy({
        by: ['status'],
        _count: true,
        where: { userId: auth.userId },
      }),
      prisma.ticket.groupBy({
        by: ['priority'],
        _count: true,
        where: { userId: auth.userId },
      }),
      prisma.ticket.findMany({
        where: {
          userId: auth.userId,
          status: { not: 'DONE' },
        },
        orderBy: { lastActivityAt: 'desc' },
        take: 5,
        include: {
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      // Stagnant tickets (no activity for 5 days)
      prisma.ticket.findMany({
        where: {
          userId: auth.userId,
          status: { in: ['NEW', 'IN_PROGRESS', 'BLOCKED'] },
          lastActivityAt: {
            lte: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
        },
        take: 10,
      }),
    ]);

    return jsonResponse({
      total: totalTickets,
      byStatus: statusCounts.reduce(
        (acc: Record<string, number>, item: any) => {
          acc[item.status] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      byPriority: priorityCounts.reduce(
        (acc: Record<string, number>, item: any) => {
          acc[item.priority] = item._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      recentTickets: recentTickets.map((t: any) => ({
        ...t,
        tags: JSON.parse(t.tags),
      })),
      stagnantCount: stagnantTickets.length,
    });
  } catch (error: any) {
    console.error('[GET /api/tickets/stats/dashboard] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}
