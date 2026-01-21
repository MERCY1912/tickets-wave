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
  private defaultSystemPrompt = `You are a helpful AI assistant for a ticket management system called "Tickets Wave".

Your role is to help support managers:
- Analyze tickets and provide insights
- Suggest actions and priorities
- Summarize complex tickets
- Identify patterns and potential issues
- Help with ticket organization

Be concise, practical, and actionable in your responses. Use bullet points when appropriate.
If you're unsure about something, ask clarifying questions.`;

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
   * Analyze multiple tickets for insights
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

    const ticketsSummary = contexts
      .map(c => `- [${c.ticket.status}] ${c.ticket.title} (Priority: ${c.ticket.priority})`)
      .join('\n');

    const prompt = `Analyze these ${contexts.length} tickets and provide:
1. Key patterns or themes you notice
2. Tickets that need immediate attention (explain why)
3. Any blocked or stuck tickets that need intervention
4. Overall recommendations for prioritization

Tickets:
${ticketsSummary}

Be concise and specific.`;

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
   * Generate a daily briefing
   */
  async dailyBriefing(): Promise<AIResponse> {
    const settings = await this.getSettings();
    const contexts = await getActiveTicketsForBriefing();

    const critical = contexts.filter(c => c.ticket.priority === 'CRITICAL');
    const high = contexts.filter(c => c.ticket.priority === 'HIGH');
    const blocked = contexts.filter(c => c.ticket.status === 'BLOCKED');
    const waiting = contexts.filter(c => c.ticket.status === 'WAITING_CLIENT');

    const prompt = `Generate a daily briefing for a support manager with ${contexts.length} active tickets:

Breakdown:
- ${critical.length} critical tickets
- ${high.length} high priority tickets
- ${blocked.length} blocked tickets
- ${waiting.length} waiting on client

Provide:
1. A brief overview of the current situation
2. Top 3 tickets to focus on today (with reasons)
3. Any tickets at risk of going stale

Keep it under 150 words total.`;

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
