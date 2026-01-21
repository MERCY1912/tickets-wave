import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/index.js';
import { TicketList, TicketForm } from '../components/tickets/index.js';

export default function Tickets() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Tickets</h1>
          <p className="text-gray-600 dark:text-muted-foreground">
            Manage and track all your support tickets
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button onClick={() => setIsFormOpen(true)}>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            New Ticket
          </Button>
        </motion.div>
      </motion.div>

      {/* Ticket List */}
      <TicketList />

      {/* Create Ticket Form */}
      <TicketForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
}
