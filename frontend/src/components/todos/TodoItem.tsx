import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { priorityColors } from '../../utils/priorityColors';
import type { Todo } from '../../types/index.js';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`group flex items-start gap-3 p-2.5 rounded-xl transition-all ${
        todo.completed
          ? 'bg-gray-50/50 dark:bg-gray-800/30 opacity-60'
          : 'bg-white dark:bg-gray-800/60 hover:shadow-md'
      }`}
    >
      {/* Priority Dot */}
      <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${priorityColors[todo.priority]}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium truncate ${
            todo.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-foreground'
          }`}>
            {todo.title}
          </p>
          {todo.source === 'ai_morning_report' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
              AI
            </span>
          )}
        </div>
        {todo.ticketId && (
          <Link
            to={`/tickets/${todo.ticketId}`}
            className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline"
          >
            {todo.ticket?.title || 'Linked ticket'}
          </Link>
        )}
      </div>

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={(e) => onToggle(todo.id, e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
      />

      {/* Delete Button (hover) */}
      <button
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </motion.div>
  );
}
