/* Shared navigation and dialog accessibility for all exam templates. */
(() => {
  const scriptURL = document.currentScript.src;
  const catalogueURL = new URL('../index.html', scriptURL).href;
  const de = document.documentElement.lang === 'de';
  const overlay = document.getElementById('confirm-overlay');
  let returnFocus = null;
  let wasOpen = false;

  function addNavigation(container) {
    if (!container || container.querySelector('.catalogue-nav')) return;
    const nav = document.createElement('nav');
    nav.className = 'catalogue-nav';
    nav.setAttribute('aria-label', de ? 'Prüfungskatalog' : 'Exam catalogue');
    const link = document.createElement('a');
    link.href = catalogueURL;
    link.textContent = de ? '← Zurück zum Prüfungskatalog' : '← Back to exam catalogue';
    nav.append(link);
    container.prepend(nav);
  }

  addNavigation(document.querySelector('.start-card'));
  addNavigation(document.querySelector('.header-inner') || document.querySelector('#exam-screen header'));
  if (!overlay) return;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'confirm-title');
  overlay.setAttribute('aria-describedby', document.getElementById('confirm-msg') ? 'confirm-msg' : 'confirm-text');

  function syncDialog() {
    const open = overlay.classList.contains('show') || overlay.classList.contains('open');
    if (open === wasOpen) return;
    wasOpen = open;
    for (const child of document.body.children) {
      if (child !== overlay && child.tagName !== 'SCRIPT') child.inert = open;
    }
    if (open) {
      if (!overlay.contains(document.activeElement)) returnFocus = document.activeElement;
      (document.getElementById('confirm-yes-btn') || overlay.querySelector('button')).focus();
    } else if (returnFocus?.isConnected && !returnFocus.disabled) {
      returnFocus.focus();
    }
  }

  // Capture the trigger before templates that focus their dialog synchronously.
  document.addEventListener('click', e => {
    if (!wasOpen && e.target.closest('button') && !overlay.contains(e.target)) {
      returnFocus = e.target.closest('button');
    }
  }, true);
  new MutationObserver(syncDialog).observe(overlay, { attributes: true, attributeFilter: ['class'] });
  overlay.addEventListener('keydown', e => {
    if (!wasOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation(); closeConfirm(); return;
    }
    if (e.key !== 'Tab') return;
    const buttons = [...overlay.querySelectorAll('button')].filter(b => !b.disabled);
    const index = buttons.indexOf(document.activeElement);
    const next = (index + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
    e.preventDefault(); e.stopPropagation(); buttons[next].focus();
  });
})();
