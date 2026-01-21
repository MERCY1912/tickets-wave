import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek } from 'date-fns';
import { useRemindersStore } from '../store/index.js';
import { Card, Button } from '../components/ui/index.js';

export default function Calendar() {
  const { reminders, fetchReminders } = useRemindersStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchReminders(false);
  }, [fetchReminders]);

  const monthStart = startOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: endOfMonth(monthStart) });

  const getRemindersForDay = (day: Date) => {
    return reminders.filter(r => isSameDay(new Date(r.remindAt), day));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Calendar</h1>
          <p className="text-gray-600 dark:text-muted-foreground">
            View your reminders and upcoming deadlines
          </p>
        </div>
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden">
          {/* Month Navigation */}
          <div className="p-4 border-b border-gray-200 dark:border-border flex items-center justify-between bg-white dark:bg-card">
            <motion.div whileHover={{ x: -2 }} whileTap={{ x: 0 }}>
              <Button variant="ghost" size="sm" onClick={prevMonth}>
                ← Previous
              </Button>
            </motion.div>
            <motion.h2
              className="text-lg font-semibold text-gray-900 dark:text-foreground"
              key={currentDate.getMonth()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {format(currentDate, 'MMMM yyyy')}
            </motion.h2>
            <motion.div whileHover={{ x: 2 }} whileTap={{ x: 0 }}>
              <Button variant="ghost" size="sm" onClick={nextMonth}>
                Next →
              </Button>
            </motion.div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4 bg-gray-50/50 dark:bg-background">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.02 }}
                  className="text-center text-sm font-medium text-gray-500 dark:text-muted-foreground"
                >
                  {day}
                </motion.div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const dayReminders = getRemindersForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.01, duration: 0.15 }}
                    whileHover={{ scale: isCurrentMonth ? 1.02 : 1 }}
                    className={`min-h-[80px] p-2 rounded-lg border transition-all ${
                      isCurrentMonth
                        ? 'bg-white dark:bg-card shadow-sm hover:shadow-md cursor-pointer'
                        : 'bg-gray-100/50 dark:bg-muted/20'
                    } ${isToday ? 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30' : 'border-gray-200 dark:border-border'}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentMonth ? 'text-gray-900 dark:text-foreground' : 'text-gray-400 dark:text-muted-foreground'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayReminders.slice(0, 2).map((reminder) => (
                        <motion.div
                          key={reminder.id}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 truncate border border-blue-200 dark:border-blue-800/50"
                          title={reminder.message || undefined}
                        >
                          {reminder.message || 'Reminder'}
                        </motion.div>
                      ))}
                      {dayReminders.length > 2 && (
                        <div className="text-xs text-gray-500 dark:text-muted-foreground">
                          +{dayReminders.length - 2} more
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Upcoming Reminders List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-foreground">Upcoming Reminders</h2>
        <div className="space-y-2">
          {reminders
            .filter(r => new Date(r.remindAt) >= new Date())
            .sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime())
            .slice(0, 5)
            .map((reminder, index) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + index * 0.05 }}
                whileHover={{ x: 2 }}
              >
                <Card className="p-3 hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-foreground">{reminder.message || 'Untitled Reminder'}</p>
                      <p className="text-sm text-gray-600 dark:text-muted-foreground">
                        {format(new Date(reminder.remindAt), 'PPp')}
                      </p>
                    </div>
                    {reminder.ticket && (
                      <div className="text-sm text-gray-500 dark:text-muted-foreground">
                        {reminder.ticket.title}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
        </div>
      </motion.div>
    </div>
  );
}
