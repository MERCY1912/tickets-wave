import { apiClient } from './client.js';
import type {
  Reminder,
  CreateReminderInput,
  UpdateReminderInput,
} from '../../types/index.js';

export const remindersApi = {
  // List all reminders
  list: (params: { triggered?: boolean; limit?: number; offset?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.triggered !== undefined) searchParams.append('triggered', params.triggered.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    const query = searchParams.toString();
    return apiClient.get<{
      reminders: Reminder[];
      pagination: { total: number; limit: number; offset: number; hasMore: boolean };
    }>(`/reminders${query ? `?${query}` : ''}`);
  },

  // Get due reminders
  getDue: () => {
    return apiClient.get<Reminder[]>('/reminders/due');
  },

  // Get upcoming reminders (next 7 days)
  getUpcoming: () => {
    return apiClient.get<Reminder[]>('/reminders/upcoming');
  },

  // Get single reminder
  get: (id: string) => {
    return apiClient.get<Reminder>(`/reminders/${id}`);
  },

  // Create reminder
  create: (data: CreateReminderInput) => {
    return apiClient.post<Reminder>('/reminders', data);
  },

  // Update reminder
  update: (id: string, data: UpdateReminderInput) => {
    return apiClient.put<Reminder>(`/reminders/${id}`, data);
  },

  // Mark reminder as triggered
  trigger: (id: string) => {
    return apiClient.post<Reminder>(`/reminders/${id}/trigger`, {});
  },

  // Delete reminder
  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/reminders/${id}`);
  },

  // Generate automatic reminders
  generateAuto: () => {
    return apiClient.post<{ created: number; reminders: Reminder[] }>('/reminders/auto/generate', {});
  },
};
