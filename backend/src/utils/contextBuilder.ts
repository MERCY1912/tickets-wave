import { prisma } from './db.js';

interface TicketContext {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  tags: string[];
  aiNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

interface ActivityContext {
  id: string;
  type: string;
  content: string;
  createdAt: Date;
}

interface BuiltContext {
  ticket: TicketContext;
  activities: ActivityContext[];
  activitySummary: {
    total: number;
    byType: Record<string, number>;
    lastActivity: Date | null;
  };
}

/**
 * Build a comprehensive context for a ticket to be used by AI
 */
export async function buildTicketContext(ticketId: string, userId: string): Promise<BuiltContext | null> {
  try {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, userId },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Last 50 activities
        },
      },
    });

    if (!ticket) {
      return null;
    }

    // Parse tags from JSON string
    let tags: string[] = [];
    try {
      tags = JSON.parse(ticket.tags);
    } catch {
      tags = [];
    }

    // Build ticket context
    const ticketContext: TicketContext = {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      tags,
      aiNotes: ticket.aiNotes,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      lastActivityAt: ticket.lastActivityAt,
    };

    // Build activities context
    const activities: ActivityContext[] = ticket.activities.map((a: any) => ({
      id: a.id,
      type: a.type,
      content: a.content,
      createdAt: a.createdAt,
    }));

    // Build activity summary
    const activitySummary = {
      total: activities.length,
      byType: activities.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      lastActivity: activities[0]?.createdAt || null,
    };

    return {
      ticket: ticketContext,
      activities,
      activitySummary,
    };
  } catch (error) {
    console.error('Error building ticket context:', error);
    return null;
  }
}

/**
 * Format context as text for AI prompts
 */
export function formatContextAsText(context: BuiltContext): string {
  const { ticket, activities, activitySummary } = context;

  const parts = [
    `# Ticket Details`,
    `ID: ${ticket.id}`,
    `Title: ${ticket.title}`,
    `Status: ${ticket.status}`,
    `Priority: ${ticket.priority}`,
    `Tags: ${ticket.tags.join(', ') || 'None'}`,
    `Created: ${new Date(ticket.createdAt).toLocaleString()}`,
    `Last Activity: ${new Date(ticket.lastActivityAt).toLocaleString()}`,
    ``,
    ticket.description ? `Description:\n${ticket.description}` : '',
    ticket.aiNotes ? `AI Notes:\n${ticket.aiNotes}` : '',
    ``,
    `# Activity Summary`,
    `Total Activities: ${activitySummary.total}`,
    Object.entries(activitySummary.byType)
      .map(([type, count]) => `  ${type}: ${count}`)
      .join('\n'),
    ``,
    `# Recent Activities`,
    ...activities.slice(0, 10).map(a => {
      const date = new Date(a.createdAt).toLocaleString();
      return `[${date}] ${a.type}: ${a.content}`;
    }),
  ];

  return parts.filter(p => p !== '').join('\n');
}

/**
 * Build a multi-ticket context for batch analysis
 */
export async function buildMultipleTicketContexts(
  ticketIds: string[],
  userId: string,
  limit: number = 20
): Promise<BuiltContext[]> {
  const tickets = await prisma.ticket.findMany({
    where: {
      id: { in: ticketIds.slice(0, limit) },
      userId,
    },
    include: {
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  const contexts: BuiltContext[] = [];

  for (const ticket of tickets) {
    let tags: string[] = [];
    try {
      tags = JSON.parse(ticket.tags);
    } catch {
      tags = [];
    }

    const ticketContext: TicketContext = {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      tags,
      aiNotes: ticket.aiNotes,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      lastActivityAt: ticket.lastActivityAt,
    };

    const activities: ActivityContext[] = ticket.activities.map((a: any) => ({
      id: a.id,
      type: a.type,
      content: a.content,
      createdAt: a.createdAt,
    }));

    const activitySummary = {
      total: activities.length,
      byType: activities.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      lastActivity: activities[0]?.createdAt || null,
    };

    contexts.push({
      ticket: ticketContext,
      activities,
      activitySummary,
    });
  }

  return contexts;
}

/**
 * Get all active tickets for daily briefing
 */
export async function getActiveTicketsForBriefing(userId: string): Promise<BuiltContext[]> {
  const tickets = await prisma.ticket.findMany({
    where: {
      userId,
      status: {
        in: ['NEW', 'IN_PROGRESS', 'WAITING_CLIENT', 'BLOCKED'],
      },
    },
    include: {
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
    orderBy: { lastActivityAt: 'desc' },
    take: 50,
  });

  const contexts: BuiltContext[] = [];

  for (const ticket of tickets) {
    let tags: string[] = [];
    try {
      tags = JSON.parse(ticket.tags);
    } catch {
      tags = [];
    }

    const ticketContext: TicketContext = {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      tags,
      aiNotes: ticket.aiNotes,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      lastActivityAt: ticket.lastActivityAt,
    };

    const activities: ActivityContext[] = ticket.activities.map((a: any) => ({
      id: a.id,
      type: a.type,
      content: a.content,
      createdAt: a.createdAt,
    }));

    const activitySummary = {
      total: activities.length,
      byType: activities.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      lastActivity: activities[0]?.createdAt || null,
    };

    contexts.push({
      ticket: ticketContext,
      activities,
      activitySummary,
    });
  }

  return contexts;
}
