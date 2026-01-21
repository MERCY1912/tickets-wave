import { app, BrowserWindow } from 'electron';
import { createMainWindow } from './main/mainWindow.js';
import { getReminderService } from './main/services/reminderService.js';

// App event handlers
app.whenReady().then(() => {
  createMainWindow();

  // Start the reminder service
  const reminderService = getReminderService();
  reminderService.start();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Stop reminder service when all windows are closed
  const reminderService = getReminderService();
  reminderService.stop();

  // Quit app on all platforms except macOS
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Ensure reminder service is stopped before quitting
  const reminderService = getReminderService();
  reminderService.stop();
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (parsedUrl.origin !== 'http://localhost:5173') {
      event.preventDefault();
    }
  });
});
