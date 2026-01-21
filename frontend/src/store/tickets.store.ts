import { create } from 'zustand';
import { ticketsApi } from '../services/api/index.js';
import type {
  Ticket,
  TicketListParams,
  CreateTicketInput,
  UpdateTicketInput,
  DashboardStats,
} from '../types/index.js';

interface TicketsState {
  // State
  tickets: Ticket[];
  currentTicket: Ticket | null;
  dashboardStats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };

  // Actions
  fetchTickets: (params?: TicketListParams) => Promise<void>;
  fetchTicket: (id: string) => Promise<void>;
  createTicket: (data: CreateTicketInput) => Promise<Ticket>;
  updateTicket: (id: string, data: UpdateTicketInput) => Promise<void>;
  updateTicketStatus: (id: string, status: string) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  setCurrentTicket: (ticket: Ticket | null) => void;
  clearError: () => void;
}

export const useTicketsStore = create<TicketsState>((set) => ({
  // Initial state
  tickets: [],
  currentTicket: null,
  dashboardStats: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  },

  // Actions
  fetchTickets: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await ticketsApi.list(params);
      set({
        tickets: response.tickets,
        pagination: response.pagination,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch tickets',
        loading: false,
      });
    }
  },

  fetchTicket: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const ticket = await ticketsApi.get(id);
      set({ currentTicket: ticket, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch ticket',
        loading: false,
      });
    }
  },

  createTicket: async (data: CreateTicketInput) => {
    set({ loading: true, error: null });
    try {
      const ticket = await ticketsApi.create(data);
      set(state => ({
        tickets: [ticket, ...state.tickets],
        currentTicket: ticket,
        loading: false,
      }));
      return ticket;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create ticket',
        loading: false,
      });
      throw error;
    }
  },

  updateTicket: async (id: string, data: UpdateTicketInput) => {
    set({ loading: true, error: null });
    try {
      const ticket = await ticketsApi.update(id, data);
      set(state => ({
        tickets: state.tickets.map(t => (t.id === id ? ticket : t)),
        currentTicket: state.currentTicket?.id === id ? ticket : state.currentTicket,
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update ticket',
        loading: false,
      });
      throw error;
    }
  },

  updateTicketStatus: async (id: string, status: string) => {
    set({ loading: true, error: null });
    try {
      const ticket = await ticketsApi.updateStatus(id, status);
      set(state => ({
        tickets: state.tickets.map(t => (t.id === id ? ticket : t)),
        currentTicket: state.currentTicket?.id === id ? ticket : state.currentTicket,
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update ticket status',
        loading: false,
      });
      throw error;
    }
  },

  deleteTicket: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await ticketsApi.delete(id);
      set(state => ({
        tickets: state.tickets.filter(t => t.id !== id),
        currentTicket: state.currentTicket?.id === id ? null : state.currentTicket,
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete ticket',
        loading: false,
      });
      throw error;
    }
  },

  fetchDashboardStats: async () => {
    set({ loading: true, error: null });
    try {
      const stats = await ticketsApi.getDashboardStats();
      set({ dashboardStats: stats, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats',
        loading: false,
      });
    }
  },

  setCurrentTicket: (ticket: Ticket | null) => {
    set({ currentTicket: ticket });
  },

  clearError: () => {
    set({ error: null });
  },
}));
