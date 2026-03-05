import { ipcMain, BrowserWindow, Notification, app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { MtrSessionConfig, AlertRule } from '../shared/types';
import { MtrSession } from './services/mtr-session';
import { LossMonitor } from './services/loss-monitor';
import { LOSS_MONITOR_TARGETS } from '../shared/presets';

let currentSession: MtrSession | null = null;
let lossMonitor: LossMonitor | null = null;

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle('mtr:start', async (_, config: MtrSessionConfig) => {
    if (currentSession) {
      currentSession.stop();
      currentSession.removeAllListeners();
      currentSession = null;
    }

    const session = new MtrSession(config);
    currentSession = session;

    session.on('data', (state) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('mtr:data', state);
      }
    });

    session.on('hop-discovered', (hop) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('mtr:hop-discovered', hop);
      }
    });

    session.on('status', (status) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('mtr:status', status);
      }
    });

    session.on('error', (err) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('mtr:error', err);
      }
    });

    try {
      await session.start();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('mtr:error', message);
      }
    }
  });

  ipcMain.handle('mtr:stop', () => {
    if (currentSession) {
      currentSession.stop();
      currentSession.removeAllListeners();
      currentSession = null;
    }
  });

  // Loss monitor handlers
  ipcMain.handle('loss:start', async () => {
    if (lossMonitor) {
      lossMonitor.stop();
      lossMonitor.removeAllListeners();
      lossMonitor = null;
    }

    const monitor = new LossMonitor(LOSS_MONITOR_TARGETS);
    lossMonitor = monitor;

    monitor.on('data', (state) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('loss:data', state);
      }
    });

    await monitor.start();
  });

  ipcMain.handle('loss:stop', () => {
    if (lossMonitor) {
      lossMonitor.stop();
      lossMonitor.removeAllListeners();
      lossMonitor = null;
    }
  });

  // Alert rules persistence
  const alertsFile = path.join(app.getPath('userData'), 'alert-rules.json');

  ipcMain.handle('alerts:load', async () => {
    try {
      const data = fs.readFileSync(alertsFile, 'utf-8');
      return JSON.parse(data) as AlertRule[];
    } catch {
      return [];
    }
  });

  ipcMain.handle('alerts:save', async (_, rules: AlertRule[]) => {
    fs.writeFileSync(alertsFile, JSON.stringify(rules, null, 2), 'utf-8');
  });

  ipcMain.handle('alerts:notify', async (_, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });
}

export function cleanupSession(): void {
  if (currentSession) {
    currentSession.stop();
    currentSession.removeAllListeners();
    currentSession = null;
  }
  if (lossMonitor) {
    lossMonitor.stop();
    lossMonitor.removeAllListeners();
    lossMonitor = null;
  }
}
