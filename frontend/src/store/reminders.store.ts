import { create } from 'zustand';
import { remindersApi } from '../services/api/index.js';
import type { Reminder, CreateReminderInput, UpdateReminderInput } from '../types/index.js';

interface RemindersState {
  // State
  reminders: Reminder[];
  dueReminders: Reminder[];
  upcomingReminders: Reminder[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchReminders: (triggered?: boolean) => Promise<void>;
  fetchDueReminders: () => Promise<void>;
  fetchUpcomingReminders: () => Promise<void>;
  createReminder: (data: CreateReminderInput) => Promise<void>;
  updateReminder: (id: string, data: UpdateReminderInput) => Promise<void>;
  triggerReminder: (id: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  generateAutoReminders: () => Promise<void>;
  clearError: () => void;
}

export const useRemindersStore = create<RemindersState>((set) => ({
  // Initial state
  reminders: [],
  dueReminders: [],
  upcomingReminders: [],
  loading: false,
  error: null,

  // Actions
  fetchReminders: async (triggered) => {
    set({ loading: true, error: null });
    try {
      const response = await remindersApi.list({ triggered });
      set({ reminders: response.reminders, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch reminders',
        loading: false,
      });
    }
  },

  fetchDueReminders: async () => {
    set({ loading: true, error: null });
    try {
      const reminders = await remindersApi.getDue();
      set({ dueReminders: reminders, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch due reminders',
        loading: false,
      });
    }
  },

  fetchUpcomingReminders: async () => {
    set({ loading: true, error: null });
    try {
      const reminders = await remindersApi.getUpcoming();
      set({ upcomingReminders: reminders, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch upcoming reminders',
        loading: false,
      });
    }
  },

  createReminder: async (data: CreateReminderInput) => {
    set({ loading: true, error: null });
    try {
      const reminder = await remindersApi.create(data);
      set(state => ({
        reminders: [...state.reminders, reminder],
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create reminder',
        loading: false,
      });
      throw error;
    }
  },

  updateReminder: async (id: string, data: UpdateReminderInput) => {
    set({ loading: true, error: null });
    try {
      const reminder = await remindersApi.update(id, data);
      set(state => ({
        reminders: state.reminders.map(r => (r.id === id ? reminder : r)),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update reminder',
        loading: false,
      });
      throw error;
    }
  },

  triggerReminder: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await remindersApi.trigger(id);
      set(state => ({
        dueReminders: state.dueReminders.filter(r => r.id !== id),
        reminders: state.reminders.map(r =>
          r.id === id ? { ...r, triggered: true } : r
        ),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to trigger reminder',
        loading: false,
      });
      throw error;
    }
  },

  deleteReminder: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await remindersApi.delete(id);
      set(state => ({
        reminders: state.reminders.filter(r => r.id !== id),
        dueReminders: state.dueReminders.filter(r => r.id !== id),
        upcomingReminders: state.upcomingReminders.filter(r => r.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete reminder',
        loading: false,
      });
      throw error;
    }
  },

  generateAutoReminders: async () => {
    set({ loading: true, error: null });
    try {
      const response = await remindersApi.generateAuto();
      set(state => ({
        reminders: [...state.reminders, ...response.reminders],
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to generate auto reminders',
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
