'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { getErrorMessage } from '@/lib/apiError';
import { GOOGLE_REDIRECT_KEY } from '@/components/auth/GoogleSignInButton';

/**
 * Where Google sign-in lands. The server puts a one-time code (or an error)
 * in the URL fragment; this trades the code for a token, signs the customer
 * in, and returns them to the page they started from.
 */
export default function GoogleCallbackPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // the code works once; don't send it twice
    started.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    // Clear the fragment so the code isn't left in history.
    window.history.replaceState(null, '', window.location.pathname);

    const fail = params.get('error');
    const code = params.get('code');
    if (fail || !code) {
      setError(fail || 'Google sign-in didn’t finish. Please try again.');
      return;
    }

    let back = '/';
    try {
      back = sessionStorage.getItem(GOOGLE_REDIRECT_KEY) || '/';
      sessionStorage.removeItem(GOOGLE_REDIRECT_KEY);
    } catch { /* storage blocked: go home */ }
    // Only same-site paths, never an outside URL.
    if (!back.startsWith('/') || back.startsWith('//')) back = '/';

    api.post('/auth/google/exchange', { code })
      .then((res) => {
        const { user, token, store, staff_profile } = res.data.data;
        setAuth(user, token, store ?? undefined, staff_profile ?? undefined);
        router.replace(back);
      })
      .catch((err) => setError(getErrorMessage(err, 'Google sign-in didn’t finish. Please try again.')));
  }, [router, setAuth]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm border border-line bg-surface p-6 text-center">
        {error ? (
          <>
            <h1 className="text-display text-2xl text-ink">Couldn&apos;t sign you in</h1>
            <p className="mt-3 text-sm text-ink-muted">{error}</p>
            <Link href="/login" className="mt-6 inline-flex min-h-11 w-full items-center justify-center bg-ink text-sm font-bold uppercase tracking-widest text-white">
              Back to Sign In
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto animate-spin text-taupe" size={28} aria-hidden="true" />
            <p className="mt-3 text-sm text-ink-muted" role="status">Signing you in with Google…</p>
          </>
        )}
      </div>
    </main>
  );
}
