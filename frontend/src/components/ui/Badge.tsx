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
  NEW: { label: 'New', className: 'bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/30' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-cyan-100 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-800/30' },
  WAITING_CLIENT: { label: 'Waiting', className: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30' },
  BLOCKED: { label: 'Blocked', className: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-800/30' },
  DONE: { label: 'Done', className: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30' },
  FROZEN: { label: 'Frozen', className: 'bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/30' },
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
  LOW: { label: 'Low', className: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30' },
  MEDIUM: { label: 'Medium', className: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30' },
  HIGH: { label: 'High', className: 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200/50 dark:border-orange-800/30' },
  CRITICAL: { label: 'Critical', className: 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-800/30' },
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
