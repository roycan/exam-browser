# KHub Exam Browser

A locked browser application designed for taking online exams securely. Built with Electron, this kiosk-mode browser restricts navigation to specific approved domains and blocks common browser shortcuts to prevent cheating during examinations.

## Features

- **Kiosk Mode**: Runs in full-screen mode to prevent access to other applications
- **Domain Restriction**: Only allows navigation to pre-approved websites
- **Shortcut Blocking**: Disables common browser shortcuts (new tab, new window, dev tools, etc.)
- **Copy/Paste Protection**: Blocks copy, paste, cut, select all, save, and print shortcuts
- **Right-Click Disabled**: Prevents access to context menu
- **SSO Support**: Allows Google Accounts authentication for single sign-on
- **Cross-Platform**: Builds available for Windows, Linux, and macOS

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)
- Python 3 and Pillow library (for icon conversion, optional)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd exam-browser
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

To run the application in development mode:

```bash
npm start
```

## Building for Distribution

### Building for Linux

To create a Linux AppImage build:

```bash
npm run dist -- --linux
```

This will create a `.AppImage` file in the `dist/` directory, which can be executed on most Linux distributions.

### Building for Windows

To create Windows builds (portable and installer):

```bash
npm run dist -- --win
```

This will create:
- A portable `.exe` file
- An NSIS installer (`.exe`)

Both will be located in the `dist/` directory.

### Building for macOS

To create a macOS DMG:

```bash
npm run dist -- --mac
```

### Building for All Platforms

To build for all platforms at once:

```bash
npm run dist
```

## Configuring Allowed Websites

The browser restricts navigation to specific domains. To modify the allowed sites, edit the [`main.js`](main.js:1) file:

### 1. Change the Default Landing Page

Find line 18 in [`main.js`](main.js:18):

```javascript
win.loadURL('https://khub.mc.pshs.edu.ph/');
```

Replace the URL with your desired default page.

### 2. Modify Navigation Restrictions

Find the `will-navigate` event handler (lines 21-28 in [`main.js`](main.js:21)):

```javascript
win.webContents.on('will-navigate', (event, url) => {
  if (
      !url.startsWith('https://khub.mc.pshs.edu.ph/') &&
      !url.startsWith('https://accounts.google.com/')
  ) {
    event.preventDefault();
  }
});
```

Add or remove URL patterns to allow or block additional domains.

### 3. Configure New Window Handling

Find the `setWindowOpenHandler` (lines 31-36 in [`main.js`](main.js:31)):

```javascript
win.webContents.setWindowOpenHandler(({ url }) => { 
  if (url.startsWith('https://accounts.google.com/')) { 
      return { action: 'allow' }; 
  } 
  return { action: 'deny' }; 
});
```

Add additional domains here if you need to allow popups or new windows from specific sites.

### 4. Update Preload Script for SSO

If you need to allow special keyboard shortcuts on specific pages (like SSO login pages), edit [`preload.js`](preload.js:1):

```javascript
window.addEventListener('keydown', (e) => {
    const currentURL = window.location.href;
    if (currentURL.includes('accounts.google.com')) {
        // Allow all shortcuts on Google accounts page for SSO login
        return;
    }
    // ... rest of the blocking logic
});
```

## Keyboard Shortcuts

### Blocked Shortcuts
The following shortcuts are disabled during exam mode:

**Navigation & Window Control:**
- `Ctrl/Cmd + T` - New tab
- `Ctrl/Cmd + N` - New window
- `Ctrl/Cmd + W` - Close tab/window
- `Ctrl/Cmd + R` / `F5` - Refresh page
- `Ctrl/Cmd + Shift + R` - Hard refresh
- `Ctrl/Cmd + L` - Focus address bar
- `Alt + Left/Right Arrow` - Back/Forward navigation
- `Ctrl/Cmd + Tab` - Switch browser tabs
- `Escape` - Exit fullscreen
- `Alt + F4` - Close window (Windows)

**Developer Tools & Inspection:**
- `Ctrl/Cmd + Shift + I` - Developer tools
- `F12` - Developer tools
- `Ctrl/Cmd + Shift + C` - Inspect element
- `Ctrl/Cmd + Shift + J` - Open console
- `Ctrl/Cmd + U` - View page source

