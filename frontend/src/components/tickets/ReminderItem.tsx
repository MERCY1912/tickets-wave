import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useRemindersStore } from '../../store/index.js';
import type { Reminder } from '../../types/index.js';
import { Button } from '../ui/index.js';

interface ReminderItemProps {
  reminder: Reminder;
  compact?: boolean;
}

export function ReminderItem({ reminder, compact = false }: ReminderItemProps) {
  const { triggerReminder, deleteReminder } = useRemindersStore();

  const handleTrigger = async () => {
    await triggerReminder(reminder.id);
  };

  const handleDelete = async () => {
    await deleteReminder(reminder.id);
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.2 }}
        className="p-3 hover:bg-gray-50 dark:hover:bg-accent rounded-lg transition-colors cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {reminder.message && (
              <p className="text-sm font-medium truncate text-gray-900 dark:text-foreground">{reminder.message}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {reminder.ticket && (
                <span className="text-xs text-gray-500 dark:text-muted-foreground truncate">
                  {reminder.ticket.title}
                </span>
              )}
            </div>
          </div>
          <motion.div
            className="flex items-center gap-1"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={handleTrigger}
              className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              title="Mark as done"
            >
              <svg className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-gray-200/50 dark:border-border/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {reminder.autoType && (
              <motion.span
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
              >
                Auto
              </motion.span>
            )}
            <span className="text-xs text-gray-500 dark:text-muted-foreground">
              {format(new Date(reminder.remindAt), 'PPp')}
            </span>
          </div>

          {reminder.message && (
            <p className="text-sm text-gray-900 dark:text-foreground mb-2">{reminder.message}</p>
          )}

          {reminder.ticket && (
            <div className="text-xs text-gray-500 dark:text-muted-foreground">
              Ticket: {reminder.ticket.title}
            </div>
          )}

          {reminder.repeat !== 'none' && (
            <div className="text-xs text-gray-500 dark:text-muted-foreground mt-1 flex items-center gap-1">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Repeats: {reminder.repeat}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!reminder.triggered && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="sm" variant="ghost" onClick={handleTrigger} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
            </motion.div>
          )}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button size="sm" variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
