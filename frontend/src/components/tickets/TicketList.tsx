import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTicketsStore } from '../../store/index.js';
import { TicketCard } from './TicketCard.js';
import { Input, Select, Button, CommandPaletteButton } from '../ui/index.js';

const statusOptions: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'WAITING_CLIENT', label: 'Waiting Client' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'DONE', label: 'Done' },
  { value: 'FROZEN', label: 'Frozen' },
];

const priorityOptions: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const sortOptions: Array<{ value: string; label: string }> = [
  { value: 'lastActivityAt', label: 'Last Activity' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
  { value: 'priority', label: 'Priority' },
];

export function TicketList() {
  const { tickets, loading, error, fetchTickets, pagination } = useTicketsStore();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
    sortBy: 'lastActivityAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  useEffect(() => {
    fetchTickets(filters);
  }, [filters]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        handleCommandPaletteClose();
      }
    };

    if (isCommandPaletteOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isCommandPaletteOpen]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleSortToggle = () => {
    setFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleCommandPaletteOpen = () => {
    setIsCommandPaletteOpen(true);
  };

  const handleCommandPaletteClose = () => {
    setIsCommandPaletteOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-gray-200/50 dark:border-border/50 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <CommandPaletteButton
            onClick={handleCommandPaletteOpen}
            placeholder="Search tickets..."
            className="md:col-span-2"
          />

          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            options={statusOptions}
          />

          <Select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            options={priorityOptions}
          />

          <div className="flex gap-2">
            <Select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              options={sortOptions}
              className="flex-1"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSortToggle}
              className="px-2.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-accent dark:hover:bg-accent/80 text-gray-700 dark:text-accent-foreground transition-colors text-sm font-medium"
              title={`Sort ${filters.sortOrder === 'asc' ? 'ascending' : 'descending'}`}
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </motion.button>
          </div>
        </div>

        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-sm text-gray-600 dark:text-muted-foreground">
            {pagination.total} ticket{pagination.total !== 1 ? 's' : ''} found
          </p>
        </motion.div>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800/50"
        >
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <motion.svg
            className="h-10 w-10 text-blue-500"
            viewBox="0 0 24 24"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </motion.svg>
        </div>
      )}

      {/* Tickets Grid */}
      {!loading && tickets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-card rounded-xl p-16 text-center shadow-sm border border-gray-200/50 dark:border-border/50"
        >
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block mb-4"
          >
            <svg className="h-16 w-16 text-gray-300 dark:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          </motion.div>
          <p className="text-gray-500 dark:text-muted-foreground">No tickets found</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
            >
              <TicketCard ticket={ticket} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.hasMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <Button
            variant="secondary"
            onClick={() => {
              fetchTickets({
                ...filters,
                offset: pagination.offset + pagination.limit,
              });
            }}
            disabled={loading}
          >
            Load More
          </Button>
        </motion.div>
      )}

      {/* Command Palette Modal */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
            onClick={handleCommandPaletteClose}
          >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl mx-4 bg-white dark:bg-card rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search tickets..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-gray-900 dark:text-foreground placeholder:text-gray-400"
                autoFocus
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No tickets found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {tickets.slice(0, 8).map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => {
                        handleCommandPaletteClose();
                        // Navigate to ticket details would go here
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {ticket.title.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-foreground truncate">{ticket.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{ticket.description || 'No description'}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500 text-white">{ticket.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span>↑↓ to navigate</span>
                <span>↵ to select</span>
                <span>ESC to close</span>
              </div>
              <span>{tickets.length} results</span>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>
    </div>
  );
}
