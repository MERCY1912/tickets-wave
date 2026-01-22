import { prisma } from '../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, jsonResponse } from '../../src/lib/auth';

// GET /api/reminders/upcoming - Get upcoming reminders (next 7 days)

export async function GET(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const now = new Date();
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const reminders = await prisma.reminder.findMany({
      where: {
        userId: auth.userId,
        triggered: false,
        remindAt: {
          gte: now,
          lte: weekFromNow,
        },
      },
      orderBy: { remindAt: 'asc' },
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
    const remindersWithParsedTags = reminders.map((reminder: any) => ({
      ...reminder,
      ticket: reminder.ticket
        ? {
            ...reminder.ticket,
            tags: JSON.parse(reminder.ticket.tags),
          }
        : null,
    }));

    return jsonResponse(remindersWithParsedTags);
  } catch (error: any) {
    console.error('[GET /api/reminders/upcoming] Error:', error);
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
}
