import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Ticket } from '../../types/index.js';
import { StatusBadge, PriorityBadge, Card } from '../ui/index.js';

// Status gradient colors for premium look
const statusGradient: Record<Ticket['status'], { from: string; to: string }> = {
  NEW: { from: '#8B5CF6', to: '#6366F1' },        // Violet to Indigo
  IN_PROGRESS: { from: '#06B6D4', to: '#14B8A6' }, // Cyan to Teal
  WAITING_CLIENT: { from: '#F59E0B', to: '#F97316' }, // Amber to Orange
  BLOCKED: { from: '#EF4444', to: '#DC2626' },     // Red to Dark Red
  DONE: { from: '#22C55E', to: '#16A34A' },       // Green to Dark Green
  FROZEN: { from: '#6B7280', to: '#4B5563' },     // Gray to Dark Gray
};

interface TicketCardProps {
  ticket: Ticket;
}

function MoreIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
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

export function TicketCard({ ticket }: TicketCardProps) {
  const navigate = useNavigate();

  // Generate assignee initials from ticket title
  const getInitials = (title: string) => {
    const words = title.split(' ').filter(w => w.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return title.slice(0, 2).toUpperCase();
  };

  const assigneeInitials = getInitials(ticket.title);
  const gradient = statusGradient[ticket.status];

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
      <div className="bg-white dark:bg-card rounded-[20px] p-4 transition-all duration-300 cursor-pointer group relative overflow-hidden border border-gray-200/50 dark:border-gray-800/50 hover:border-violet-200/50 dark:hover:border-violet-800/30"
        style={{
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)',
        }}
      >
        {/* Gradient Border - appears on hover */}
        <div className="absolute inset-0 rounded-[20px] p-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-full h-full rounded-[20px] bg-gradient-to-r from-violet-500 via-violet-500 to-indigo-500" />
        </div>

        {/* Inner background - covers the gradient border */}
        <div className="absolute inset-[2px] rounded-[20px] bg-white dark:bg-card" />

        {/* Gradient Bottom Border - subtle accent */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-300 z-10 rounded-b-[20px]"
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

          {/* Footer - Assignee + Date */}
          <div className="flex items-center justify-between">
            {/* Assignee Avatar - Premium gradient */}
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold shadow-sm ring-2 ring-white dark:ring-gray-800">
              {assigneeInitials}
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
