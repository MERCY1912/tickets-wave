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
        className="bg-white dark:bg-card rounded-[20px] p-5 border border-gray-200/50 dark:border-gray-800/50 space-y-4"
        style={{
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)',
        }}
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
              className="px-3 py-2 rounded-xl bg-gray-100/80 hover:bg-gray-200/80 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 transition-all duration-200 text-sm font-medium"
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
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
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
          className="bg-white dark:bg-card rounded-[20px] p-16 text-center border border-gray-200/50 dark:border-gray-800/50"
          style={{
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)',
          }}
        >
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block mb-5"
          >
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 flex items-center justify-center ring-1 ring-violet-100/50 dark:ring-violet-900/30 mx-auto">
              <svg className="h-10 w-10 text-violet-400 dark:text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
          </motion.div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">No tickets found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            {filters.search || filters.status || filters.priority
              ? 'Try adjusting your filters or search query'
              : 'Create your first ticket to get started'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
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
            className="rounded-xl bg-white dark:bg-card border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all"
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
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="relative w-full max-w-xl mx-4 bg-white dark:bg-card rounded-[20px] shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 24px rgba(124, 58, 237, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800/50">
              <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search tickets..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-gray-900 dark:text-foreground placeholder:text-gray-400 text-sm"
                autoFocus
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 dark:bg-violet-950/30 mb-3">
                    <svg className="h-6 w-6 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </div>
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
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left transition-all duration-200 group"
                    >
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-sm shadow-violet-500/25">
                        {ticket.title.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-foreground truncate">{ticket.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{ticket.description || 'No description'}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-white">{ticket.status}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span>↑↓ navigate</span>
                <span>↵ select</span>
                <span>ESC close</span>
              </div>
              <span className="font-medium">{tickets.length} results</span>
            </div>
          </motion.div>
        </div>
        )}
      </AnimatePresence>
    </div>
  );
}
