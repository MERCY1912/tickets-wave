import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface CommandPaletteButtonProps {
  onClick: () => void;
  placeholder?: string;
  className?: string;
}

// Search icon
function SearchIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export function CommandPaletteButton({ onClick, placeholder = 'Search...', className = '' }: CommandPaletteButtonProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClick();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClick]);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const shortcut = isMac ? '⌘K' : 'Ctrl+K';

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`relative group w-full ${className}`}
    >
      {/* Animated gradient border */}
      <div className="absolute -inset-px rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient bg-[length:200%_200%]" />

      {/* Button */}
      <button
        type="button"
        onClick={onClick}
        className="relative w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-white dark:bg-card border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <SearchIcon />
          <span className="text-sm">{placeholder}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
            {shortcut}
          </kbd>
        </div>
      </button>
    </motion.div>
  );
}
