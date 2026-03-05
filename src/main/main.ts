import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { autoUpdater } from 'electron-updater';
import { registerIpcHandlers, cleanupSession } from './ipc-handlers';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) app.quit();

let mainWindow: BrowserWindow | null = null;

function setupAutoUpdater(win: BrowserWindow) {
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'dbfx',
    repo: 'modern-win-mtr',
  });
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  const send = (channel: string, data?: unknown) => {
    if (!win.isDestroyed()) win.webContents.send(channel, data);
  };

  autoUpdater.on('checking-for-update', () => send('updater:status', 'checking'));
  autoUpdater.on('update-available', () => send('updater:status', 'available'));
  autoUpdater.on('update-not-available', () => send('updater:status', 'up-to-date'));
  autoUpdater.on('download-progress', (progress) => send('updater:progress', progress.percent));
  autoUpdater.on('update-downloaded', () => send('updater:status', 'downloaded'));
  autoUpdater.on('error', () => send('updater:status', 'error'));

  ipcMain.handle('updater:check', () => autoUpdater.checkForUpdates().catch(() => {}));
  ipcMain.handle('updater:download', () => autoUpdater.downloadUpdate().catch(() => {}));
  ipcMain.handle('updater:install', () => autoUpdater.quitAndInstall());
  ipcMain.handle('app:version', () => app.getVersion());
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 950,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0a0a0f',
      symbolColor: '#9ca3af',
      height: 36,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  registerIpcHandlers(mainWindow);
  setupAutoUpdater(mainWindow);
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  cleanupSession();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  cleanupSession();
});
