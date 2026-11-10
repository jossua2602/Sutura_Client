'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import PlatformPaymentBox from '@/components/shared/PlatformPaymentBox';
import { FileField, INPUT_CLASS } from '@/components/store-application/ApplicationFields';
import { paymentKind, planPrice, type PaymentDetails, type Plan, type Subscription } from './billingTypes';

interface UpgradePaymentModalProps {
  readonly plan: Plan | null;
  readonly current: Subscription | null;
  readonly onClose: () => void;
  readonly onSubmit: (planId: number, cycle: 'monthly' | 'yearly', receipt: File, details: PaymentDetails) => Promise<boolean>;
}

const CYCLES: { value: 'monthly' | 'yearly'; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });
// datetime-local value for "now" in the owner's time zone.
const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

function Field({ id, label, hint, optional = false, children }: { readonly id: string; readonly label: string; readonly hint?: string; readonly optional?: boolean; readonly children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-ink mb-1.5">
        {label}
        {optional ? <span className="text-ink-muted"> (optional)</span> : <span className="text-danger">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

// Paying for a plan: send the fee by GCash, attach the receipt screenshot and
// copy its details, and an admin checks it in GCash before the plan changes.
export default function UpgradePaymentModal({ plan, current, onClose, onSubmit }: Readonly<UpgradePaymentModalProps>) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [details, setDetails] = useState<PaymentDetails>({ reference: '', senderName: '', senderNumber: '', amountSent: '', paidAt: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (plan) {
      setCycle('monthly');
      setReceipt(null);
      setDetails({ reference: '', senderName: '', senderNumber: '', amountSent: String(planPrice(plan, 'monthly')), paidAt: nowLocal() });
    }
  }, [plan]);

  // Keep "amount sent" on the price until the owner edits it.
  const changeCycle = (c: 'monthly' | 'yearly') => {
    if (plan && details.amountSent === String(planPrice(plan, cycle))) setDetails((d) => ({ ...d, amountSent: String(planPrice(plan, c)) }));
    setCycle(c);
  };

  const send = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!plan || !receipt) return;
    setSending(true);
    const ok = await onSubmit(plan.id, cycle, receipt, details);
    setSending(false);
    if (ok) onClose();
  };

  const kind = plan ? paymentKind(plan, current) : 'upgrade';
  const note = !plan ? '' : kind === 'downgrade' && current?.ends_at
    ? `You stay on ${current.plan.name} until ${day(current.ends_at)}. Once SUTURA confirms this payment, your shop moves to ${plan.name} from then.`
    : kind === 'renewal' && current?.ends_at
      ? `Renewing adds the new period after ${day(current.ends_at)}, so you don't lose any days.`
      : 'Your plan changes as soon as the SUTURA team confirms your payment.';
  const set = (key: keyof PaymentDetails) => (e: React.ChangeEvent<HTMLInputElement>) => setDetails((d) => ({ ...d, [key]: e.target.value }));
  // The ref no. is optional; if typed, it needs at least 6 characters (same as the server).
  const refOk = details.reference.trim() === '' || details.reference.trim().length >= 6;
  const complete = receipt && refOk && details.senderName.trim() && /^09\d{9}$/.test(details.senderNumber)
    && Number(details.amountSent) > 0 && details.paidAt;

  const title = plan ? `${kind === 'renewal' ? 'Renew' : kind === 'downgrade' ? 'Switch to' : 'Pay for'} ${plan.name}` : 'Pay for plan';

  return (
    <Modal
      isOpen={plan !== null}
      onClose={onClose}
      title={title}
      maxWidth="max-w-lg"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={sending} className="h-11 px-5 border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken cursor-pointer disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" form="upgrade-payment-form" disabled={sending || !complete} className="h-11 px-5 bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50">
            {sending && <Loader2 size={16} className="animate-spin" />} Send for review
          </button>
        </>
      }
    >
      {plan && (
        <form id="upgrade-payment-form" onSubmit={send} className="space-y-5">
          <div className="grid grid-cols-2 border border-line-strong" role="radiogroup" aria-label="Billing cycle">
            {CYCLES.map((c) => (
              <button key={c.value} type="button" role="radio" aria-checked={cycle === c.value} onClick={() => changeCycle(c.value)}
                className={`min-h-12 text-sm font-semibold uppercase tracking-widest cursor-pointer ${cycle === c.value ? 'bg-ink text-white' : 'bg-surface text-ink-muted'}`}>
                {c.label}
              </button>
            ))}
          </div>

          <PlatformPaymentBox amount={planPrice(plan, cycle)} note={`${note} After you pay, attach the GCash receipt and copy its details below.`} />

          <FileField id="upgrade-receipt" label="GCash receipt screenshot" hint="Screenshot or photo — JPG, PNG, or WEBP (max 5 MB)" accept="image/png,image/jpeg,image/webp" file={receipt ?? undefined} onChange={setReceipt} />

          <Field id="upgrade-reference" label="GCash reference number" optional hint="The Ref No. on your GCash receipt. Adding it helps us confirm your payment faster.">
            <input id="upgrade-reference" value={details.reference} onChange={set('reference')} maxLength={50} autoComplete="off" className={`${INPUT_CLASS} font-mono tabular-nums`} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="upgrade-sender-name" label="Sender name">
              <input id="upgrade-sender-name" required value={details.senderName} onChange={set('senderName')} maxLength={100} autoComplete="name" className={INPUT_CLASS} />
            </Field>
            <Field id="upgrade-sender-number" label="Sender GCash number">
              <input id="upgrade-sender-number" required inputMode="numeric" placeholder="09XXXXXXXXX" value={details.senderNumber}
                onChange={(e) => setDetails((d) => ({ ...d, senderNumber: e.target.value.replace(/\D/g, '').slice(0, 11) }))} className={`${INPUT_CLASS} tabular-nums`} />
            </Field>
            <Field id="upgrade-amount" label="Amount sent (₱)">
              <input id="upgrade-amount" required type="number" min="1" step="0.01" value={details.amountSent} onChange={set('amountSent')} className={`${INPUT_CLASS} tabular-nums`} />
            </Field>
            <Field id="upgrade-paid-at" label="Date and time paid">
              <input id="upgrade-paid-at" required type="datetime-local" max={nowLocal()} value={details.paidAt} onChange={set('paidAt')} className={INPUT_CLASS} />
            </Field>
          </div>
        </form>
      )}
    </Modal>
  );
}
