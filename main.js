const { app, BrowserWindow, globalShortcut } = require('electron');

let win; // declare globally so other handlers can access it

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    kiosk: true, // full screen exam mode
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: __dirname + '/preload.js', // optional preload script
    },
  });

  // Load Moodle LMS
  win.loadURL('https://khub.mc.pshs.edu.ph/');

  // Disable navigation outside Moodle
  win.webContents.on('will-navigate', (event, url) => {
    if (
        !url.startsWith('https://khub.mc.pshs.edu.ph/') &&
        !url.startsWith('https://accounts.google.com/')
    ) {
      event.preventDefault();
    }
  });

  // Block new window creation except for Google accounts (for SSO login
win.webContents.setWindowOpenHandler(({ url }) => { 
    if (url.startsWith('https://accounts.google.com/')) { 
        return { action: 'allow' }; 
    } 
    return { action: 'deny' }; 
});

  // Clean up reference when window is closed
  win.on('closed', () => {
    win = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Block common shortcuts globally
  globalShortcut.register('CommandOrControl+T', () => {}); // new tab
  globalShortcut.register('CommandOrControl+N', () => {}); // new window
  globalShortcut.register('CommandOrControl+Shift+I', () => {}); // dev tools
  globalShortcut.register('F12', () => {}); // dev tools

  // Secret exit shortcut
  globalShortcut.register('CommandOrControl+Q', () => {
    app.quit();
  });
});

// Cleanup shortcuts on quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// macOS support (optional)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
