import { prisma } from '../../src/lib/db';
import { authenticateRequest, unauthorizedResponse, errorResponse, jsonResponse } from '../../src/lib/auth';

// POST /api/tickets/seed - Create sample test tickets

export async function POST(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse();
  }

  try {
    const userId = auth.userId;
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

    const sampleTickets = [
      {
        title: 'Login authentication failing for admin users',
        description: 'Multiple reports of admin panel login failures. Users see "Invalid credentials" even with correct password.',
        status: 'BLOCKED' as const,
        priority: 'CRITICAL' as const,
        tags: JSON.stringify(['auth', 'urgent', 'admin']),
        userId,
        createdAt: twoDaysAgo,
        lastActivityAt: twoDaysAgo,
      },
      {
        title: 'Payment gateway timeout during checkout',
        description: 'Customers report checkout failing with timeout errors. Affecting ~20 transactions per day.',
        status: 'IN_PROGRESS' as const,
        priority: 'CRITICAL' as const,
        tags: JSON.stringify(['payment', 'revenue', 'checkout']),
        userId,
        createdAt: fiveDaysAgo,
        lastActivityAt: fiveDaysAgo,
      },
      {
        title: 'Dashboard reports showing incorrect data',
        description: 'Exported CSV reports have mismatched numbers compared to dashboard view. Data accuracy concern.',
        status: 'NEW' as const,
        priority: 'HIGH' as const,
        tags: JSON.stringify(['reports', 'data-quality']),
        userId,
        createdAt: now,
        lastActivityAt: now,
      },
      {
        title: 'User onboarding flow crashes on mobile',
        description: 'App crashes during signup on iOS Safari. 15+ users affected last week.',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const,
        tags: JSON.stringify(['mobile', 'ios', 'crash']),
        userId,
        createdAt: eightDaysAgo,
        lastActivityAt: eightDaysAgo,
      },
      {
        title: 'Email notifications delayed by 2-3 hours',
        description: 'Notification system lag causing poor user experience. Not urgent but needs attention.',
        status: 'WAITING_CLIENT' as const,
        priority: 'MEDIUM' as const,
        tags: JSON.stringify(['email', 'notifications']),
        userId,
        createdAt: fiveDaysAgo,
        lastActivityAt: fiveDaysAgo,
      },
      {
        title: 'Search function not returning recent tickets',
        description: 'Search index appears to be out of sync. Users can\'t find tickets from last 2 days.',
        status: 'NEW' as const,
        priority: 'LOW' as const,
        tags: JSON.stringify(['search', 'bug']),
        userId,
        createdAt: now,
        lastActivityAt: now,
      },
    ];

    const created = await Promise.all(
      sampleTickets.map(async (data) => {
        const ticket = await prisma.ticket.create({
          data,
        });

        // Create initial activity
        await prisma.ticketActivity.create({
          data: {
            ticketId: ticket.id,
            userId,
            type: 'STATUS_CHANGE',
            content: `Ticket created with status: ${data.status}`,
          },
        });

        return {
          ...ticket,
          tags: JSON.parse(ticket.tags),
        };
      })
    );

    console.log('[Seed] Created sample tickets:', created.length);

    return jsonResponse({
      success: true,
      count: created.length,
      tickets: created,
    });
  } catch (error: any) {
    console.error('[POST /api/tickets/seed] Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500);
  }
}
