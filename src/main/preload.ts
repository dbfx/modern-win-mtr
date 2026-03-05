import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('mtrApi', {
  startSession: (config: { target: string; interval: number; maxHops: number; historySize: number }) =>
    ipcRenderer.invoke('mtr:start', config),
  stopSession: () =>
    ipcRenderer.invoke('mtr:stop'),
  onData: (callback: (state: unknown) => void) => {
    const listener = (_: unknown, state: unknown) => callback(state);
    ipcRenderer.on('mtr:data', listener as (...args: unknown[]) => void);
    return () => { ipcRenderer.removeListener('mtr:data', listener as (...args: unknown[]) => void); };
  },
  onHopDiscovered: (callback: (hop: unknown) => void) => {
    const listener = (_: unknown, hop: unknown) => callback(hop);
    ipcRenderer.on('mtr:hop-discovered', listener as (...args: unknown[]) => void);
    return () => { ipcRenderer.removeListener('mtr:hop-discovered', listener as (...args: unknown[]) => void); };
  },
  onStatus: (callback: (status: string) => void) => {
    const listener = (_: unknown, status: string) => callback(status);
    ipcRenderer.on('mtr:status', listener as (...args: unknown[]) => void);
    return () => { ipcRenderer.removeListener('mtr:status', listener as (...args: unknown[]) => void); };
  },
  onError: (callback: (error: string) => void) => {
    const listener = (_: unknown, error: string) => callback(error);
    ipcRenderer.on('mtr:error', listener as (...args: unknown[]) => void);
    return () => { ipcRenderer.removeListener('mtr:error', listener as (...args: unknown[]) => void); };
  },

  // Loss monitor
  startLossMonitor: () => ipcRenderer.invoke('loss:start'),
  stopLossMonitor: () => ipcRenderer.invoke('loss:stop'),
  onLossData: (callback: (state: unknown) => void) => {
    const listener = (_: unknown, state: unknown) => callback(state);
    ipcRenderer.on('loss:data', listener as (...args: unknown[]) => void);
    return () => { ipcRenderer.removeListener('loss:data', listener as (...args: unknown[]) => void); };
  },

  // App info
  getVersion: () => ipcRenderer.invoke('app:version'),
  getProcessVersions: () => ({
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  }),

  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  downloadUpdate: () => ipcRenderer.invoke('updater:download'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  onUpdaterStatus: (callback: (status: string) => void) => {
    const listener = (_: unknown, status: string) => callback(status);
    ipcRenderer.on('updater:status', listener as (...args: unknown[]) => void);
    return () => { ipcRenderer.removeListener('updater:status', listener as (...args: unknown[]) => void); };
  },
  onUpdaterProgress: (callback: (percent: number) => void) => {
    const listener = (_: unknown, percent: number) => callback(percent);
    ipcRenderer.on('updater:progress', listener as (...args: unknown[]) => void);
    return () => { ipcRenderer.removeListener('updater:progress', listener as (...args: unknown[]) => void); };
  },
  onUpdaterError: (callback: (message: string) => void) => {
    const listener = (_: unknown, message: string) => callback(message);
    ipcRenderer.on('updater:error', listener as (...args: unknown[]) => void);
    return () => { ipcRenderer.removeListener('updater:error', listener as (...args: unknown[]) => void); };
  },
});
