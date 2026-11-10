'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import api from '@/lib/axios';
import { PLATFORM_GCASH } from '@/lib/platformPayment';

const peso = (n: number) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Gcash = { name: string; number: string; qr_url: string | null };

// Loaded once per page: the account an admin set on the Payments page.
let gcashPromise: Promise<Gcash> | null = null;
function loadGcash(): Promise<Gcash> {
  gcashPromise ??= api.get('/public/platform-payment')
    .then((res) => ({
      name: res.data.data?.name || PLATFORM_GCASH.name,
      number: res.data.data?.number || PLATFORM_GCASH.number,
      qr_url: res.data.data?.qr_url ?? null,
    }))
    .catch(() => { gcashPromise = null; return { ...PLATFORM_GCASH, qr_url: null }; });
  return gcashPromise;
}

// The one place that tells a shop owner where to send the money.
export default function PlatformPaymentBox({ amount, note }: Readonly<{ amount: number; note?: string }>) {
  const [copied, setCopied] = useState(false);
  const [gcash, setGcash] = useState<Gcash>({ ...PLATFORM_GCASH, qr_url: null });

  useEffect(() => {
    let alive = true;
    loadGcash().then((g) => { if (alive) setGcash(g); });
    return () => { alive = false; };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(gcash.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the number is shown in full anyway */
    }
  };

  return (
    <div className="border border-line bg-sunken p-4 text-ink-body">
      <p className="text-xs font-bold uppercase tracking-wider text-ink">Pay with GCash</p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start">
        <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-ink-muted">Amount</dt>
          <dd className="font-semibold text-ink tabular-nums">{peso(amount)}</dd>
          <dt className="text-ink-muted">GCash number</dt>
          <dd className="flex items-center gap-2">
            <span className="font-mono font-semibold text-ink tracking-wide">{gcash.number}</span>
            <button type="button" onClick={copy} aria-label="Copy GCash number" className="h-8 px-2 border border-line-strong bg-white text-xs font-medium flex items-center gap-1 cursor-pointer hover:bg-canvas">
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </dd>
          <dt className="text-ink-muted">Account name</dt>
          <dd className="font-semibold text-ink">{gcash.name}</dd>
        </dl>
        {gcash.qr_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gcash.qr_url} alt="GCash QR code to scan" className="h-32 w-32 shrink-0 border border-line bg-white object-contain" />
        )}
      </div>
      <p className="mt-3 text-xs text-ink-muted">{note ?? 'After you pay, upload a screenshot of the GCash receipt below.'}</p>
    </div>
  );
}
