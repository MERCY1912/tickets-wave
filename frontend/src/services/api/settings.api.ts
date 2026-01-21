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

  // Test Ollama connection
  testOllama: (url?: string) => {
    return apiClient.post<{ success: boolean; models?: string[]; error?: string }>('/settings/ollama/test', { url });
  },

  // List Ollama models
  getOllamaModels: () => {
    return apiClient.get<{ models: string[] }>('/settings/ollama/models');
  },

  // Reset settings to defaults
  reset: () => {
    return apiClient.delete<Settings>('/settings');
  },
};
