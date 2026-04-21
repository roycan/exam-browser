// Disable right-click context menu
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
}, false);

// Detect page visibility changes - student may have switched away
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden - student switched away from the exam
    // This is logged for teacher review (in a real implementation, you'd send this to a server)
    console.log('[EXAM SECURITY] Student switched away from exam page at:', new Date().toISOString());
  }
});

// Initialize offense counter from localStorage
// Reset offense counter on app start to give students a fresh start
localStorage.removeItem('examOffenseCount');
let offenseCount = 0;

// Create notification banner element
const notificationBanner = document.createElement('div');
notificationBanner.id = 'exam-notification-banner';
notificationBanner.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #dc2626;
  color: white;
  text-align: center;
  padding: 12px 20px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  font-weight: 600;
  z-index: 999999;
  transform: translateY(-100%);
  transition: transform 0.3s ease-in-out;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
`;

// Create full-screen overlay for 3rd strike
const lockOverlay = document.createElement('div');
lockOverlay.id = 'exam-lock-overlay';
lockOverlay.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(220, 38, 38, 0.95);
  color: white;
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  z-index: 9999999;
  text-align: center;
  padding: 40px;
`;
lockOverlay.innerHTML = `
  <div style="font-size: 80px; margin-bottom: 20px;">🔒</div>
  <h1 style="font-size: 36px; margin-bottom: 20px;">EXAM LOCKED</h1>
  <p style="font-size: 20px; max-width: 600px; line-height: 1.6;">
    Due to policy violations, your exam has been locked.<br><br>
    Please contact your instructor.
  </p>
`;

// Defer DOM insertion until document.body is available.
// The preload script runs before the page's DOM is fully constructed,
// so document.body may be null at the top level. We wait for
// DOMContentLoaded to guarantee body exists before appending elements.
window.addEventListener('DOMContentLoaded', () => {
  document.body.appendChild(notificationBanner);
  document.body.appendChild(lockOverlay);
});

let notificationTimeout = null;

// Show notification banner
function showNotification(message, duration) {
  notificationBanner.textContent = message;
  notificationBanner.style.transform = 'translateY(0)';
  
  // Clear any existing timeout
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }
  
  // Set new timeout to hide notification
  notificationTimeout = setTimeout(() => {
    notificationBanner.style.transform = 'translateY(-100%)';
  }, duration);
}

// Handle offense
function handleOffense(shortcutName) {
  // Increment counter
  offenseCount++;
  localStorage.setItem('examOffenseCount', offenseCount.toString());
  
  // Handle escalation
  if (offenseCount === 1) {
    // 1st strike: 30-second warning
    showNotification('⚠️ Warning: This shortcut is disabled during exam mode', 30000);
  } else if (offenseCount === 2) {
    // 2nd strike: 2-minute last warning
    showNotification('⚠️ LAST WARNING: Continued violations will lock your exam', 120000);
  } else {
    // 3rd strike: Permanent lock
    lockOverlay.style.display = 'flex';
    // Block all keyboard and mouse events
    document.addEventListener('keydown', blockAllEvents, true);
    document.addEventListener('mousedown', blockAllEvents, true);
    document.addEventListener('contextmenu', blockAllEvents, true);
  }
}

// Block all events (for 3rd strike)
function blockAllEvents(e) {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  return false;
}

// Disable copy/paste, select all, save, print, and other shortcuts
window.addEventListener('keydown', (e) => {
  const currentURL = window.location.href;
  
  // Allow all shortcuts on Google accounts page for SSO login
  if (currentURL.includes('accounts.google.com')) {
    return;
  }
  
  // Check if exam is locked (3rd strike)
  if (offenseCount >= 3) {
    blockAllEvents(e);
    return;
  }
  
  let blockedShortcut = null;
  const modifierKey = e.ctrlKey || e.metaKey;
  const modifierName = e.ctrlKey ? 'Ctrl' : 'Cmd';
  
  // Function keys
  if (e.key === 'F1') {
    blockedShortcut = 'F1';
  } else if (e.key === 'F5') {
    blockedShortcut = 'F5';
  } else if (e.key === 'F11') {
    blockedShortcut = 'F11';
  } else if (e.key === 'F12') {
    blockedShortcut = 'F12';
  }
  // Escape key - REMOVED: Needed for modal dismissal
  // else if (e.key === 'Escape') {
  //   blockedShortcut = 'Escape';
  // }
  // Print Screen
  else if (e.key === 'PrintScreen') {
    blockedShortcut = 'PrintScreen';
  }
  // Alt+Tab (may not work on all platforms due to OS limitations)
  else if (e.altKey && e.key === 'Tab') {
    blockedShortcut = 'Alt+Tab';
  }
  // Alt+F4 (Windows)
  else if (e.altKey && e.key === 'F4') {
    blockedShortcut = 'Alt+F4';
  }
  // Alt+Left/Right (navigation)
  else if (e.altKey && e.key === 'ArrowLeft') {
    blockedShortcut = 'Alt+Left';
  } else if (e.altKey && e.key === 'ArrowRight') {
    blockedShortcut = 'Alt+Right';
  }
  // Ctrl/Cmd + single key shortcuts
  else if (modifierKey && !e.shiftKey && !e.altKey) {
    const key = e.key.toLowerCase();
    // REMOVED: 'c', 'v', 'a' (copy, paste, select all - needed for exam answers)
    // Kept: 'x', 's', 'p', 't', 'n', 'w', 'r', 'l', 'f', 'g', 'u' (cut, save, print, new tab, new window, close, refresh, address bar, find, view source)
    if (['x', 's', 'p', 't', 'n', 'w', 'r', 'l', 'f', 'g', 'u'].includes(key)) {
      blockedShortcut = `${modifierName}+${e.key.toUpperCase()}`;
    }
  }
  // Ctrl/Cmd + Shift + single key shortcuts
  else if (modifierKey && e.shiftKey && !e.altKey) {
    const key = e.key.toLowerCase();
    if (key === 'i') {
      blockedShortcut = `${modifierName}+Shift+I`;
    } else if (key === 'r') {
      blockedShortcut = `${modifierName}+Shift+R`;
    } else if (key === 'g') {
      blockedShortcut = `${modifierName}+Shift+G`;
    } else if (key === 'c') {
      blockedShortcut = `${modifierName}+Shift+C`;
    } else if (key === 'j') {
      blockedShortcut = `${modifierName}+Shift+J`;
    } else if (key === 't') {
      blockedShortcut = `${modifierName}+Shift+T`;
    }
  }
  // Ctrl/Cmd + Print Screen
  else if (modifierKey && e.key === 'PrintScreen') {
    blockedShortcut = `${modifierName}+PrintScreen`;
  }
  // Alt + Print Screen
  else if (e.altKey && e.key === 'PrintScreen') {
    blockedShortcut = 'Alt+PrintScreen';
  }
  // Ctrl/Cmd + Tab
  else if (modifierKey && e.key === 'Tab') {
    blockedShortcut = `${modifierName}+Tab`;
  }
  
  if (blockedShortcut) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    handleOffense(blockedShortcut);
  }
}, true); // useCapture=true intercepts before page scripts
