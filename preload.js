// Disable right-click context menu
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
}, false);

// Disable copy/paste, select all, save, print
window.addEventListener('keydown', (e) => {
    const currentURL = window.location.href;
    if (currentURL.includes('accounts.google.com')) {
        // Allow all shortcuts on Google accounts page for SSO login
        return;
    }
  if (
    // Windows/Linux shortcuts
    (e.ctrlKey && ['c', 'v', 'x', 'a', 's', 'p'].includes(e.key.toLowerCase())) ||
    // macOS shortcuts
    (e.metaKey && ['c', 'v', 'x', 'a', 's', 'p'].includes(e.key.toLowerCase()))
  ) {
    e.preventDefault();
  }
}, true); // useCapture=true intercepts before page scripts
