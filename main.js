const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let serverProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL('http://localhost:3000');
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  const serverPath = path.join(__dirname, 'server.js');
  console.log('🚀 Starting Express backend...');

  // Start Express backend as background process
  serverProcess = spawn(process.execPath, [serverPath], {
    stdio: 'inherit',
    env: { ...process.env, ELECTRON_RUN_AS_NODE: 'true' },
  });

  // Wait a bit for the server to start, then open the window
  setTimeout(createWindow, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
