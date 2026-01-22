import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Ticket } from '../../types/index.js';
import { StatusBadge, PriorityBadge, Card } from '../ui/index.js';

// Status gradient colors - pastel colors matching Kanban
const statusGradient: Record<Ticket['status'], { from: string; to: string }> = {
  NEW: { from: '#8B5CF6', to: '#6366F1' },        // Violet to Indigo
  IN_PROGRESS: { from: '#06B6D4', to: '#14B8A6' }, // Cyan to Teal
  WAITING_CLIENT: { from: '#F59E0B', to: '#F97316' }, // Amber to Orange
  BLOCKED: { from: '#EF4444', to: '#F43F5E' },     // Red to Rose
  DONE: { from: '#10B981', to: '#22C55E' },       // Emerald to Green
  FROZEN: { from: '#6B7280', to: '#4B5563' },     // Gray to Dark Gray
};

interface TicketCardProps {
  ticket: Ticket;
}

// Highlight types for visual attention
interface TicketHighlight {
  type: 'priority' | 'sla-risk' | 'sentiment' | null;
  level: 'subtle' | 'moderate' | 'critical';
}

// Calculate ticket highlight based on priority, age, and status
function getTicketHighlight(ticket: Ticket): TicketHighlight {
  const daysSinceActivity = Math.floor(
    (Date.now() - new Date(ticket.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Critical priority - most urgent
  if (ticket.priority === 'CRITICAL') {
    return { type: 'priority', level: 'critical' };
  }

  // High priority
  if (ticket.priority === 'HIGH') {
    return { type: 'priority', level: 'moderate' };
  }

  // Blocked status - negative sentiment
  if (ticket.status === 'BLOCKED') {
    return { type: 'sentiment', level: 'moderate' };
  }

  // SLA risk - stagnant tickets (no activity for 7+ days)
  if (daysSinceActivity >= 7) {
    return { type: 'sla-risk', level: daysSinceActivity >= 14 ? 'critical' : 'moderate' };
  }

  // Waiting too long (5+ days)
  if (ticket.status === 'WAITING_CLIENT' && daysSinceActivity >= 5) {
    return { type: 'sla-risk', level: 'subtle' };
  }

  return { type: null, level: 'subtle' };
}

// Get highlight styles based on type and level
function getHighlightStyles(highlight: TicketHighlight) {
  if (!highlight.type) return null;

  const baseStyles = {
    priority: {
      subtle: {
        glow: 'shadow-amber-100/50 dark:shadow-amber-900/20',
        accent: 'bg-amber-100/50 dark:bg-amber-900/20',
        border: 'border-amber-200/50 dark:border-amber-800/30',
      },
      moderate: {
        glow: 'shadow-orange-200/60 dark:shadow-orange-900/30',
        accent: 'bg-orange-100/60 dark:bg-orange-900/30',
        border: 'border-orange-300/60 dark:border-orange-800/40',
      },
      critical: {
        glow: 'shadow-red-300/70 dark:shadow-red-900/40',
        accent: 'bg-red-100/70 dark:bg-red-900/40',
        border: 'border-red-400/70 dark:border-red-800/50',
      },
    },
    'sla-risk': {
      subtle: {
        glow: 'shadow-blue-100/50 dark:shadow-blue-900/20',
        accent: 'bg-blue-50/50 dark:bg-blue-900/20',
        border: 'border-blue-200/40 dark:border-blue-800/30',
      },
      moderate: {
        glow: 'shadow-indigo-200/60 dark:shadow-indigo-900/30',
        accent: 'bg-indigo-100/60 dark:bg-indigo-900/30',
        border: 'border-indigo-300/60 dark:border-indigo-800/40',
      },
      critical: {
        glow: 'shadow-violet-300/70 dark:shadow-violet-900/40',
        accent: 'bg-violet-100/70 dark:bg-violet-900/40',
        border: 'border-violet-400/70 dark:border-violet-800/50',
      },
    },
    sentiment: {
      subtle: {
        glow: 'shadow-rose-100/50 dark:shadow-rose-900/20',
        accent: 'bg-rose-50/50 dark:bg-rose-900/20',
        border: 'border-rose-200/40 dark:border-rose-800/30',
      },
      moderate: {
        glow: 'shadow-red-200/60 dark:shadow-red-900/30',
        accent: 'bg-red-100/60 dark:bg-red-900/30',
        border: 'border-red-300/60 dark:border-red-800/40',
      },
      critical: {
        glow: 'shadow-red-300/70 dark:shadow-red-900/40',
        accent: 'bg-red-100/70 dark:bg-red-900/40',
        border: 'border-red-400/70 dark:border-red-800/50',
      },
    },
  };

  return baseStyles[highlight.type][highlight.level];
}

function CalendarIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function TicketCard({ ticket }: TicketCardProps) {
  const navigate = useNavigate();
  const highlight = getTicketHighlight(ticket);
  const highlightStyles = getHighlightStyles(highlight);
  const gradient = statusGradient[ticket.status];

  // Generate assignee initials from ticket title
  const getInitials = (title: string) => {
    const words = title.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return title.slice(0, 2).toUpperCase();
  };

  const assigneeInitials = getInitials(ticket.title);
  const shouldPulse = highlight.level === 'critical';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="relative"
      onClick={() => navigate(`/tickets/${ticket.id}`)}
    >
      <div
        className={`bg-white dark:bg-card rounded-[20px] p-4 transition-all duration-300 cursor-pointer group relative overflow-hidden border ${
          highlightStyles
            ? `${highlightStyles.border} ${highlightStyles.accent}`
            : 'border-gray-200/50 dark:border-gray-800/50 hover:border-violet-200/50 dark:hover:border-violet-800/30'
        }`}
        style={{
          boxShadow: highlightStyles
            ? `0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03), 0 0 0 1px ${highlightStyles.accent.split(' ')[0].replace('bg-', '')}20`
            : '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Subtle accent glow on top for highlighted tickets */}
        {highlight && highlightStyles && (
          <motion.div
            className={`absolute top-0 left-4 right-4 h-[1px] ${highlightStyles.accent} rounded-full`}
            animate={shouldPulse ? { opacity: [0.4, 0.8, 0.4] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Gradient Border - appears on hover */}
        <div className="absolute inset-0 rounded-[20px] p-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-full h-full rounded-[20px] bg-gradient-to-r from-violet-300 via-violet-300 to-indigo-300" />
        </div>

        {/* Inner background - covers the gradient border */}
        <div className="absolute inset-[2px] rounded-[20px] bg-white dark:bg-card" />

        {/* Gradient Bottom Border - subtle accent */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[6px] opacity-80 group-hover:opacity-100 transition-all duration-300 z-10 rounded-b-[20px] shadow-lg"
          style={{
            background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})`,
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Title Row - Tags inline with title */}
          <div className="flex items-start gap-2 mb-2">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-foreground line-clamp-1 flex-1 leading-tight tracking-tight">
              {ticket.title}
            </h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>
          </div>

          {/* Description */}
          {ticket.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-2 leading-relaxed">
              {ticket.description}
            </p>
          )}

          {/* Footer - Assignee + Date + Highlight indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Assignee Avatar - Premium gradient */}
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-400 to-indigo-400 flex items-center justify-center text-white text-xs font-semibold shadow-sm ring-2 ring-white dark:ring-gray-800">
                {assigneeInitials}
              </div>

              {/* Highlight indicator icon */}
              {highlight && highlight.type && (
                <motion.div
                  className={`h-5 w-5 rounded-lg flex items-center justify-center ${
                    highlight.type === 'priority'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      : highlight.type === 'sla-risk'
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                      : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                  }`}
                  animate={shouldPulse ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  title={
                    highlight.type === 'priority'
                      ? 'High priority ticket'
                      : highlight.type === 'sla-risk'
                      ? 'At risk of SLA breach'
                      : 'Needs attention'
                  }
                >
                  {highlight.type === 'priority' ? (
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="m2 17 10 5 10-5" />
                    </svg>
                  ) : highlight.type === 'sla-risk' ? (
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 12" />
                    </svg>
                  ) : (
                    <AlertIcon />
                  )}
                </motion.div>
              )}
            </div>

            {/* Date */}
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-tech">
              <CalendarIcon />
              <span>{format(new Date(ticket.createdAt), 'MMM d')}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
