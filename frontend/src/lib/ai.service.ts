import { prisma } from './db';
import { createDeepSeekClient, DeepSeekClient } from './deepseek';
import { buildTicketContext, formatContextAsText, getActiveTicketsForBriefing, buildMultipleTicketContexts } from './contextBuilder';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatContext {
  ticketId?: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatOptions {
  message: string;
  context?: ChatContext;
  userId: string;
}

export interface AIResponse {
  response: string;
  timestamp: Date;
  model: string;
}

const defaultSystemPrompt = `You are a senior AI support assistant for "Tickets Wave" - a local ticket management system for support teams.

YOUR EXPERTISE:
- Ticket prioritization and triage
- SLA risk assessment
- Pattern recognition in support issues
- Actionable recommendations

TICKET ANALYSIS FRAMEWORK:
When analyzing tickets, always consider:
1. PRIORITY: CRITICAL > HIGH > MEDIUM > LOW
2. URGENCY: Stale tickets (7+ days no activity) need immediate attention
3. SLA RISK: Waiting Client 3+ days, In Progress 7+ days, Blocked status
4. BUSINESS IMPACT: Critical/High priority + stale = highest risk

DATING CONVENTIONS:
- "Created X days ago" - ticket age
- "Last activity X days ago" - staleness
- "Stale" = 7+ days without activity
- "At risk" = approaching SLA breach

YOUR RESPONSES SHOULD:
- Be concise and structured (use bullet points)
- Provide specific, actionable recommendations
- Reference exact ticket details (title, priority, age)
- Highlight risks with clear reasoning
- Suggest priority when asked

EXAMPLE OUTPUT:
Top 3 Focus Areas:
1. [CRITICAL] Login failure - 5 days stale (Urgent: affects 50+ users)
2. [HIGH] Payment gateway timeout - BLOCKED (Awaiting vendor response)
3. [HIGH] Onboarding flow bugs - 12 days stale (SLA risk)

If asked about priority, explain your reasoning based on:
- User impact (number of users, severity)
- Business impact (revenue, reputation)
- Time sensitivity (SLA, age, status)`;

export async function getAISettings(userId: string) {
  const settings = await prisma.settings.findFirst({
    where: { userId },
  });

  return {
    deepseekApiKey: settings?.deepseekApiKey || process.env.DEEPSEEK_API_KEY || '',
    deepseekModel: settings?.deepseekModel || 'deepseek-chat',
    deepseekTemperature: settings?.deepseekTemperature ?? 0.7,
    aiSystemPrompt: settings?.aiSystemPrompt || defaultSystemPrompt,
  };
}

export async function getAIClient(userId: string): Promise<DeepSeekClient> {
  const settings = await getAISettings(userId);

  if (!settings.deepseekApiKey) {
    throw new Error('DeepSeek API key not configured. Please add your API key in Settings.');
  }

  return createDeepSeekClient(settings.deepseekApiKey);
}

export async function chat(options: ChatOptions): Promise<AIResponse> {
  const settings = await getAISettings(options.userId);
  const client = await getAIClient(options.userId);

  const messages: ChatMessage[] = [];

  messages.push({
    role: 'system',
    content: settings.aiSystemPrompt,
  });

  if (options.context?.ticketId) {
    const context = await buildTicketContext(options.context.ticketId, options.userId);
    if (context) {
      messages.push({
        role: 'system',
        content: `CURRENT TICKET CONTEXT:\n${formatContextAsText(context)}\n\nWhen responding, keep this ticket context in mind. Reference specific details when relevant.`,
      });
    }
  }

  if (options.context?.conversationHistory) {
    messages.push(...options.context.conversationHistory);
  }

  messages.push({
    role: 'user',
    content: options.message,
  });

  const response = await client.chat({
    model: settings.deepseekModel,
    messages,
    temperature: settings.deepseekTemperature,
  });

  return {
    response,
    timestamp: new Date(),
    model: settings.deepseekModel,
  };
}

export async function summarizeTicket(ticketId: string, userId: string): Promise<AIResponse> {
  const settings = await getAISettings(userId);
  const client = await getAIClient(userId);
  const context = await buildTicketContext(ticketId, userId);

  if (!context) {
    throw new Error('Ticket not found');
  }

  const prompt = `Please provide a concise summary of this ticket, including:
1. What the ticket is about
2. Current status and what needs to happen next
3. Any key insights from the activity history

Keep your response under 200 words and use clear headings.`;

  const response = await client.chat({
    model: settings.deepseekModel,
    messages: [
      {
        role: 'system',
        content: settings.aiSystemPrompt,
      },
      {
        role: 'system',
        content: `TICKET CONTEXT:\n${formatContextAsText(context)}`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: settings.deepseekTemperature,
  });

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      aiNotes: `Summary (generated ${new Date().toLocaleDateString()}):\n\n${response}`,
    },
  });

  return {
    response,
    timestamp: new Date(),
    model: settings.deepseekModel,
  };
}

