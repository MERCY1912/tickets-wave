import { HTMLAttributes, forwardRef } from 'react';
import type { TicketStatus, Priority } from '../../types/index.js';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className = '', variant = 'default', children, ...props },
  ref,
) {
  const baseStyles = 'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

  const variants = {
    default: 'bg-primary/10 text-primary hover:bg-primary/20',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'text-foreground border border-border hover:bg-accent',
  };

  return (
    <span ref={ref} className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
});

// Status Badge
export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: TicketStatus;
}

export const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  NEW: { label: 'New', className: 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-sm shadow-violet-500/25' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-sm shadow-cyan-500/25' },
  WAITING_CLIENT: { label: 'Waiting', className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/25' },
  BLOCKED: { label: 'Blocked', className: 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm shadow-red-500/25' },
  DONE: { label: 'Done', className: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm shadow-emerald-500/25' },
  FROZEN: { label: 'Frozen', className: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-sm' },
};

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(function StatusBadge(
  { status, className = '', ...props },
  ref,
) {
  const config = statusConfig[status];

  return (
    <span
      ref={ref}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold font-tech transition-all duration-200 ${config.className} ${className}`}
      {...props}
    >
      {config.label}
    </span>
  );
});

// Priority Badge
export interface PriorityBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  priority: Priority;
}

export const priorityConfig: Record<Priority, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm' },
  MEDIUM: { label: 'Medium', className: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-sm shadow-amber-500/25' },
  HIGH: { label: 'High', className: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-500/25' },
  CRITICAL: { label: 'Critical', className: 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm shadow-red-500/25' },
};

export const PriorityBadge = forwardRef<HTMLSpanElement, PriorityBadgeProps>(function PriorityBadge(
  { priority, className = '', ...props },
  ref,
) {
  const config = priorityConfig[priority];

  return (
    <span
      ref={ref}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold font-tech transition-all duration-200 ${config.className} ${className}`}
      {...props}
    >
      {config.label}
    </span>
  );
});

// Tag Badge
export interface TagBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tag: string;
  onRemove?: () => void;
}

export const TagBadge = forwardRef<HTMLSpanElement, TagBadgeProps>(function TagBadge(
  { tag, className = '', onRemove, children, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-accent text-gray-700 dark:text-accent-foreground border border-gray-200/50 dark:border-border/50 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-accent/80 ${className}`}
      {...props}
    >
      <span>{tag}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:text-destructive rounded-sm transition-colors p-0.5 -mx-0.5 opacity-60 hover:opacity-100"
        >
          <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l-4.293 4.293a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
});
