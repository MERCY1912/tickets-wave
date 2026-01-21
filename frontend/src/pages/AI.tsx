import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIStore, useTicketsStore } from '../store/index.js';
import { Button } from '../components/ui/index.js';

// AI Status types
type AIStatus = 'ready' | 'thinking' | 'analyzing';

export default function AI() {
  const { messages, loading, error, sendMessage, clearMessages } = useAIStore();
  const { tickets } = useTicketsStore();
  const [input, setInput] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine AI status based on state
  const getAIStatus = (): AIStatus => {
    if (loading) return 'thinking';
    if (messages.length > 0) return 'analyzing';
    return 'ready';
  };

  const aiStatus = getAIStatus();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const messageToSend = input;
    setInput('');

    await sendMessage(messageToSend, {
      ticketId: selectedTicketId,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: 'Daily Briefing', prompt: 'Generate a daily briefing of my tickets', icon: '📊' },
    { label: 'Analyze Patterns', prompt: 'Analyze my tickets and identify patterns', icon: '🔍' },
    { label: 'Needs Attention', prompt: 'Which tickets need immediate attention?', icon: '⚡' },
    { label: 'Suggest Priority', prompt: 'Suggest priority changes based on ticket age', icon: '🎯' },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-5 fade-in">
      {/* Main AI Chat Panel - Futuristic design */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col relative"
      >
        {/* AI-specific gradient background with subtle glow */}
        <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/60 dark:from-violet-950/40 dark:via-gray-900 dark:to-indigo-950/30" />
        <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5" />
        <div className="absolute inset-0 rounded-[24px] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),_inset_0_-1px_0_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_inset_0_-1px_0_rgba(0,0,0,0.1)]" />

        {/* Subtle animated glow for AI presence */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Content */}
        <div className="relative flex-1 flex flex-col rounded-[24px] border border-violet-100/50 dark:border-violet-900/30 overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 p-5 border-b border-violet-100/30 dark:border-violet-900/20 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* AI Avatar with status indicator */}
                <div className="relative">
                  <motion.div
                    className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25"
                    animate={aiStatus === 'thinking' ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="m2 17 10 5 10-5" />
                      <path d="m2 12 10 5 10-5" />
                    </svg>
                  </motion.div>
                  {/* Status indicator dot */}
                  <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-gray-900">
                    <motion.div
                      className={`h-full w-full rounded-full ${
                        aiStatus === 'ready' ? 'bg-emerald-400' :
                        aiStatus === 'thinking' ? 'bg-violet-400' :
                        'bg-blue-400'
                      }`}
                      animate={aiStatus === 'thinking' ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  </div>
                </div>

                <div>
                  <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-foreground">AI Assistant</h1>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {aiStatus === 'ready' ? 'Ready to help' :
                       aiStatus === 'thinking' ? 'Thinking...' :
                       'Analyzing context'}
                    </span>
                  </div>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMessages}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-xl"
                >
                  Clear
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex items-center justify-center"
              >
                <div className="text-center space-y-6 max-w-md">
                  <motion.div
                    className="relative inline-flex"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-3xl blur-2xl opacity-20 animate-pulse" />
                    <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-xl shadow-violet-500/30">
                      <svg className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="m2 17 10 5 10-5" />
                        <path d="m2 12 10 5 10-5" />
                      </svg>
                    </div>
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">Your AI Coworker</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      I'm here to help you manage tickets smarter and faster
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Summarize', 'Analyze', 'Prioritize', 'Briefing'].map((capability) => (
                        <span
                          key={capability}
                          className="text-xs px-3 py-1.5 rounded-full bg-white/60 dark:bg-gray-800/60 border border-violet-200/50 dark:border-violet-800/30 text-gray-700 dark:text-gray-300 font-medium"
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <AnimatePresence mode='popLayout'>
                {messages.map((message, index) => (
                  <motion.div
                    key={`${message.role}-${index}-${message.content.slice(0, 20)}`}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.95 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-md shadow-violet-500/20'
                          : 'bg-white/80 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 border border-violet-100/50 dark:border-violet-800/30 shadow-sm backdrop-blur-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </motion.div>
                  </motion.div>
                ))}

                {/* AI Thinking Indicator */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/80 dark:bg-gray-800/60 rounded-2xl px-4 py-3 border border-violet-100/50 dark:border-violet-800/30 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <motion.span
                            className="h-2 w-2 bg-violet-400 rounded-full"
                            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                          />
                          <motion.span
                            className="h-2 w-2 bg-violet-400 rounded-full"
                            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
                          />
                          <motion.span
                            className="h-2 w-2 bg-violet-400 rounded-full"
                            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Thinking</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </AnimatePresence>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 p-4 border-t border-violet-100/30 dark:border-violet-900/20 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 p-3 bg-red-50/80 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-200/50 dark:border-red-800/50 backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your tickets..."
                  disabled={loading}
                  className="w-full h-11 pl-4 pr-4 rounded-xl bg-white/80 dark:bg-gray-800/60 border border-violet-200/50 dark:border-violet-800/30 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400/50 transition-all backdrop-blur-sm shadow-sm"
                />
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="h-11 px-5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/30 transition-all border-0"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Side Panel - Minimal */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="w-72 flex-shrink-0 space-y-4"
      >
        {/* Context Card - AI styled */}
        <div className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 border border-violet-100/30 dark:border-violet-800/20 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-foreground mb-3 uppercase tracking-wider">Context</h3>
          <select
            value={selectedTicketId || ''}
            onChange={(e) => setSelectedTicketId(e.target.value || undefined)}
            className="w-full h-10 rounded-xl border border-violet-200/50 dark:border-violet-700/30 bg-white/80 dark:bg-gray-900/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
          >
            <option value="">No ticket selected</option>
            {tickets.slice(0, 10).map((ticket) => (
              <option key={ticket.id} value={ticket.id}>
                {ticket.title}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Actions - AI styled */}
        <div className="bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl rounded-2xl p-4 border border-violet-100/30 dark:border-violet-800/20 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-900 dark:text-foreground mb-3 uppercase tracking-wider">Quick Actions</h3>
          <div className="space-y-2">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setInput(action.prompt)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-violet-50/80 dark:hover:bg-violet-950/30 transition-all duration-200 group"
              >
                <span className="text-base">{action.icon}</span>
                <span className="flex-1 font-medium">{action.label}</span>
                <svg className="h-4 w-4 text-gray-400 group-hover:text-violet-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </motion.button>
            ))}
          </div>
        </div>

        {/* AI Status Card */}
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/20 backdrop-blur-xl rounded-2xl p-4 border border-violet-200/50 dark:border-violet-800/30">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${
              aiStatus === 'ready' ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' :
              aiStatus === 'thinking' ? 'bg-violet-400 shadow-lg shadow-violet-400/50 animate-pulse' :
              'bg-blue-400 shadow-lg shadow-blue-400/50'
            }`} />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-900 dark:text-gray-100 capitalize">{aiStatus}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">AI System Status</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
