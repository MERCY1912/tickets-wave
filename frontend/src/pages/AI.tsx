import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIStore, useTicketsStore } from '../store/index.js';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '../components/ui/index.js';

export default function AI() {
  const { messages, loading, error, sendMessage, clearMessages } = useAIStore();
  const { tickets } = useTicketsStore();
  const [input, setInput] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4 fade-in">
      {/* Chat Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border/50 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-border flex items-center justify-between bg-white/80 dark:bg-card/80 backdrop-blur-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-foreground">AI Assistant</h1>
            <p className="text-sm text-gray-600 dark:text-muted-foreground">
              Ask questions about your tickets or get suggestions
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="ghost" size="sm" onClick={clearMessages}>
              Clear Chat
            </Button>
          </motion.div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-background">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center space-y-4">
                <motion.div
                  className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto shadow-lg"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <svg className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </motion.div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-foreground">AI Assistant</h3>
                  <p className="text-sm text-gray-600 dark:text-muted-foreground">
                    Ask me anything about your tickets. I can help with:
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-muted-foreground mt-2 space-y-1 text-left inline-block">
                    <li>• Summarizing tickets</li>
                    <li>• Generating suggestions</li>
                    <li>• Analyzing ticket patterns</li>
                    <li>• Providing daily briefings</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence mode='popLayout'>
              {messages.map((message, index) => (
                <motion.div
                  key={`${message.role}-${index}-${message.content.slice(0, 20)}`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className={`max-w-[80%] rounded-xl p-3 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </motion.div>
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  key="loading-indicator"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-start"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex gap-1.5">
                      <motion.span
                        className="h-2 w-2 bg-gray-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                      />
                      <motion.span
                        className="h-2 w-2 bg-gray-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                      />
                      <motion.span
                        className="h-2 w-2 bg-gray-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </AnimatePresence>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-border bg-white dark:bg-card">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800"
            >
              {error}
            </motion.div>
          )}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your tickets..."
              disabled={loading}
              className="flex-1"
            />
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={handleSend} disabled={!input.trim() || loading}>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="w-80 space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-900 dark:text-foreground">Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 dark:text-muted-foreground">Current Ticket</label>
              <select
                value={selectedTicketId || ''}
                onChange={(e) => setSelectedTicketId(e.target.value || undefined)}
                className="w-full mt-1 h-9 rounded-lg border border-gray-300 dark:border-input bg-white dark:bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all"
              >
                <option value="">No ticket selected</option>
                {tickets.slice(0, 10).map((ticket) => (
                  <option key={ticket.id} value={ticket.id}>
                    {ticket.title}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-900 dark:text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Daily Briefing', prompt: 'Generate a daily briefing of my tickets' },
              { label: 'Analyze Patterns', prompt: 'Analyze my tickets and identify patterns' },
              { label: 'Tickets Needing Attention', prompt: 'Which tickets need immediate attention?' },
            ].map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={() => setInput(action.prompt)}
                >
                  {action.label}
                </Button>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
