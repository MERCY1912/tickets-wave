import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRemindersStore } from '../../store/index.js';
import { ReminderItem } from '../tickets/ReminderItem.js';

function BellIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const { dueReminders, fetchReminders } = useRemindersStore();

  useEffect(() => {
    fetchReminders(false);
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-card/80 backdrop-blur-md border-b border-gray-100/50 dark:border-gray-800/50 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">Support Manager</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-foreground transition-all duration-200 relative"
            aria-label="Notifications"
          >
            <BellIcon />
            {dueReminders.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-card rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 z-50 max-h-96 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-foreground">
                      Due Reminders ({dueReminders.length})
                    </h3>
                  </div>
                  {dueReminders.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No due reminders
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {dueReminders.map((reminder) => (
                        <ReminderItem key={reminder.id} reminder={reminder} compact />
                      ))}
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-sm font-semibold shadow-sm cursor-pointer"
        >
          SM
        </motion.div>
      </div>
    </header>
  );
}
