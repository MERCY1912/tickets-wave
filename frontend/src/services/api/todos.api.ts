import { apiClient } from './client.js';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../types/index.js';

export const todosApi = {
  // List all todos
  list: (params: { completed?: boolean } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.completed !== undefined) searchParams.append('completed', params.completed.toString());

    const query = searchParams.toString();
    return apiClient.get<Todo[]>(`/todos${query ? `?${query}` : ''}`);
  },

  // Get active (not completed) todos
  getActive: () => {
    return apiClient.get<Todo[]>('/todos/active');
  },

  // Get single todo
  get: (id: string) => {
    return apiClient.get<Todo>(`/todos/${id}`);
  },

  // Create todo
  create: (data: CreateTodoInput) => {
    return apiClient.post<Todo>('/todos', data);
  },

  // Toggle todo completion
  toggle: (id: string, completed: boolean) => {
    return apiClient.patch<Todo>(`/todos/${id}/toggle`, { completed });
  },

  // Update todo
  update: (id: string, data: UpdateTodoInput) => {
    return apiClient.put<Todo>(`/todos/${id}`, data);
  },

  // Delete todo
  delete: (id: string) => {
    return apiClient.delete<void>(`/todos/${id}`);
  },

  // Generate todos from AI morning report
  fromAI: (report: string) => {
    return apiClient.post<{ count: number; todos: Todo[]; message?: string }>('/todos/from-ai', { report });
  },
};
