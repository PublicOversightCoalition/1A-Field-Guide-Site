/* Public navigation to the existing member portal. This is a presentation aid,
   never an authentication or authorization decision. */
(() => {
  const HOME = new URL('/', location.origin);
  const memberURL = (fragment = '') =>
    new URL('member-pilot.html' + fragment, HOME).href;
  const sessionKey = 'coalition-membership-session-v1';
  const logoutKey = 'coalition-membership-signed-out-v1';
  // The project URL and public publishable key are injected at deployment.
  const authURL = '__COALITION_SUPABASE_URL__';
  const publicKey = '__COALITION_SUPABASE_PUBLISHABLE_KEY__';
  const channelName = 'coalition-membership-auth-v1';

  const readStoredSession = () => {
    try {
      if (localStorage.getItem(logoutKey)) return null;
      const session = JSON.parse(localStorage.getItem(sessionKey) ||
        sessionStorage.getItem(sessionKey) || 'null');
      return session?.access_token && session?.refresh_token ? session : null;
    } catch { return null; }
  };
  const readSessionHint = () => {
    // A cached token is only a hint for which navigation links to display.
    // Every protected operation remains verified by the existing member backend.
    try {
      const session = readStoredSession();
      if (!session?.access_token || !session?.refresh_token) return false;
      return Number(session.expires_at || 0) > Date.now() / 1000 + 30;
    } catch {
      return false;
    }
  };

  const setup = () => {
    const header = document.querySelector('.md-header__inner');
    if (!header || header.querySelector('.coalition-account-nav')) return;
    const nav = document.createElement('nav');
    nav.className = 'coalition-account-nav';
    nav.setAttribute('aria-label', 'Member account');
    header.append(nav);

    const update = () => {
      if (!readSessionHint()) {
        nav.innerHTML = `<a class="coalition-account-login" href="${memberURL('#signin')}">Log in</a><a class="coalition-account-signup" href="${memberURL('#signup')}">Sign up</a>`;
        return;
      }
      nav.innerHTML = `<details class="coalition-account-menu">
        <summary aria-label="Account menu" title="Account menu">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="7.5" r="3.5"></circle>
            <path d="M4.5 20c.2-4 3.1-6.5 7.5-6.5s7.3 2.5 7.5 6.5"></path>
          </svg>
        </summary>
        <div class="coalition-account-dropdown">
          <a href="${memberURL('#member-area')}">Member workspace</a>
          <a href="${memberURL('#account')}">My account</a>
          <a href="${new URL('member-research.html', HOME).href}">Research contributions</a>
          <button type="button" class="coalition-account-signout">Sign out</button>
        </div>
      </details>`;
    };

    const signOut = async () => {
      const active = readStoredSession();
      // Clear the browser session first; don't leave a stale profile while
      // requesting revocation from Supabase.
      try { localStorage.setItem(logoutKey, String(Date.now())); } catch {}
      try { localStorage.removeItem(sessionKey); } catch {}
      try { sessionStorage.removeItem(sessionKey); } catch {}
      try {
        const channel = new BroadcastChannel(channelName);
        channel.postMessage({ type: 'session-signed-out' });
        channel.close();
      } catch {}
      update();
      if (!active?.access_token) return;
      try {
        const response = await fetch(authURL + '/auth/v1/logout', {
          method: 'POST',
          headers: { apikey: publicKey, Authorization: 'Bearer ' + active.access_token }
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          const alreadyInactive = response.status === 403 &&
            (data.code === 'session_not_found' || data.error_code === 'session_not_found');
          if (!alreadyInactive) throw new Error('Server logout not confirmed');
        }
      } catch {
        // Do not claim server revocation when only local state is cleared.
        const note = document.createElement('p');
        note.setAttribute('role', 'status');
        note.className = 'coalition-logout-notice';
        note.textContent = 'Signed out of this browser. Server revocation could not be confirmed.';
        header.after(note);
      }
    };

    nav.addEventListener('click', event => {
      if (event.target.closest('.coalition-account-signout')) void signOut();
    });

    update();
    window.addEventListener('storage', e => {
      if (e.key === sessionKey || e.key === logoutKey || e.key === null) update();
    });
    document.addEventListener('click', e => {
      const menu = nav.querySelector('details[open]');
      if (menu && !menu.contains(e.target)) menu.open = false;
    });
    document.addEventListener('keydown', e => {
      const menu = nav.querySelector('details[open]');
      if (menu && e.key === 'Escape') {
        menu.open = false;
        menu.querySelector('summary')?.focus();
      }
    });
    window.addEventListener('pageshow', update);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, { once: true });
  } else {
    setup();
  }
})();