**System Shortcuts (may not work on all platforms due to OS limitations):**
- `F11` - Toggle fullscreen
- `Alt + Tab` - Window switching
- `Super/Windows Key` - Opens Start menu
- `Super/Windows + L` - Lock screen

**Content Access:**
- `Ctrl/Cmd + C` - Copy
- `Ctrl/Cmd + V` - Paste
- `Ctrl/Cmd + X` - Cut
- `Ctrl/Cmd + A` - Select all
- `Ctrl/Cmd + S` - Save
- `Ctrl/Cmd + P` - Print
- `Ctrl/Cmd + F` - Find in page
- `Ctrl/Cmd + G` - Find next
- `Ctrl/Cmd + Shift + G` - Find previous
- `PrintScreen` - Take screenshot
- `Ctrl/Cmd + PrintScreen` - Take screenshot
- `Alt + PrintScreen` - Screenshot active window

**Other:**
- `F1` - Open help
- `Ctrl/Cmd + Shift + T` - Reopen closed tab

### Exit Shortcut
- `Ctrl/Cmd + Q` - Quit the application (secret exit for administrators)

### 3-Strike Warning System

The browser implements a progressive warning system to deter cheating attempts:

1. **First Offense**: A red warning banner appears at the top of the screen for 30 seconds with the message "⚠️ Warning: This shortcut is disabled during exam mode"

2. **Second Offense**: A larger red banner appears for 2 minutes with the message "⚠️ LAST WARNING: Continued violations will lock your exam"

3. **Third Offense**: A full-screen red overlay permanently blocks all interaction with the exam, displaying "🔒 EXAM LOCKED - Due to policy violations, your exam has been locked. Please contact your instructor."

**Important Notes:**
- The offense counter tracks total attempts across all blocked shortcuts
- The counter never resets during the exam session (persists in localStorage)
- All attempts are logged to the console for monitoring
- Warnings are disabled on the Google Accounts SSO login page to allow proper authentication
- To reset the counter, the browser must be restarted

## Security Features

1. **Kiosk Mode**: The application runs in full-screen mode, preventing access to the desktop and other applications.

2. **Domain Whitelisting**: Navigation is restricted to pre-approved domains only.

3. **Shortcut Blocking**: Common browser and system shortcuts are globally disabled to prevent opening new tabs, windows, developer tools, or switching applications.

4. **3-Strike Warning System**: Progressive warning system with visual notifications that escalate to a permanent exam lock after three violations.

5. **Content Isolation**: Node integration is disabled and context isolation is enabled for security.

6. **Right-Click Prevention**: The context menu is disabled to prevent access to browser features.

7. **SSO Exception**: Special handling for Google Accounts allows proper authentication while maintaining security elsewhere.

8. **Offense Logging**: All blocked shortcut attempts are logged to the console for post-exam review.

## Icon Management

The application uses different icon formats for different platforms:
- `.ico` for Windows
- `.icns` for macOS
- `.png` for Linux

To regenerate icons from a source image, use the provided Python script:

```bash
pip install pillow
python convert_icons.py
```

Place your source icon at `assets/src-icon.png` before running the script.

## Project Structure

```
exam-browser/
├── main.js           # Main Electron process (window creation, restrictions)
├── preload.js        # Preload script (context menu, keyboard blocking)
├── package.json      # Project configuration and build settings
├── convert_icons.py  # Icon conversion utility
├── assets/           # Application icons
│   ├── icon.ico      # Windows icon
│   ├── icon.icns     # macOS icon
│   ├── icon.png      # Linux icon
│   └── src-icon.png  # Source icon for conversion
└── README.md         # This file
```

## License

ISC

## Author

Roy Canseco

## Notes

- This browser is specifically designed for PSHS-KHub Moodle LMS but can be adapted for other platforms by modifying the allowed URLs.
- Always test builds thoroughly before deploying to production environments.
- The exit shortcut (`Ctrl/Cmd + Q`) should be kept confidential from exam takers.
- **Platform Limitations**: On Windows, Alt+Tab and Windows key blocking may not work reliably due to OS-level security restrictions. Consider using Windows Kiosk Mode settings or running the app in a dedicated user account for enhanced security.
- The offense counter persists in localStorage and survives page refreshes. To reset it, the browser must be completely restarted.
