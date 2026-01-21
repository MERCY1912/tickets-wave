import { contextBridge, ipcRenderer } from 'electron';

// Expose a safe API to the renderer process
const electronAPI = {
  // Platform info
  platform: process.platform,

  // Reminder service status
  getReminderStatus: () => ipcRenderer.invoke('reminder:get-status'),
};

// Expose the API to the renderer process via contextBridge
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type definitions for the exposed API
export type ElectronAPI = typeof electronAPI;
