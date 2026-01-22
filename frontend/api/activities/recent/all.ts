import { prisma } from '../../../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, jsonResponse } from '../../../../src/lib/auth';

// GET /api/activities/recent/all - Get recent activities across all tickets

export async function GET(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const activities = await prisma.ticketActivity.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
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

    // Parse tags for tickets
    const activitiesWithParsedTags = activities.map((activity: any) => ({
      ...activity,
      ticket: {
        ...activity.ticket,
        tags: JSON.parse(activity.ticket.tags),
      },
    }));

    return jsonResponse(activitiesWithParsedTags);
  } catch (error: any) {
    console.error('[GET /api/activities/recent/all] Error:', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
}
