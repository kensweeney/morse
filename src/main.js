import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const SPEEDS = [10, 15, 20, 25];
let currentWpm = 20;

const broadcastWpm = () => {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('wpm-changed', currentWpm);
  }
};

const buildMenu = () => {
  const speedItems = SPEEDS.map((wpm) => ({
    label: `${wpm} WPM`,
    type: 'radio',
    checked: wpm === currentWpm,
    click: () => {
      currentWpm = wpm;
      broadcastWpm();
    },
  }));

  const template = [
    {
      label: 'File',
      submenu: [{ role: 'quit' }],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Code Speed', enabled: false },
        ...speedItems,
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'About Morse Tutor',
          click: () => {
            app.showAboutPanel?.();
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 720,
    minWidth: 860,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
};

app.whenReady().then(() => {
  ipcMain.handle('get-wpm', () => currentWpm);
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
