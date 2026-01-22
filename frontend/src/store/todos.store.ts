import { create } from 'zustand';
import { todosApi } from '../services/api/index.js';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../types/index.js';

interface TodosState {
  todos: Todo[];
  activeTodos: Todo[];
  loading: boolean;
  error: string | null;

  fetchTodos: (completed?: boolean) => Promise<void>;
  fetchActiveTodos: () => Promise<void>;
  createTodo: (data: CreateTodoInput) => Promise<void>;
  toggleTodo: (id: string, completed: boolean) => Promise<void>;
  updateTodo: (id: string, data: UpdateTodoInput) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  fromAI: (report: string) => Promise<{ count: number; message?: string }>;
  clearError: () => void;
}

export const useTodosStore = create<TodosState>((set, get) => ({
  todos: [],
  activeTodos: [],
  loading: false,
  error: null,

  fetchTodos: async (completed?: boolean) => {
    set({ loading: true, error: null });
    try {
      const todos = await todosApi.list({ completed });
      set({ todos, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch todos',
        loading: false,
      });
    }
  },

  fetchActiveTodos: async () => {
    set({ loading: true, error: null });
    try {
      const todos = await todosApi.getActive();
      set({ activeTodos: todos, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch active todos',
        loading: false,
      });
    }
  },

  createTodo: async (data: CreateTodoInput) => {
    set({ loading: true, error: null });
    try {
      await todosApi.create(data);
      await get().fetchActiveTodos();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create todo',
        loading: false,
      });
      throw error;
    }
  },

  toggleTodo: async (id: string, completed: boolean) => {
    set({ loading: true, error: null });
    try {
      await todosApi.toggle(id, completed);
      await get().fetchActiveTodos();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to toggle todo',
        loading: false,
      });
      throw error;
    }
  },

  updateTodo: async (id: string, data: UpdateTodoInput) => {
    set({ loading: true, error: null });
    try {
      const todo = await todosApi.update(id, data);
      set(state => ({
        todos: state.todos.map(t => (t.id === id ? todo : t)),
        activeTodos: state.activeTodos.map(t => (t.id === id ? todo : t)),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update todo',
        loading: false,
      });
      throw error;
    }
  },

  deleteTodo: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await todosApi.delete(id);
      await get().fetchActiveTodos();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete todo',
        loading: false,
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  fromAI: async (report: string) => {
    set({ loading: true, error: null });
    try {
      const response = await todosApi.fromAI(report);
      await get().fetchActiveTodos();
      return { count: response.count, message: response.message };
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create todos from AI report',
        loading: false,
      });
      throw error;
    }
  },
}));
