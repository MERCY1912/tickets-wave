import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTicketsStore } from '../store/index.js';
import type { TicketStatus, Ticket, Priority } from '../types/index.js';
import { format } from 'date-fns';

// Column definitions with premium gradient colors
const columns: Array<{
  status: TicketStatus;
  title: string;
  gradient: string;
  dotColor: string;
}> = [
  {
    status: 'NEW',
    title: 'New',
    gradient: 'from-violet-500/10 to-indigo-500/10',
    dotColor: 'bg-violet-500'
  },
  {
    status: 'IN_PROGRESS',
    title: 'In Progress',
    gradient: 'from-cyan-500/10 to-teal-500/10',
    dotColor: 'bg-cyan-500'
  },
  {
    status: 'WAITING_CLIENT',
    title: 'Waiting',
    gradient: 'from-amber-500/10 to-orange-500/10',
    dotColor: 'bg-amber-500'
  },
  {
    status: 'BLOCKED',
    title: 'Blocked',
    gradient: 'from-red-500/10 to-rose-500/10',
    dotColor: 'bg-red-500'
  },
  {
    status: 'DONE',
    title: 'Done',
    gradient: 'from-emerald-500/10 to-green-500/10',
    dotColor: 'bg-emerald-500'
  },
];

// Priority dot colors
const priorityDots: Record<Priority, string> = {
  LOW: 'bg-emerald-400',
  MEDIUM: 'bg-amber-400',
  HIGH: 'bg-orange-400',
  CRITICAL: 'bg-red-400',
};

export default function Kanban() {
  const { tickets, fetchTickets, updateTicketStatus } = useTicketsStore();
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TicketStatus | null>(null);

  useEffect(() => {
    fetchTickets({ limit: 100 });
  }, [fetchTickets]);

  const handleDragStart = (ticket: Ticket) => {
    setDraggedTicket(ticket);
  };

  const handleDragEnd = () => {
    setDraggedTicket(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: TicketStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDrop = async (status: TicketStatus) => {
    if (draggedTicket && draggedTicket.status !== status) {
      try {
        await updateTicketStatus(draggedTicket.id, status);
      } catch (error) {
        console.error('Failed to update ticket status:', error);
      }
    }
    setDraggedTicket(null);
    setDragOverColumn(null);
  };

  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets.filter(t => t.status === status);
  };

  return (
    <div className="h-full flex flex-col fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 mb-5"
      >
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-foreground">Kanban Board</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Drag and drop tickets to update their status
        </p>
      </motion.div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <div className="flex gap-4 h-full">
          <AnimatePresence>
            {columns.map((column, index) => {
              const columnTickets = getTicketsByStatus(column.status);
              const isDragOver = dragOverColumn === column.status;

              return (
                <motion.div
                  key={column.status}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06, ease: [0.4, 0, 0.2, 1] }}
                  className={`flex-1 min-w-[220px] flex flex-col rounded-[20px] border border-gray-200/50 dark:border-gray-800/50 transition-all duration-200 ${
                    isDragOver ? 'ring-2 ring-violet-400/50 shadow-lg' : ''
                  }`}
                  style={{
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  {/* Column Header with gradient background */}
                  <div className={`p-4 border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-br ${column.gradient}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${column.dotColor}`} />
                        <h3 className="font-semibold text-gray-900 dark:text-foreground text-sm">{column.title}</h3>
                      </div>
                      <motion.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-xs bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm px-2.5 py-1 rounded-full text-gray-700 dark:text-gray-300 font-medium border border-gray-200/50 dark:border-gray-700/50"
                      >
                        {columnTickets.length}
                      </motion.span>
                    </div>
                  </div>

                  {/* Column Content */}
                  <div
                    className="flex-1 p-3 space-y-2 overflow-y-auto bg-gray-50/30 dark:bg-gray-900/20"
                    onDragOver={(e) => handleDragOver(e, column.status)}
                    onDrop={() => handleDrop(column.status)}
                  >
                    {columnTickets.map((ticket, ticketIndex) => (
                      <motion.div
                        key={ticket.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: ticketIndex * 0.03,
                          type: 'spring',
                          stiffness: 300,
                          damping: 25,
                        }}
                        draggable
                        onDragStart={() => handleDragStart(ticket)}
                        onDragEnd={handleDragEnd}
                        className="cursor-grab active:cursor-grabbing"
                        whileHover={{ y: -1 }}
                        whileDrag={{ scale: 1.02, rotate: 0.5 }}
                      >
                        {/* Lightweight card - Linear style */}
                        <div className="bg-white dark:bg-card rounded-xl p-3.5 border border-gray-200/50 dark:border-gray-800/50 transition-all duration-200 hover:border-violet-200/50 dark:hover:border-violet-800/30 hover:shadow-md group">
                          {/* Priority dot & Title */}
                          <div className="flex items-start gap-2 mb-2">
                            <div className={`h-1.5 w-1.5 rounded-full ${priorityDots[ticket.priority]} mt-1.5 flex-shrink-0`} />
                            <h4 className="text-sm font-medium text-gray-900 dark:text-foreground leading-snug flex-1 line-clamp-2">
                              {ticket.title}
                            </h4>
                          </div>

                          {/* AI Summary preview */}
                          {ticket.aiNotes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 pl-3.5 border-l-2 border-violet-200/50 dark:border-violet-800/30">
                              {ticket.aiNotes}
                            </p>
                          )}

                          {/* Description fallback */}
                          {!ticket.aiNotes && ticket.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 pl-3.5">
                              {ticket.description}
                            </p>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-2">
                            {/* Tags */}
                            {ticket.tags && ticket.tags.length > 0 && (
                              <div className="flex gap-1">
                                {ticket.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100/80 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-medium"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Date */}
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                              {format(new Date(ticket.lastActivityAt), 'MMM d')}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Empty state */}
                    <AnimatePresence>
                      {columnTickets.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center py-10"
                        >
                          <div className={`h-8 w-8 rounded-full mx-auto mb-2 ${column.gradient} flex items-center justify-center`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${column.dotColor}`} />
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500">No tickets</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
