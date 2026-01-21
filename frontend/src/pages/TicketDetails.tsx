import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useTicketsStore } from '../store/index.js';
import { Button, Card, CardHeader, CardTitle, CardContent, StatusBadge, PriorityBadge, TagBadge } from '../components/ui/index.js';
import { TicketForm } from '../components/tickets/index.js';

// Icons
function BackIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 12" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTicket, fetchTicket, loading, error } = useTicketsStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicket(id);
    }
  }, [id, fetchTicket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !currentTicket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <svg className="h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-1">
            {error || 'Ticket not found'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {error ? 'Something went wrong' : 'The ticket you are looking for does not exist'}
          </p>
          <Button variant="ghost" onClick={() => navigate('/tickets')}>
            <BackIcon />
            <span className="ml-2">Back to Tickets</span>
          </Button>
        </div>
      </div>
    );
  }

  const gradientColors: Record<string, { from: string; to: string }> = {
    NEW: { from: '#3B82F6', to: '#06B6D4' },
    IN_PROGRESS: { from: '#06B6D4', to: '#14B8A6' },
    WAITING_CLIENT: { from: '#F59E0B', to: '#F97316' },
    BLOCKED: { from: '#EF4444', to: '#DC2626' },
    DONE: { from: '#22C55E', to: '#16A34A' },
    FROZEN: { from: '#6B7280', to: '#4B5563' },
  };

  const gradient = gradientColors[currentTicket.status];

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ x: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/tickets')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
          >
            <BackIcon />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-foreground">Ticket Details</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              ID: <span className="font-mono-tech text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-400">{currentTicket.id}</span>
            </p>
          </div>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button onClick={() => setIsEditModalOpen(true)}>
            <EditIcon />
            <span className="ml-2">Edit Ticket</span>
          </Button>
        </motion.div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left Column - Ticket Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title Card */}
          <Card className="relative overflow-hidden">
            {/* Gradient Top Border */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{
                background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})`,
              }}
            />

            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground flex-1">
                  {currentTicket.title}
                </h2>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <PriorityBadge priority={currentTicket.priority} />
                  <StatusBadge status={currentTicket.status} />
                </div>
              </div>

              {/* Tags */}
              {currentTicket.tags && currentTicket.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentTicket.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description Card */}
          {currentTicket.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {currentTicket.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* AI Notes Card */}
          {currentTicket.aiNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h4M18 12h4" />
                  </svg>
                  AI Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {currentTicket.aiNotes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Activities Card */}
          {currentTicket.activities && currentTicket.activities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ActivityIcon />
                  Activity History ({currentTicket.activities.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentTicket.activities.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0"
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                        <ActivityIcon />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-foreground capitalize">
                            {activity.type.replace(/_/g, ' ').toLowerCase()}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 font-tech">
                            {format(new Date(activity.createdAt), 'MMM d, yyyy • HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
                          {activity.content}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Created */}
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <CalendarIcon />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</p>
                  <p className="text-sm text-gray-900 dark:text-foreground font-tech">
                    {format(new Date(currentTicket.createdAt), 'MMM d, yyyy • HH:mm')}
                  </p>
                </div>
              </div>

              {/* Updated */}
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center flex-shrink-0">
                  <ClockIcon />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Updated</p>
                  <p className="text-sm text-gray-900 dark:text-foreground font-tech">
                    {format(new Date(currentTicket.updatedAt), 'MMM d, yyyy • HH:mm')}
                  </p>
                </div>
              </div>

              {/* Last Activity */}
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                  <ActivityIcon />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Activity</p>
                  <p className="text-sm text-gray-900 dark:text-foreground font-tech">
                    {format(new Date(currentTicket.lastActivityAt), 'MMM d, yyyy • HH:mm')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reminders Card */}
          {currentTicket.reminders && currentTicket.reminders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reminders ({currentTicket.reminders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentTicket.reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase font-tech">
                          {format(new Date(reminder.remindAt), 'MMM d, yyyy • HH:mm')}
                        </span>
                        {reminder.triggered && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                            Triggered
                          </span>
                        )}
                      </div>
                      {reminder.message && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {reminder.message}
                        </p>
                      )}
                      {reminder.autoType && (
                        <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 capitalize">
                          Auto: {reminder.autoType.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </motion.div>

      {/* Edit Modal */}
      <TicketForm
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        ticketId={id || null}
        ticket={currentTicket}
      />
    </div>
  );
}
