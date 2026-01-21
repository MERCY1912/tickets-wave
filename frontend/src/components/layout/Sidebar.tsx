import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

const mainNavigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Tickets', href: '/tickets', icon: TicketIcon },
  { name: 'Kanban', href: '/kanban', icon: KanbanIcon },
  { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  { name: 'AI Assistant', href: '/ai', icon: AIIcon },
];

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

function HomeIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function KanbanIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="18" x="3" y="3" rx="1" />
      <rect width="7" height="12" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="16" rx="1" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function AIIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
      <path d="M12 2a10 10 0 0 1 10 10h-10V2z" opacity="0.5" />
      <path d="M12 12 2.1 12a10.1 10.1 0 0 0 1.9 4.9L12 12z" opacity="0.5" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function Sidebar() {
  return (
    <aside className="flex flex-col h-full bg-white/80 dark:bg-card/80 backdrop-blur-xl overflow-hidden border-r border-gray-200/50 dark:border-gray-800/50">
      {/* Logo */}
      <div className="p-6 pb-5">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-500 bg-clip-text text-transparent">
            Tickets Wave
          </span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Beta</p>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        {mainNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/50'}`
            }
          >
            <item.icon />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />

      {/* Bottom Navigation (Settings) */}
      <nav className="px-4 py-3">
        {bottomNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'sidebar-nav-item-active' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/50'}`
            }
          >
            <item.icon />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer - Status indicator */}
      <div className="p-5 pt-2 mt-auto">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-100/50 dark:border-violet-900/30">
          <div className="relative">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
            <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">Local mode</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">All data stored locally</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
