import { Notification, BrowserWindow } from 'electron';

const API_BASE = 'http://localhost:3001/api';
const CHECK_INTERVAL = 60 * 1000; // Check every minute

export class ReminderService {
  private intervalId: NodeJS.Timeout | null = null;
  private lastChecked: string | null = null;

  constructor() {}

  async start(): Promise<void> {
    if (this.intervalId) {
      return; // Already running
    }

    // Check immediately on start
    await this.checkReminders();

    // Set up recurring check
    this.intervalId = setInterval(async () => {
      await this.checkReminders();
    }, CHECK_INTERVAL);

    console.log('Reminder service started');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Reminder service stopped');
    }
  }

  private async checkReminders(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/reminders/due`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reminders = await response.json() as Array<{ id: string; ticket?: { title: string }; message?: string }>;

      for (const reminder of reminders) {
        await this.showNotification(reminder);

        // Mark as triggered
        await fetch(`${API_BASE}/reminders/${reminder.id}/trigger`, {
          method: 'POST',
        });
      }

      this.lastChecked = new Date().toISOString();
    } catch (error) {
      console.error('Failed to check reminders:', error);
    }
  }

  private async showNotification(reminder: any): Promise<void> {
    const title = reminder.ticket
      ? `Reminder: ${reminder.ticket.title}`
      : 'Reminder';

    const body = reminder.message || 'You have a due reminder';

    // Check if notifications are permitted
    if (!Notification.isSupported()) {
      console.log('Notifications not supported');
      return;
    }

    const notification = new Notification({
      title,
      body,
      silent: false,
    });

    notification.on('click', () => {
      // Focus the main window when notification is clicked
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].focus();
      }
    });

    notification.show();
  }

  getStatus(): { running: boolean; lastChecked: string | null } {
    return {
      running: this.intervalId !== null,
      lastChecked: this.lastChecked,
    };
  }
}

// Singleton instance
let reminderServiceInstance: ReminderService | null = null;

export function getReminderService(): ReminderService {
  if (!reminderServiceInstance) {
    reminderServiceInstance = new ReminderService();
  }
  return reminderServiceInstance;
}
