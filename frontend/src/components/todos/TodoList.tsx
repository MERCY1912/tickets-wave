import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTodosStore } from '../../store';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  maxItems?: number;
}

export function TodoList({ maxItems = 5 }: TodoListProps) {
  const { activeTodos, loading, fetchActiveTodos, toggleTodo, deleteTodo, createTodo } = useTodosStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  useEffect(() => {
    fetchActiveTodos();
  }, []);

  const displayTodos = activeTodos.slice(0, maxItems);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    try {
      await createTodo({
        title: newTodoTitle.trim(),
        priority: newTodoPriority,
        source: 'manual',
      });
      setNewTodoTitle('');
      setNewTodoPriority('MEDIUM');
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to create todo:', error);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-gray-900 dark:text-foreground uppercase tracking-wider">
          Today&apos;s Tasks
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-medium">
            {activeTodos.length}
          </span>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="h-5 w-5 flex items-center justify-center rounded-md bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors"
          >
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Add Todo Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddTodo}
            className="space-y-2"
          >
            <input
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400/50"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <select
                value={newTodoPriority}
                onChange={(e) => setNewTodoPriority(e.target.value as typeof newTodoPriority)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <button
                type="submit"
                disabled={!newTodoTitle.trim() || loading}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Todo List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800/40 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : displayTodos.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">No active tasks</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {displayTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
