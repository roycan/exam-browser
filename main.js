const { app, BrowserWindow, globalShortcut } = require('electron');

let win; // declare globally so other handlers can access it

// Prevent multiple instances - only one exam browser can run at a time
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    kiosk: true, // full screen exam mode
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: __dirname + '/preload.js', // optional preload script
      // Disable webview tag to prevent embedded content
      webviewTag: false,
    },
  });

  // Disable dev tools - ensure they can't be opened
  win.webContents.on('devtools-opened', () => {
    win.webContents.closeDevTools();
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

  // Block new window creation except for Google accounts (for SSO login) and Moodle domain
win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://accounts.google.com/') || url.startsWith('https://khub.mc.pshs.edu.ph/')) {
        return { action: 'allow' };
    }
    return { action: 'deny' };
});

  // Clean up reference when window is closed
  win.on('closed', () => {
    win = null;
  });

  // Safety net: re-enter kiosk mode if somehow exited
  win.on('leave-full-screen', () => {
    if (win) {
      win.setKiosk(true);
    }
  });

  // Force focus back if window loses focus (prevents using other apps)
  win.on('blur', () => {
    if (win && !win.isDestroyed()) {
      win.focus();
    }
  });

  // Block drag-and-drop of files into the browser
  win.webContents.on('will-navigate', (event, url) => {
    // Block file:// URLs (drag-and-drop)
    if (url.startsWith('file://')) {
      event.preventDefault();
      return;
    }
    // Block navigation outside Moodle
    if (
        !url.startsWith('https://khub.mc.pshs.edu.ph/') &&
        !url.startsWith('https://accounts.google.com/')
    ) {
      event.preventDefault();
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  // Minimal global shortcuts (only those that bypass the renderer process)
  // Most shortcuts are handled by preload.js to avoid system-wide key grabs on Linux
  globalShortcut.register('Alt+F4', () => {}); // close window (Windows) - prevent accidental closure
  globalShortcut.register('F11', () => {}); // toggle fullscreen - prevent exiting kiosk mode
  
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
