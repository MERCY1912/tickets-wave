import { apiClient } from './client.js';
import type { AIResponse, ChatContext } from '../../types/index.js';

export const aiApi = {
  // Check AI service status
  getStatus: () => {
    return apiClient.get<{ healthy: boolean; models?: string[]; error?: string }>('/ai/status');
  },

  // List available models
  getModels: () => {
    return apiClient.get<{ models: string[] }>('/ai/models');
  },

  // Chat with AI
  chat: (message: string, context?: ChatContext) => {
    return apiClient.post<AIResponse>('/ai/chat', { message, context });
  },

  // Generate ticket summary
  summarizeTicket: (ticketId: string) => {
    return apiClient.post<AIResponse>(`/ai/tickets/${ticketId}/summary`, {});
  },

  // Generate ticket suggestions
  generateSuggestions: (ticketId: string) => {
    return apiClient.post<AIResponse>(`/ai/tickets/${ticketId}/suggestions`, {});
  },

  // Analyze tickets
  analyze: (ticketIds?: string[]) => {
    return apiClient.post<AIResponse>('/ai/analyze', { ticketIds });
  },

  // Generate daily briefing
  dailyBriefing: () => {
    return apiClient.post<AIResponse>('/ai/daily-briefing', {});
  },

  // Test Ollama connection
  testConnection: (url?: string) => {
    return apiClient.post<{ success: boolean; models?: string[]; error?: string }>('/ai/test-connection', { url });
  },
};
