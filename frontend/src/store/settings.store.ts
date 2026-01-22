import { create } from 'zustand';
import { settingsApi } from '../services/api/index.js';
import type { Settings } from '../types/index.js';

interface SettingsState {
  // State
  deepseekModel: string;
  deepseekTemperature: number;
  aiSystemPrompt: string | null;
  hasApiKey: boolean;
  reminderStagnantDays: number;
  reminderWaitingClientDays: number;
  reminderHighPriorityDays: number;
  reminderOldTicketDays: number;
  aiAnalysisInterval: number;
  theme: 'light' | 'dark';
  updatedAt: string;
  loading: boolean;
  error: string | null;
  isDirty: boolean;

  // Actions
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<Settings>) => Promise<void>;
  testAIConnection: (apiKey?: string) => Promise<{ success: boolean; models?: string[]; error?: string }>;
  getAIModels: () => Promise<string[]>;
  resetSettings: () => Promise<void>;
  clearError: () => void;
}

const defaultSettings = {
  deepseekModel: 'deepseek-chat',
  deepseekTemperature: 0.7,
  aiSystemPrompt: null,
  hasApiKey: false,
  reminderStagnantDays: 5,
  reminderWaitingClientDays: 3,
  reminderHighPriorityDays: 2,
  reminderOldTicketDays: 14,
  aiAnalysisInterval: 4,
  theme: 'dark' as const,
  updatedAt: new Date().toISOString(),
};

export const useSettingsStore = create<SettingsState>((set) => ({
  // Initial state
  ...defaultSettings,
  loading: false,
  error: null,
  isDirty: false,

  // Actions
  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const settings = await settingsApi.get();
      set({ ...settings, loading: false, isDirty: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch settings',
        loading: false,
      });
    }
  },

  updateSettings: async (data: Partial<Settings>) => {
    set({ loading: true, error: null });
    try {
      const settings = await settingsApi.update(data);
      set({ ...settings, loading: false, isDirty: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update settings',
        loading: false,
      });
      throw error;
    }
  },

  testAIConnection: async (apiKey) => {
    try {
      return await settingsApi.testAI(apiKey);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  getAIModels: async () => {
    try {
      const response = await settingsApi.getAIModels();
      return response.models;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch models',
      });
      return [];
    }
  },

  resetSettings: async () => {
    set({ loading: true, error: null });
    try {
      const settings = await settingsApi.reset();
      set({ ...settings, loading: false, isDirty: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reset settings',
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
