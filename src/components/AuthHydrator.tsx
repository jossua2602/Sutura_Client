'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { borrowTabSession, serveTabSessions } from '@/lib/tabSession';

/**
 * Mounted once in the root layout. useAuthStore always starts in the
 * SSR-safe "logged out" shape so the client's first paint matches the
 * server-rendered HTML exactly (no hydration mismatch); this effect then
 * reads this tab's own login (sessionStorage) after mount, updating the store
 * via a normal post-hydration re-render instead of during hydration itself.
 *
 * A tab opened with "Open link in new tab" has no login of its own yet: it
 * first borrows the login of an open SUTURA tab (see lib/tabSession.ts), so
 * the page opens signed in instead of on the login screen.
 */
export default function AuthHydrator() {
  useEffect(() => {
    // Every tab answers new tabs' requests (shop/customer and admin logins).
    serveTabSessions();

    let cancelled = false;
    borrowTabSession('shop').then(() => {
      if (cancelled) return;
      useAuthStore.getState().hydrate();
      const token = sessionStorage.getItem('sutura_token');
      if (!token) return;
      import('@/lib/axios').then(({ default: api }) => {
        api.get('/auth/me')
          .then((res) => {
            if (res.data?.success && res.data?.data?.user) {
              const { user, store, staff_profile } = res.data.data;
              useAuthStore.getState().setAuth(user, token, store, staff_profile);
            }
          })
          .catch((err) => {
            if (err?.response?.status === 401) {
              useAuthStore.getState().logout();
            }
          });
      });
    });
    return () => { cancelled = true; };
  }, []);

  return null;
}
