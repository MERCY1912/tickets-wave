import { apiClient } from './client.js';
import type { Settings } from '../../types/index.js';

export const settingsApi = {
  // Get settings
  get: () => {
    return apiClient.get<Settings>('/settings');
  },

  // Update settings
  update: (data: Partial<Settings>) => {
    return apiClient.put<Settings>('/settings', data);
  },

  // Test AI connection
  testAI: (apiKey?: string) => {
    return apiClient.post<{ success: boolean; models?: string[]; error?: string }>('/settings/ai/test', { apiKey });
  },

  // List AI models
  getAIModels: () => {
    return apiClient.get<{ models: string[] }>('/settings/ai/models');
  },

  // Reset settings to defaults
  reset: () => {
    return apiClient.delete<Settings>('/settings');
  },
};
