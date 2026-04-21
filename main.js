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
  // Also blocks file:// URLs (drag-and-drop protection)
  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) {
      event.preventDefault();
      return;
    }
    if (
        !url.startsWith('https://khub.mc.pshs.edu.ph/') &&
        !url.startsWith('https://accounts.google.com/')
    ) {
      event.preventDefault();
    }
  });

  // Handle new window requests (window.open, target="_blank", etc.)
  // - Google SSO: allow popup (needed for OAuth flow)
  // - Moodle: deny popup and navigate in the SAME window instead
  //   (Moodle's quiz "Start attempt" uses window.open which creates
  //    a new BrowserWindow that is invisible behind kiosk mode)
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://accounts.google.com/')) {
        return { action: 'allow' };
    }
    if (url.startsWith('https://khub.mc.pshs.edu.ph/')) {
        // Navigate in the main kiosk window instead of opening a new window
        win.loadURL(url);
        return { action: 'deny' };
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
