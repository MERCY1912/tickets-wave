import { BrowserWindow, app } from 'electron';
import * as path from 'path';

const VITE_DEV_SERVER = 'http://localhost:5173';

export function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app
  if (app.isPackaged || process.env.NODE_ENV === 'production') {
    mainWindow.loadFile(
      path.join(__dirname, '../../frontend/dist/index.html')
    );
  } else {
    mainWindow.loadURL(VITE_DEV_SERVER);
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  }

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(() => {
    // Prevent opening external URLs
    return { action: 'deny' };
  });

  return mainWindow;
}
