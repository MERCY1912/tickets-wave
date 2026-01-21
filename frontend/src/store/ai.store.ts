import { create } from 'zustand';
import { aiApi } from '../services/api/index.js';
import type { AIResponse, ChatContext, ChatMessage } from '../types/index.js';

interface AIState {
  // State
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  healthStatus: {
    healthy: boolean;
    models?: string[];
    error?: string;
  } | null;
  availableModels: string[];

  // Actions
  checkHealth: () => Promise<void>;
  fetchModels: () => Promise<void>;
  sendMessage: (message: string, context?: ChatContext) => Promise<void>;
  clearMessages: () => void;
  summarizeTicket: (ticketId: string) => Promise<AIResponse>;
  generateSuggestions: (ticketId: string) => Promise<AIResponse>;
  analyzeTickets: (ticketIds?: string[]) => Promise<AIResponse>;
  dailyBriefing: () => Promise<AIResponse>;
  testConnection: (url?: string) => Promise<{ success: boolean; models?: string[]; error?: string }>;
  clearError: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  // Initial state
  messages: [],
  loading: false,
  error: null,
  healthStatus: null,
  availableModels: [],

  // Actions
  checkHealth: async () => {
    try {
      const status = await aiApi.getStatus();
      set({ healthStatus: status });
    } catch (error) {
      set({
        healthStatus: {
          healthy: false,
          error: error instanceof Error ? error.message : 'Health check failed',
        },
      });
    }
  },

  fetchModels: async () => {
    try {
      const response = await aiApi.getModels();
      set({ availableModels: response.models });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch models' });
    }
  },

  sendMessage: async (message: string, context?: ChatContext) => {
    set({ loading: true, error: null });

    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: message };
    set(state => ({ messages: [...state.messages, userMessage] }));

    try {
      const response = await aiApi.chat(message, {
        ...context,
        conversationHistory: get().messages,
      });

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
      };
      set(state => ({
        messages: [...state.messages, assistantMessage],
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send message',
        loading: false,
      });
      // Remove the user message on error
      set(state => ({ messages: state.messages.slice(0, -1) }));
      throw error;
    }
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  summarizeTicket: async (ticketId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await aiApi.summarizeTicket(ticketId);
      set({ loading: false });
      return response;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to summarize ticket',
        loading: false,
      });
      throw error;
    }
  },

  generateSuggestions: async (ticketId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await aiApi.generateSuggestions(ticketId);
      set({ loading: false });
      return response;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to generate suggestions',
        loading: false,
      });
      throw error;
    }
  },

  analyzeTickets: async (ticketIds?: string[]) => {
    set({ loading: true, error: null });
    try {
      const response = await aiApi.analyze(ticketIds);
      set({ loading: false });
      return response;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to analyze tickets',
        loading: false,
      });
      throw error;
    }
  },

  dailyBriefing: async () => {
    set({ loading: true, error: null });
    try {
      const response = await aiApi.dailyBriefing();
      set({ loading: false });
      return response;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to generate daily briefing',
        loading: false,
      });
      throw error;
    }
  },

  testConnection: async (url?: string) => {
    try {
      const result = await aiApi.testConnection(url);
      if (result.success && result.models) {
        set({ availableModels: result.models });
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
