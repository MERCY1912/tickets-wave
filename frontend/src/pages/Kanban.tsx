import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTicketsStore } from '../store/index.js';
import { PriorityBadge, Card } from '../components/ui/index.js';
import type { TicketStatus, Ticket } from '../types/index.js';
import { format } from 'date-fns';

const columns: Array<{ status: TicketStatus; title: string; color: string }> = [
  { status: 'NEW', title: 'New', color: 'border-blue-400' },
  { status: 'IN_PROGRESS', title: 'In Progress', color: 'border-cyan-400' },
  { status: 'WAITING_CLIENT', title: 'Waiting', color: 'border-amber-400' },
  { status: 'BLOCKED', title: 'Blocked', color: 'border-red-400' },
  { status: 'DONE', title: 'Done', color: 'border-green-400' },
];

export default function Kanban() {
  const { tickets, fetchTickets, updateTicketStatus } = useTicketsStore();
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchTickets({ limit: 100 });
  }, [fetchTickets]);

  const handleDragStart = (ticket: Ticket) => {
    setDraggedTicket(ticket);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
        className="flex-shrink-0 mb-4"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Kanban Board</h1>
        <p className="text-gray-600 dark:text-muted-foreground">
          Drag and drop tickets to update their status
        </p>
      </motion.div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((column, index) => {
            const columnTickets = getTicketsByStatus(column.status);

            return (
              <motion.div
                key={column.status}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex-shrink-0 w-80 flex flex-col bg-gray-50 dark:bg-card/50 rounded-xl border-t-4 ${column.color} shadow-sm`}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-gray-200 dark:border-border flex items-center justify-between bg-white dark:bg-card rounded-t-xl">
                  <h3 className="font-semibold text-gray-900 dark:text-foreground">{column.title}</h3>
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-xs bg-gray-100 dark:bg-accent px-2.5 py-0.5 rounded-full text-gray-700 dark:text-accent-foreground font-medium"
                  >
                    {columnTickets.length}
                  </motion.span>
                </div>

                {/* Column Content */}
                <div
                  className="flex-1 p-2.5 space-y-2 overflow-y-auto"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.status)}
                >
                  {columnTickets.map((ticket) => (
                    <motion.div
                      key={ticket.id}
                      layoutId={ticket.id}
                      draggable
                      onDragStart={() => handleDragStart(ticket)}
                      className="cursor-grab active:cursor-grabbing"
                      whileHover={{ scale: 1.02 }}
                      whileDrag={{ scale: 1.05, rotate: 2 }}
                    >
                      <Card className="p-3 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all">
                        <div className="space-y-2">
                          {/* Title & Priority */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium line-clamp-2 text-gray-900 dark:text-foreground">
                              {ticket.title}
                            </h4>
                            <PriorityBadge priority={ticket.priority} />
                          </div>

                          {/* Description */}
                          {ticket.description && (
                            <p className="text-xs text-gray-600 dark:text-muted-foreground line-clamp-2">
                              {ticket.description}
                            </p>
                          )}

                          {/* Tags */}
                          {ticket.tags && ticket.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {ticket.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-accent text-gray-700 dark:text-accent-foreground border border-gray-200 dark:border-border/50"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Footer */}
                          <div className="text-xs text-gray-500 dark:text-muted-foreground pt-2 border-t border-gray-100 dark:border-border/50">
                            {format(new Date(ticket.lastActivityAt), 'MMM d')}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}

                  {columnTickets.length === 0 && (
                    <div className="text-center py-8 text-sm text-gray-400 dark:text-muted-foreground">
                      No tickets
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
