/* Accessibility support for MkDocs Material-generated markup. */
(() => {
  const apply = () => {
    const search = document.querySelector('.md-search[role="dialog"]');
    if (search && !search.hasAttribute('aria-label') && !search.hasAttribute('aria-labelledby')) {
      search.setAttribute('aria-label', 'Search the Field Guide');
    }

    // Material can produce nested navigation landmarks with the same name
    // for multiple copies of one section. Give only duplicate names context.
    const navs = [...document.querySelectorAll('nav[aria-labelledby]')];
    const groups = new Map();
    for (const nav of navs) {
      const label = document.getElementById(nav.getAttribute('aria-labelledby'));
      const name = label?.textContent?.trim() || 'Section';
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(nav);
    }
    for (const [name, matches] of groups) {
      if (matches.length < 2) continue;
      matches.forEach((nav, i) => {
        nav.setAttribute('aria-label', name + ' navigation ' + (i + 1) + ' of ' + matches.length);
      });
    }

    // Tables wider than their reading column need keyboard-accessible scroll.
    document.querySelectorAll('.md-typeset__scrollwrap').forEach((wrap, i) => {
      if (wrap.scrollWidth <= wrap.clientWidth + 2) return;
      if (wrap.tabIndex >= 0 || wrap.querySelector('a, button, input, select, textarea, [tabindex="0"]')) return;
      wrap.tabIndex = 0;
      wrap.setAttribute('role', 'region');
      wrap.setAttribute('aria-label', 'Scrollable table ' + (i + 1));
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, { once: true });
  } else {
    apply();
  }
  window.addEventListener('resize', apply, { passive: true });
})();
