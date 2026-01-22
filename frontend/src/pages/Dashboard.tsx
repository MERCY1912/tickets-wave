import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTicketsStore, useRemindersStore, useAIStore, useTodosStore } from '../store/index.js';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/ui/index.js';
import { TicketList, ReminderItem } from '../components/tickets/index.js';
import { useNavigate } from 'react-router-dom';
import MarkdownRenderer from '../components/MarkdownRenderer.js';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

// Stat card component with icon - Premium SaaS style
function StatCard({
  label,
  value,
  icon,
  color,
  trend,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'violet' | 'indigo' | 'amber' | 'rose';
  trend?: 'up' | 'down' | 'neutral';
}) {
  const colorStyles = {
    violet: 'bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 text-violet-600 dark:text-violet-400 ring-1 ring-violet-100/50 dark:ring-violet-900/30',
    indigo: 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-100/50 dark:ring-indigo-900/30',
    amber: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40 text-amber-600 dark:text-amber-400 ring-1 ring-amber-100/50 dark:ring-amber-900/30',
    rose: 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40 text-rose-600 dark:text-rose-400 ring-1 ring-rose-100/50 dark:ring-rose-900/30',
  };

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="group bg-white dark:bg-card rounded-[20px] p-6 transition-all duration-300 cursor-default border border-gray-200/50 dark:border-gray-800/50 hover:border-violet-200/50 dark:hover:border-violet-800/30"
      style={{
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{label}</p>
          <motion.p
            className="text-3xl font-bold tracking-tight text-gray-900 dark:text-foreground leading-none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            {value}
          </motion.p>
        </div>
        <div className={`h-12 w-12 rounded-2xl ${colorStyles[color]} flex items-center justify-center transition-transform group-hover:scale-105`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

// Icons - Premium strokes
function TicketIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}

function NewIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="16" />
      <line x1="8" x2="16" y1="12" y2="12" />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { dashboardStats, fetchDashboardStats } = useTicketsStore();
  const { dueReminders, fetchDueReminders } = useRemindersStore();
  const { dailyBriefing, loading: aiLoading } = useAIStore();
  const { fromAI } = useTodosStore();

  const [briefing, setBriefing] = useState<string | null>(null);
  const [addingTodos, setAddingTodos] = useState(false);
  const [todoResult, setTodoResult] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
    fetchDueReminders();
  }, [fetchDashboardStats, fetchDueReminders]);

  const handleGenerateBriefing = async () => {
    try {
      const result = await dailyBriefing();
      setBriefing(result.response);
      setTodoResult(null);
    } catch (error) {
      console.error('Failed to generate briefing:', error);
    }
  };

  const handleAddToTodos = async () => {
    if (!briefing) return;
    setAddingTodos(true);
    setTodoResult(null);
    try {
      const result = await fromAI(briefing);
      if (result.count > 0) {
        setTodoResult(`Added ${result.count} task${result.count > 1 ? 's' : ''} to Today's Tasks`);
      } else {
        setTodoResult(result.message || 'No actionable items found');
      }
    } catch (error) {
      console.error('Failed to add todos:', error);
      setTodoResult('Failed to add todos');
    } finally {
      setAddingTodos(false);
    }
  };

  const stats = dashboardStats;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-foreground">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Welcome back! Here's what's happening with your tickets.
          </p>
        </div>
      </motion.div>

      {/* Stats Grid - All 4 cards in one row */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {/* Stat Cards */}
        {stats && (
          <>
            <StatCard
              label="Total Tickets"
              value={stats.total}
              icon={<TicketIcon />}
              color="violet"
            />
            <StatCard
              label="New"
              value={stats.byStatus.NEW || 0}
              icon={<NewIcon />}
              color="indigo"
            />
            <StatCard
              label="In Progress"
              value={stats.byStatus.IN_PROGRESS || 0}
              icon={<ProgressIcon />}
              color="amber"
            />
            <StatCard
              label="Stagnant"
              value={stats.stagnantCount}
              icon={<AlertIcon />}
              color="rose"
            />
          </>
        )}
      </motion.div>

      {/* AI Morning Report - Glassmorphism premium card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileHover={{ y: -2 }}
        className="transition-all duration-300"
      >
        <div className="glass-ai rounded-[20px] overflow-hidden">
          {/* Content */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-400 flex items-center justify-center shadow-lg shadow-violet-400/30">
                  <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="m2 17 10 5 10-5" />
                    <path d="m2 12 10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-foreground flex items-center gap-2">
                    AI Morning Report
                    <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-medium">AI</span>
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered daily overview</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {briefing && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddToTodos}
                      disabled={addingTodos}
                      className="border-violet-300 dark:border-violet-700 text-white hover:bg-violet-50 dark:hover:bg-violet-950/30"
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                      </svg>
                      {addingTodos ? 'Adding...' : 'Add to TODOs'}
                    </Button>
                  </motion.div>
                )}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="sm"
                    onClick={handleGenerateBriefing}
                    isLoading={aiLoading}
                    className="bg-gradient-to-r from-violet-400 to-indigo-400 text-white hover:from-violet-500 hover:to-indigo-500 border border-violet-300/30 shadow-md shadow-violet-400/30"
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 12" />
                      <path d="M21 3v9h-9" />
                    </svg>
                    Refresh
                  </Button>
                </motion.div>
              </div>
            </div>

            {!briefing ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 flex items-center justify-center mb-5 ring-1 ring-violet-100/50 dark:ring-violet-900/30">
                  <svg className="h-10 w-10 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="m2 17 10 5 10-5" />
                    <path d="m2 12 10 5 10-5" />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-foreground mb-2">Start your day informed</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm">Generate your AI-powered morning report to get insights on your tickets</p>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={handleGenerateBriefing} isLoading={aiLoading} className="bg-gradient-to-r from-violet-400 to-indigo-400 text-white border-0 shadow-md shadow-violet-500/25">
                    Generate Report
                  </Button>
                </motion.div>
              </div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  <MarkdownRenderer>{briefing}</MarkdownRenderer>
                </motion.div>
                {/* Todo result feedback */}
                {todoResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-3 rounded-xl text-sm ${
                      todoResult.includes('Failed') || todoResult.includes('No actionable')
                        ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {todoResult}
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Recent Tickets */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-foreground">Recent Tickets</h2>
          <motion.div whileHover={{ x: 2 }} whileTap={{ x: 0 }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')} className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/30">
              View All →
            </Button>
          </motion.div>
        </div>
        <TicketList />
      </motion.div>

      {/* Due Reminders */}
      {dueReminders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold tracking-tight mb-5 text-gray-900 dark:text-foreground">Due Reminders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {dueReminders.slice(0, 4).map((reminder, index) => (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
              >
                <ReminderItem reminder={reminder} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
