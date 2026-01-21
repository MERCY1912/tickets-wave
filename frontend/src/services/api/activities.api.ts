import { apiClient } from './client.js';
import type { TicketActivity, CreateActivityInput } from '../../types/index.js';

export const activitiesApi = {
  // List all activities
  list: (params: { ticketId?: string; limit?: number; offset?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.ticketId) searchParams.append('ticketId', params.ticketId);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    const query = searchParams.toString();
    return apiClient.get<{
      activities: TicketActivity[];
      pagination: { total: number; limit: number; offset: number; hasMore: boolean };
    }>(`/activities${query ? `?${query}` : ''}`);
  },

  // Get single activity
  get: (id: string) => {
    return apiClient.get<TicketActivity>(`/activities/${id}`);
  },

  // Get activities for a specific ticket
  getByTicket: (ticketId: string, params: { limit?: number; offset?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    const query = searchParams.toString();
    return apiClient.get<{
      activities: TicketActivity[];
      pagination: { total: number; limit: number; offset: number; hasMore: boolean };
    }>(`/activities/tickets/${ticketId}${query ? `?${query}` : ''}`);
  },

  // Create activity for a ticket
  create: (ticketId: string, data: CreateActivityInput) => {
    return apiClient.post<TicketActivity>(`/activities/tickets/${ticketId}`, data);
  },

  // Get recent activities
  getRecent: () => {
    return apiClient.get<TicketActivity[]>('/activities/recent/all');
  },

  // Delete activity
  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/activities/${id}`);
  },
};
