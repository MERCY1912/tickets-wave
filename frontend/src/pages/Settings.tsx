import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../store/index.js';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../components/ui/index.js';

export default function Settings() {
  const {
    ollamaUrl,
    ollamaModel,
    ollamaTemperature,
    aiSystemPrompt,
    reminderStagnantDays,
    reminderWaitingClientDays,
    reminderHighPriorityDays,
    reminderOldTicketDays,
    aiAnalysisInterval,
    theme,
    loading,
    error,
    fetchSettings,
    updateSettings,
    testOllama,
    resetSettings,
    clearError,
  } = useSettingsStore();

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    ollamaUrl: ollamaUrl,
    ollamaModel: ollamaModel,
    ollamaTemperature: ollamaTemperature,
    aiSystemPrompt: aiSystemPrompt || '',
    reminderStagnantDays: reminderStagnantDays,
    reminderWaitingClientDays: reminderWaitingClientDays,
    reminderHighPriorityDays: reminderHighPriorityDays,
    reminderOldTicketDays: reminderOldTicketDays,
    aiAnalysisInterval: aiAnalysisInterval,
    theme: theme,
  });

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    setFormData({
      ollamaUrl: ollamaUrl,
      ollamaModel: ollamaModel,
      ollamaTemperature: ollamaTemperature,
      aiSystemPrompt: aiSystemPrompt || '',
      reminderStagnantDays: reminderStagnantDays,
      reminderWaitingClientDays: reminderWaitingClientDays,
      reminderHighPriorityDays: reminderHighPriorityDays,
      reminderOldTicketDays: reminderOldTicketDays,
      aiAnalysisInterval: aiAnalysisInterval,
      theme: theme,
    });
  }, [ollamaUrl, ollamaModel, ollamaTemperature, aiSystemPrompt, reminderStagnantDays, reminderWaitingClientDays, reminderHighPriorityDays, reminderOldTicketDays, aiAnalysisInterval, theme]);

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setConnectionResult(null);
  };

  const handleSave = async () => {
    clearError();
    try {
      await updateSettings(formData);
      setConnectionResult({ success: true, message: 'Settings saved successfully' });
    } catch (err) {
      // Error handled by store
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);

    try {
      const result = await testOllama(formData.ollamaUrl);
      if (result.success && result.models) {
        setAvailableModels(result.models);
        setConnectionResult({ success: true, message: `Connected! Found ${result.models.length} models` });
      } else {
        setConnectionResult({ success: false, message: result.error || 'Connection failed' });
      }
    } catch (err) {
      setConnectionResult({ success: false, message: 'Connection failed' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        await resetSettings();
        setConnectionResult({ success: true, message: 'Settings reset to defaults' });
      } catch (err) {
        // Error handled by store
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">Settings</h1>
        <p className="text-gray-600 dark:text-muted-foreground">
          Configure your Tickets Wave experience
        </p>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800/50"
        >
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Connection Result */}
      {connectionResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 border ${
            connectionResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
          }`}
        >
          <p className={connectionResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
            {connectionResult.message}
          </p>
        </motion.div>
      )}

      {/* Ollama Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-foreground flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Ollama AI Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Ollama URL</label>
                <Input
                  value={formData.ollamaUrl}
                  onChange={(e) => handleChange('ollamaUrl', e.target.value)}
                  placeholder="http://localhost:11434"
                />
              </div>
              <div className="flex items-end">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="w-full">
                  <Button
                    variant="secondary"
                    onClick={handleTestConnection}
                    isLoading={testingConnection}
                    className="w-full"
                  >
                    Test Connection
                  </Button>
                </motion.div>
              </div>
            </div>

            {availableModels.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="overflow-hidden"
              >
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Model</label>
                <select
                  value={formData.ollamaModel}
                  onChange={(e) => handleChange('ollamaModel', e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-input bg-white dark:bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all"
                >
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Temperature (0-2)</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formData.ollamaTemperature}
                onChange={(e) => handleChange('ollamaTemperature', parseFloat(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">System Prompt</label>
              <textarea
                value={formData.aiSystemPrompt}
                onChange={(e) => handleChange('aiSystemPrompt', e.target.value)}
                rows={4}
                className="flex min-h-[80px] w-full rounded-lg border border-gray-300 dark:border-input bg-white dark:bg-background px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all resize-none"
                placeholder="Custom system prompt for the AI assistant..."
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reminder Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-foreground flex items-center gap-2">
              <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Reminder Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Stagnant Tickets (days)</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.reminderStagnantDays}
                  onChange={(e) => handleChange('reminderStagnantDays', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Waiting Client (days)</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.reminderWaitingClientDays}
                  onChange={(e) => handleChange('reminderWaitingClientDays', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">High Priority (days)</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.reminderHighPriorityDays}
                  onChange={(e) => handleChange('reminderHighPriorityDays', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Old Tickets (days)</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.reminderOldTicketDays}
                  onChange={(e) => handleChange('reminderOldTicketDays', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">AI Analysis Interval (hours)</label>
              <Input
                type="number"
                min="1"
                max="24"
                value={formData.aiAnalysisInterval}
                onChange={(e) => handleChange('aiAnalysisInterval', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-foreground flex items-center gap-2">
              <svg className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
              </svg>
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Theme</label>
              <select
                value={formData.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-gray-300 dark:border-input bg-white dark:bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex justify-between"
      >
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button variant="destructive" onClick={handleReset} disabled={loading}>
            Reset to Defaults
          </Button>
        </motion.div>
        <div className="flex gap-2">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button variant="ghost" onClick={() => fetchSettings()}>
              Reload
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button onClick={handleSave} isLoading={loading}>
              Save Settings
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
