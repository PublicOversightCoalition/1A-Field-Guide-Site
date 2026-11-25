# Member portal backend configuration

The canonical member workspace is `docs/member.html`, published at `/member.html`. The former `/member-pilot.html` URL is a compatibility redirect; it preserves query parameters and URL fragments for bookmarks and authentication email callbacks.

The public-source repository commits only placeholder values for the Supabase project URL and **public publishable** key. The member portal, member research pages, and `docs/javascripts/account-navigation.js` are configured during GitHub Pages deployment by `render_config.py render site-preview`.

The deployment uses GitHub Actions repository variables:

- `COALITION_SUPABASE_URL`
- `COALITION_SUPABASE_PUBLISHABLE_KEY`

The deploy-time values are present in browser-delivered code, as appropriate for Supabase's publishable credentials. **These are not secret server credentials.** No service-role or secret keys may be exposed in this public repository or the generated site.

The pull-request build runs `render_config.py check docs` to prevent operational values from being committed to the source. Clones do not inherit the Coalition's GitHub Actions variables.

For compatibility with existing Supabase redirect allowlists, the portal currently sends new email confirmation/password-recovery callbacks to `/member-pilot.html`, which redirects to the canonical `/member.html` while preserving callback tokens and parameters. Update the Supabase Auth URL allowlist before changing that callback destination.

Supabase authorization, RLS, JWT verification and Edge Function origin checks remain the actual security boundaries. Displaying a login state in the public header alone never grants member permissions.