export async function generateSuggestions(ticketId: string, userId: string): Promise<AIResponse> {
  const settings = await getAISettings(userId);
  const client = await getAIClient(userId);
  const context = await buildTicketContext(ticketId, userId);

  if (!context) {
    throw new Error('Ticket not found');
  }

  const prompt = `Based on this ticket, provide 3-5 specific, actionable suggestions.
Each suggestion should be:
- Concrete and specific (not vague advice)
- Something that can be acted on immediately
- Relevant to the ticket's current status

Format as a numbered list with brief explanations.`;

  const response = await client.chat({
    model: settings.deepseekModel,
    messages: [
      {
        role: 'system',
        content: settings.aiSystemPrompt,
      },
      {
        role: 'system',
        content: `TICKET CONTEXT:\n${formatContextAsText(context)}`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: settings.deepseekTemperature,
  });

  return {
    response,
    timestamp: new Date(),
    model: settings.deepseekModel,
  };
}

export async function analyzeTickets(ticketIds?: string[], userId?: string): Promise<AIResponse> {
  const settings = await getAISettings(userId || '');
  const client = await getAIClient(userId || '');
  const effectiveUserId = userId || '';

  let contexts;
  if (ticketIds && ticketIds.length > 0) {
    contexts = await buildMultipleTicketContexts(ticketIds, effectiveUserId);
  } else {
    contexts = await getActiveTicketsForBriefing(effectiveUserId);
  }

  if (contexts.length === 0) {
    return {
      response: 'No tickets found to analyze. Please create some tickets first.',
      timestamp: new Date(),
      model: settings.deepseekModel,
    };
  }

  const now = new Date();
  const ticketsDetailed = contexts.map((c) => {
    const daysSinceActivity = Math.floor(
      (now.getTime() - new Date(c.ticket.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysSinceCreated = Math.floor(
      (now.getTime() - new Date(c.ticket.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: c.ticket.id,
      title: c.ticket.title,
      description: c.ticket.description || 'No description',
      status: c.ticket.status,
      priority: c.ticket.priority,
      tags: c.ticket.tags.join(', ') || 'None',
      daysSinceActivity,
      daysSinceCreated,
      activityCount: c.activitySummary.total,
      lastActivity: new Date(c.ticket.lastActivityAt).toLocaleDateString(),
    };
  });

  const sortedTickets = [...ticketsDetailed].sort((a, b) => {
    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 999;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 999;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return b.daysSinceActivity - a.daysSinceActivity;
  });

  const ticketsText = sortedTickets
    .map(
      (t) => `ID: ${t.id}
[${t.priority}] ${t.status} | ${t.title}
Description: ${t.description.substring(0, 100)}${t.description.length > 100 ? '...' : ''}
Age: ${t.daysSinceCreated} days old | Stale: ${t.daysSinceActivity} days since activity
Tags: ${t.tags} | Activities: ${t.activityCount}`
    )
    .join('\n\n');

  const critical = contexts.filter((c) => c.ticket.priority === 'CRITICAL');
  const high = contexts.filter((c) => c.ticket.priority === 'HIGH');

  const staleCount = contexts.filter((c) => {
    const days = Math.floor((now.getTime() - c.ticket.lastActivityAt.getTime()) / 86400000);
    return days >= 7;
  }).length;

  const prompt = `You are analyzing ${contexts.length} REAL tickets from the database.

IMPORTANT: You MUST analyze the ACTUAL ticket data provided below. Do NOT use placeholder examples or fake tickets.

REAL TICKETS FROM DATABASE:
${ticketsText}

For your analysis, consider:
1. PRIORITY ANALYSIS: Which tickets need immediate attention based on priority (${critical.length} critical, ${high.length} high)
2. SLA RISK: Identify tickets at risk (stale 7+ days: ${staleCount} tickets)
3. PATTERNS: Common themes, similar issues, or systemic problems
4. ACTION ITEMS: Specific next steps for each critical/high priority ticket

Provide a structured analysis with clear sections and actionable recommendations using REAL ticket data.`;

  const response = await client.chat({
    model: settings.deepseekModel,
    messages: [
      {
        role: 'system',
        content: settings.aiSystemPrompt,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: settings.deepseekTemperature,
  });

  return {
    response,
    timestamp: new Date(),
    model: settings.deepSeekModel,
  };
}

export async function dailyBriefing(userId?: string): Promise<AIResponse> {
  const settings = await getAISettings(userId || '');
  const client = await getAIClient(userId || '');
  const effectiveUserId = userId || '';
  const contexts = await getActiveTicketsForBriefing(effectiveUserId);

  const now = new Date();
  const critical = contexts.filter((c) => c.ticket.priority === 'CRITICAL');
  const high = contexts.filter((c) => c.ticket.priority === 'HIGH');
  const blocked = contexts.filter((c) => c.ticket.status === 'BLOCKED');
  const waiting = contexts.filter((c) => c.ticket.status === 'WAITING_CLIENT');

  const urgentTickets: any[] = [];

  for (const c of contexts) {
    const daysSinceActivity = Math.floor(
      (now.getTime() - new Date(c.ticket.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysSinceCreated = Math.floor(
      (now.getTime() - new Date(c.ticket.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    let urgencyFlags: string[] = [];
    if (c.ticket.priority === 'CRITICAL') urgencyFlags.push('CRITICAL');
    if (c.ticket.priority === 'HIGH') urgencyFlags.push('HIGH');
    if (c.ticket.status === 'BLOCKED') urgencyFlags.push('BLOCKED');
    if (daysSinceActivity >= 7) urgencyFlags.push(`STALE ${daysSinceActivity}d`);
    if (c.ticket.status === 'WAITING_CLIENT' && daysSinceActivity >= 3) urgencyFlags.push(`WAITING ${daysSinceActivity}d`);

    urgentTickets.push({
      id: c.ticket.id,
      title: c.ticket.title,
      status: c.ticket.status,
      priority: c.ticket.priority,
      description: c.ticket.description?.substring(0, 80) || 'No description',
      urgency: urgencyFlags.length > 0 ? urgencyFlags.join(' | ') : 'Normal',
      daysSinceActivity,
      daysSinceCreated,
    });
  }

  urgentTickets.sort((a, b) => {
    if (a.urgency === 'Normal' && b.urgency !== 'Normal') return 1;
    if (a.urgency !== 'Normal' && b.urgency === 'Normal') return -1;

    const priorityScore = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const aScore = priorityScore[a.priority as keyof typeof priorityScore] || 0;
    const bScore = priorityScore[b.priority as keyof typeof priorityScore] || 0;
    if (aScore !== bScore) return bScore - aScore;

    return b.daysSinceActivity - a.daysSinceActivity;
  });

  const topTickets = urgentTickets
    .slice(0, 15)
    .map(
      (t) => `ID: ${t.id}
[${t.priority}] | ${t.status} | Age: ${t.daysSinceCreated}d | Stale: ${t.daysSinceActivity}d
Title: ${t.title}
Description: ${t.description}
Urgency: ${t.urgency}`
    )
    .join('\n\n---\n\n');

  const prompt = `You are analyzing ${contexts.length} REAL tickets from the database.

IMPORTANT: You MUST analyze the ACTUAL ticket data provided below. Do NOT use placeholder examples.

CURRENT SITUATION:
- Total active tickets: ${contexts.length}
- Critical priority: ${critical.length}
- High priority: ${high.length}
- Blocked: ${blocked.length}
- Waiting on client: ${waiting.length}

ALL TICKETS IN DATABASE:
${topTickets}

Based on these REAL tickets, provide a structured morning report using this EXACT format:

# 📊 OVERVIEW
2-3 sentences about current situation

# 🎯 FOCUS TODAY
Work on these tickets today:

1. **[CRITICAL] Ticket Title (ID: xxx)**
   - **Why:** Specific reason from data
   - **Action:** Concrete next step

2. **[HIGH] Ticket Title (ID: xxx)**
   - **Why:** Specific reason
   - **Action:** Concrete next step

# ⚠️ RISK ALERT
Tickets needing attention:

- **Ticket Title (ID: xxx)** - Risk: blocked for X days, impact: description
- **Ticket Title (ID: xxx)** - Risk: stale 7+ days, impact: description

# 💡 RECOMMENDATIONS
- Suggested action 1
- Suggested action 2

Use ONLY the ticket data above. Reference actual ticket IDs and details.`;

  const response = await client.chat({
    model: settings.deepseekModel,
    messages: [
      {
        role: 'system',
        content: settings.aiSystemPrompt,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: settings.deepseekTemperature,
  });

  return {
    response,
    timestamp: new Date(),
    model: settings.deepseekModel,
  };
}
