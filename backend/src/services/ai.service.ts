import { prisma } from '../utils/db.js';
import { createOllamaClient, OllamaClient } from '../utils/ollama.js';
import { buildTicketContext, formatContextAsText, getActiveTicketsForBriefing, buildMultipleTicketContexts } from '../utils/contextBuilder.js';

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
}

export interface AIResponse {
  response: string;
  timestamp: Date;
  model: string;
}

export class AIService {
  private client: OllamaClient;
  private defaultSystemPrompt = `You are a senior AI support assistant for "Tickets Wave" - a local ticket management system for support teams.

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

  constructor(private ollamaUrl: string = 'http://localhost:11434') {
    this.client = createOllamaClient(ollamaUrl);
  }

  /**
   * Get current settings from database
   */
  private async getSettings() {
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' },
    });

    return {
      ollamaUrl: settings?.ollamaUrl || this.ollamaUrl,
      ollamaModel: settings?.ollamaModel || 'qwen2.5:7b',
      ollamaTemperature: settings?.ollamaTemperature ?? 0.7,
      aiSystemPrompt: settings?.aiSystemPrompt || this.defaultSystemPrompt,
    };
  }

  /**
   * Check if Ollama is available
   */
  async checkHealth(): Promise<{ healthy: boolean; models?: string[]; error?: string }> {
    try {
      const healthy = await this.client.checkHealth();
      if (!healthy) {
        return { healthy: false, error: 'Ollama is not responding' };
      }

      const models = await this.client.listModels();
      return { healthy: true, models };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Main chat function with context awareness
   */
  async chat(options: ChatOptions): Promise<AIResponse> {
    const settings = await this.getSettings();

    // Update client if URL changed
    if (settings.ollamaUrl !== this.ollamaUrl) {
      this.client = createOllamaClient(settings.ollamaUrl);
    }

    const messages: ChatMessage[] = [];

    // Add system prompt
    messages.push({
      role: 'system',
      content: settings.aiSystemPrompt,
    });

    // Add ticket context if provided
    if (options.context?.ticketId) {
      const context = await buildTicketContext(options.context.ticketId);
      if (context) {
        messages.push({
          role: 'system',
          content: `CURRENT TICKET CONTEXT:\n${formatContextAsText(context)}\n\nWhen responding, keep this ticket context in mind. Reference specific details when relevant.`,
        });
      }
    }

    // Add conversation history if provided
    if (options.context?.conversationHistory) {
      messages.push(...options.context.conversationHistory);
    }

    // Add current message
    messages.push({
      role: 'user',
      content: options.message,
    });

    try {
      const response = await this.client.chat({
        model: settings.ollamaModel,
        messages,
        temperature: settings.ollamaTemperature,
      });

      return {
        response,
        timestamp: new Date(),
        model: settings.ollamaModel,
      };
    } catch (error) {
      throw new Error(`AI chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a summary for a specific ticket
   */
  async summarizeTicket(ticketId: string): Promise<AIResponse> {
    const settings = await this.getSettings();
    const context = await buildTicketContext(ticketId);

    if (!context) {
      throw new Error('Ticket not found');
    }

    const prompt = `Please provide a concise summary of this ticket, including:
1. What the ticket is about
2. Current status and what needs to happen next
3. Any key insights from the activity history

Keep your response under 200 words and use clear headings.`;

    const response = await this.client.chat({
      model: settings.ollamaModel,
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
      temperature: settings.ollamaTemperature,
    });

    // Update ticket with AI notes
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        aiNotes: `Summary (generated ${new Date().toLocaleDateString()}):\n\n${response}`,
      },
    });

    return {
      response,
      timestamp: new Date(),
      model: settings.ollamaModel,
    };
  }

  /**
   * Generate actionable suggestions for a ticket
   */
  async generateSuggestions(ticketId: string): Promise<AIResponse> {
    const settings = await this.getSettings();
    const context = await buildTicketContext(ticketId);

    if (!context) {
      throw new Error('Ticket not found');
    }

    const prompt = `Based on this ticket, provide 3-5 specific, actionable suggestions.
Each suggestion should be:
- Concrete and specific (not vague advice)
- Something that can be acted on immediately
- Relevant to the ticket's current status

Format as a numbered list with brief explanations.`;

    const response = await this.client.chat({
      model: settings.ollamaModel,
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
      temperature: settings.ollamaTemperature,
    });

    return {
      response,
      timestamp: new Date(),
      model: settings.ollamaModel,
    };
  }

  /**
   * Analyze multiple tickets for insights with full context
   */
  async analyzeTickets(ticketIds?: string[]): Promise<AIResponse> {
    const settings = await this.getSettings();

    let contexts;
    if (ticketIds && ticketIds.length > 0) {
      contexts = await buildMultipleTicketContexts(ticketIds);
    } else {
      contexts = await getActiveTicketsForBriefing();
    }

    if (contexts.length === 0) {
      return {
        response: 'No tickets to analyze.',
        timestamp: new Date(),
        model: settings.ollamaModel,
      };
    }

    // Build detailed ticket information for analysis
    const now = new Date();
    const ticketsDetailed = contexts.map(c => {
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

    // Sort by priority and staleness
    const sortedTickets = [...ticketsDetailed].sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 999;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 999;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return b.daysSinceActivity - a.daysSinceActivity;
    });

    const ticketsText = sortedTickets.map(t =>
      `[${t.priority}] ${t.status} | ${t.title}
      Description: ${t.description.substring(0, 100)}${t.description.length > 100 ? '...' : ''}
      Age: ${t.daysSinceCreated}d old | Stale: ${t.daysSinceActivity}d since activity
      Tags: ${t.tags} | Activities: ${t.activityCount}`
    ).join('\n\n');

    const prompt = `You are analyzing ${contexts.length} tickets in a support system.

TICKETS TO ANALYZE:
${ticketsText}

For your analysis, consider:
1. PRIORITY ANALYSIS: Which tickets need immediate attention based on priority, age, and staleness
2. SLA RISK: Identify tickets at risk (stale for 7+ days, waiting too long, blocked)
3. PATTERNS: Common themes, similar issues, or systemic problems
4. ACTION ITEMS: Specific next steps for each critical/high priority ticket

Provide a structured analysis with clear sections and actionable recommendations.`;

    const response = await this.client.chat({
      model: settings.ollamaModel,
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
      temperature: settings.ollamaTemperature,
    });

    return {
      response,
      timestamp: new Date(),
      model: settings.ollamaModel,
    };
  }

  /**
   * Generate a daily briefing with full ticket context
   */
  async dailyBriefing(): Promise<AIResponse> {
    const settings = await this.getSettings();
    const contexts = await getActiveTicketsForBriefing();

    const now = new Date();
    const critical = contexts.filter(c => c.ticket.priority === 'CRITICAL');
    const high = contexts.filter(c => c.ticket.priority === 'HIGH');
    const blocked = contexts.filter(c => c.ticket.status === 'BLOCKED');
    const waiting = contexts.filter(c => c.ticket.status === 'WAITING_CLIENT');

    // Build detailed ticket list with urgency indicators
    const urgentTickets = [];

    for (const c of contexts) {
      const daysSinceActivity = Math.floor(
        (now.getTime() - new Date(c.ticket.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysSinceCreated = Math.floor(
        (now.getTime() - new Date(c.ticket.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Flag tickets needing attention
      let urgencyFlags = [];
      if (c.ticket.priority === 'CRITICAL') urgencyFlags.push('CRITICAL');
      if (c.ticket.priority === 'HIGH') urgencyFlags.push('HIGH');
      if (c.ticket.status === 'BLOCKED') urgencyFlags.push('BLOCKED');
      if (daysSinceActivity >= 7) urgencyFlags.push(`STALE ${daysSinceActivity}d`);
      if (c.ticket.status === 'WAITING_CLIENT' && daysSinceActivity >= 3) urgencyFlags.push(`WAITING ${daysSinceActivity}d`);

      if (urgencyFlags.length > 0) {
        urgentTickets.push({
          id: c.ticket.id,
          title: c.ticket.title,
          status: c.ticket.status,
          priority: c.ticket.priority,
          description: c.ticket.description?.substring(0, 80) || 'No description',
          urgency: urgencyFlags.join(' | '),
          daysSinceActivity,
          daysSinceCreated,
        });
      }
    }

    // Sort by urgency
    urgentTickets.sort((a, b) => {
      const priorityScore = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const aScore = priorityScore[a.priority as keyof typeof priorityScore] || 0;
      const bScore = priorityScore[b.priority as keyof typeof priorityScore] || 0;
      if (aScore !== bScore) return bScore - aScore;
      return b.daysSinceActivity - a.daysSinceActivity;
    });

    const topTickets = urgentTickets.slice(0, 10).map(t =>
      `[${t.priority}] ${t.status}
       ${t.title}
       ${t.description}
       Urgency: ${t.urgency}`
    ).join('\n\n---\n\n');

    const prompt = `You are a senior support manager's AI assistant. Generate a concise daily briefing.

CURRENT SITUATION:
- Total active tickets: ${contexts.length}
- Critical priority: ${critical.length}
- High priority: ${high.length}
- Blocked: ${blocked.length}
- Waiting on client: ${waiting.length}

TICKETS REQUIRING ATTENTION (${urgentTickets.length} total):
${urgentTickets.length > 0 ? topTickets : 'No urgent tickets at this time.'}

Provide a structured briefing with:
1. OVERVIEW: 2-3 sentence summary of current situation
2. FOCUS TODAY: Top 3-5 tickets to work on with brief reasons
3. RISK ALERT: Any tickets at risk (stale 7+ days, waiting too long, blocked)

Keep it under 200 words. Be specific and actionable.`;

    const response = await this.client.chat({
      model: settings.ollamaModel,
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
      temperature: settings.ollamaTemperature,
    });

    return {
      response,
      timestamp: new Date(),
      model: settings.ollamaModel,
    };
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    return this.client.listModels();
  }

  /**
   * Test Ollama connection
   */
  async testConnection(url?: string): Promise<{ success: boolean; models?: string[]; error?: string }> {
    const testClient = url ? createOllamaClient(url) : this.client;

    try {
      const healthy = await testClient.checkHealth();
      if (!healthy) {
        return { success: false, error: 'Connection failed' };
      }

      const models = await testClient.listModels();
      return { success: true, models };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton factory
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}

export function resetAIService(url?: string): AIService {
  aiServiceInstance = new AIService(url);
  return aiServiceInstance;
}
