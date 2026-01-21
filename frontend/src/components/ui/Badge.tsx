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
  NEW: { label: 'New', className: 'bg-blue-500 text-white hover:bg-blue-600' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-cyan-500 text-white hover:bg-cyan-600' },
  WAITING_CLIENT: { label: 'Waiting', className: 'bg-amber-500 text-white hover:bg-amber-600' },
  BLOCKED: { label: 'Blocked', className: 'bg-red-500 text-white hover:bg-red-600' },
  DONE: { label: 'Done', className: 'bg-green-500 text-white hover:bg-green-600' },
  FROZEN: { label: 'Frozen', className: 'bg-gray-500 text-white hover:bg-gray-600' },
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
  LOW: { label: 'Low', className: 'bg-emerald-500 text-white hover:bg-emerald-600' },
  MEDIUM: { label: 'Medium', className: 'bg-amber-500 text-white hover:bg-amber-600' },
  HIGH: { label: 'High', className: 'bg-orange-500 text-white hover:bg-orange-600' },
  CRITICAL: { label: 'Critical', className: 'bg-red-500 text-white hover:bg-red-600' },
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
