import { useState, useEffect } from 'react';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRemindersStore, useAuthStore } from '../../store/index.js';
import { ReminderItem } from '../tickets/ReminderItem.js';

function BellIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

// Page titles configuration
const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Dashboard' },
  '/tickets': { title: 'Tickets', subtitle: 'Manage your support tickets' },
  '/kanban': { title: 'Kanban', subtitle: 'Visual workflow management' },
  '/calendar': { title: 'Calendar', subtitle: 'Schedule & reminders' },
  '/ai': { title: 'AI Assistant', subtitle: 'Smart ticket analysis' },
  '/settings': { title: 'Settings', subtitle: 'Preferences & configuration' },
};

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { dueReminders, fetchReminders } = useRemindersStore();
  const { user, logout } = useAuthStore();

  // Get current page info
  const currentPage = pageTitles[location.pathname] || { title: 'Tickets Wave' };

  useEffect(() => {
    fetchReminders(false);
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  // Get user initials
  const getUserInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="h-14 flex items-center justify-between px-6 sticky top-0 z-40" style={{ background: '#f8f9fb' }}>
      {/* Left - Page Title */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-base font-medium text-gray-900">{currentPage.title}</h1>
          {currentPage.subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{currentPage.subtitle}</p>
          )}
        </div>
      </div>

      {/* Center - Search (optional) */}
      <div className="flex-1 flex justify-center px-8">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition-all duration-200">
          <SearchIcon />
          <span>Search...</span>
          <kbd className="hidden sm:inline-flex ml-auto text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">⌘K</kbd>
        </button>
      </div>

      {/* Right - Icons only */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-gray-100/50 text-gray-500 hover:text-gray-700 transition-all duration-200 relative"
            aria-label="Notifications"
          >
            <BellIcon />
            {dueReminders.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-red-400 rounded-full" />
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 z-50 max-h-96 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100/50">
                    <h3 className="text-sm font-medium text-gray-900">
                      Reminders ({dueReminders.length})
                    </h3>
                  </div>
                  {dueReminders.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 mb-2">
                        <svg className="h-4 w-4 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-400">All caught up!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100/50 max-h-72 overflow-y-auto">
                      {dueReminders.map((reminder) => (
                        <ReminderItem key={reminder.id} reminder={reminder} compact />
                      ))}
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-400 flex items-center justify-center text-white text-xs font-medium cursor-pointer shadow-sm"
            aria-label="User menu"
          >
            {getUserInitials()}
          </motion.button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100/50 z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100/50">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <LogOutIcon />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Soft Bottom Divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </header>
  );
}
