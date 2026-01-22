export const priorityColors = {
  LOW: 'bg-emerald-400',
  MEDIUM: 'bg-amber-400',
  HIGH: 'bg-orange-400',
  CRITICAL: 'bg-red-400',
} as const;

export type Priority = keyof typeof priorityColors;
