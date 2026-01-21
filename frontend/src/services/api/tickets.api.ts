import { apiClient } from './client.js';
import type {
  Ticket,
  TicketListParams,
  TicketListResponse,
  DashboardStats,
  CreateTicketInput,
  UpdateTicketInput,
} from '../../types/index.js';

export const ticketsApi = {
  // List tickets with filters
  list: (params: TicketListParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.append('status', params.status);
    if (params.priority) searchParams.append('priority', params.priority);
    if (params.tag) searchParams.append('tag', params.tag);
    if (params.search) searchParams.append('search', params.search);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    const query = searchParams.toString();
    return apiClient.get<TicketListResponse>(`/tickets${query ? `?${query}` : ''}`);
  },

  // Get single ticket
  get: (id: string) => {
    return apiClient.get<Ticket>(`/tickets/${id}`);
  },

  // Create ticket
  create: (data: CreateTicketInput) => {
    return apiClient.post<Ticket>('/tickets', data);
  },

  // Update ticket
  update: (id: string, data: UpdateTicketInput) => {
    return apiClient.put<Ticket>(`/tickets/${id}`, data);
  },

  // Update ticket status
  updateStatus: (id: string, status: string) => {
    return apiClient.patch<Ticket>(`/tickets/${id}/status`, { status });
  },

  // Delete ticket
  delete: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/tickets/${id}`);
  },

  // Get dashboard stats
  getDashboardStats: () => {
    return apiClient.get<DashboardStats>('/tickets/stats/dashboard');
  },
};
