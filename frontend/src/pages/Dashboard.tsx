import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTicketsStore, useRemindersStore, useAIStore } from '../store/index.js';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../components/ui/index.js';
import { TicketList, ReminderItem } from '../components/tickets/index.js';
import { useNavigate } from 'react-router-dom';

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

// Stat card component with icon
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
  color: 'blue' | 'cyan' | 'amber' | 'red';
  trend?: 'up' | 'down' | 'neutral';
}) {
  const colorStyles = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  };

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-card rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default"
      style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</p>
          <motion.p
            className="text-3xl font-bold text-gray-900 dark:text-foreground leading-none"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {value}
          </motion.p>
        </div>
        <div className={`h-11 w-11 rounded-xl ${colorStyles[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

// Icons
function TicketIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}

function NewIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="16" />
      <line x1="8" x2="16" y1="12" y2="12" />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

  const [briefing, setBriefing] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
    fetchDueReminders();
  }, [fetchDashboardStats, fetchDueReminders]);

  const handleGenerateBriefing = async () => {
    try {
      const result = await dailyBriefing();
      setBriefing(result.response);
    } catch (error) {
      console.error('Failed to generate briefing:', error);
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            Welcome back! Here's what's happening with your tickets.
          </p>
        </div>
      </motion.div>

      {/* Stats Grid - All 4 cards in one row */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Stat Cards */}
        {stats && (
          <>
            <StatCard
              label="Total Tickets"
              value={stats.total}
              icon={<TicketIcon />}
              color="blue"
            />
            <StatCard
              label="New"
              value={stats.byStatus.NEW || 0}
              icon={<NewIcon />}
              color="cyan"
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
              color="red"
            />
          </>
        )}
      </motion.div>

      {/* Morning Report Card - Full width */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileHover={{ y: -1 }}
        className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
      >
        <div className="bg-gradient-to-br from-indigo-50 via-white to-white dark:from-indigo-950/30 dark:via-card dark:to-card rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden relative">
          {/* Animated Gradient Border */}
          <div className="absolute inset-0 rounded-2xl p-[2px]">
            <div className="w-full h-full rounded-2xl bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 opacity-20" />
          </div>
          <div className="absolute inset-[2px] rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-white dark:from-indigo-950/30 dark:via-card dark:to-card" />

          {/* Inner glow effect */}
          <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_60px_-15px_rgba(139,92,246,0.15)]" />

          {/* Content container - relative to sit on top */}
          <div className="relative z-10">
            {/* Premium Gradient Header */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-lg">✨</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      AI Morning Report
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white/90">AI</span>
                    </h3>
                    <p className="text-xs text-white/90">AI-powered daily overview</p>
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="sm"
                    onClick={handleGenerateBriefing}
                    isLoading={aiLoading}
                    className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border-0"
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

            {/* Content */}
            <div className="p-6">
              {!briefing ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-16 w-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 0-3 3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76-3.76a1 1 0 0 0-1.4 0l-1.6 1.6a1 1 0 0 0 0 1.4l3.76 3.76a1 1 0 0 0 1.4-3.77l-6.91-6.91a2.12 2.12 0 0 1 3-3l6.91 6.91a6 6 0 0 0 7.94-7.94Z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 dark:text-foreground mb-1">No briefing yet</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Generate your AI-powered morning report</p>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button onClick={handleGenerateBriefing} isLoading={aiLoading}>
                      Generate Report
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-4">
                  {briefing.split('\n\n').map((paragraph, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex gap-3"
                    >
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        paragraph.includes('focus') || paragraph.includes('priority') || paragraph.includes('attention')
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {paragraph.includes('focus') || paragraph.includes('priority') || paragraph.includes('attention') ? (
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" x2="12" y1="8" y2="12" />
                          </svg>
                        ) : (
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{paragraph}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
          </div>
      </motion.div>

      {/* Recent Tickets */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">Recent Tickets</h2>
          <motion.div whileHover={{ x: 2 }} whileTap={{ x: 0 }}>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>
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
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-foreground">Due Reminders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
