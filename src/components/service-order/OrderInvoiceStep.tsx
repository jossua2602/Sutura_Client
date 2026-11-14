'use client';

import { Minus, Plus, Zap } from 'lucide-react';
import { formatServiceTurnaround } from '@/lib/turnaroundHelper';
import type { ServiceOrderState } from './useServiceOrder';
import { ChoiceCard, FIELD, SectionLabel, StepIntro, paymentCopy, peso } from './orderUi';
import OrderGcashPayment from './OrderGcashPayment';

function Line({ label, value, strong }: Readonly<{ label: string; value: string; strong?: boolean }>) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className={strong ? 'text-base font-semibold text-ink' : 'text-sm text-ink-muted'}>{label}</dt>
      <dd className={`tabular-nums text-right ${strong ? 'text-2xl font-bold text-ink' : 'text-sm font-medium text-ink'}`}>{value}</dd>
    </div>
  );
}

// Step 4 — Invoice & Payment, like the walk-in form's: quantity, rush,
// schedule and payment term, then the order's financial summary.
export default function OrderInvoiceStep({ o }: Readonly<{ o: ServiceOrderState }>) {
  const tomorrow = new Date(Date.now() + 86_400_000).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const fullOnly = o.policy === 'full';

  // The shop's own turnaround for this service ("It depends" = none set).
  const minDays = Number(o.service?.estimated_days) || 0;
  const usualDays = minDays >= 1 ? { min: minDays, max: o.service?.estimated_days_max ?? null } : null;
  // Picked date closer than the fastest usual turnaround → suggest rush (unless already asked).
  const todayManila = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const daysUntil = o.neededBy ? Math.round((Date.parse(o.neededBy) - Date.parse(todayManila)) / 86_400_000) : null;
  const tooSoon = usualDays !== null && daysUntil !== null && daysUntil < usualDays.min && !o.rushRequested;

  return (
    <div className="space-y-7">
      <StepIntro title="Invoice & Payment" text="Quantity, schedule and how you plan to pay." />

      {o.orderMode === 'individual' ? (
        <div className="space-y-2.5">
          <SectionLabel htmlFor="order-qty">Quantity</SectionLabel>
          <div className="flex items-stretch w-fit overflow-hidden rounded-lg border border-line bg-surface">
            <button type="button" aria-label="Fewer" disabled={o.quantity <= o.minQty} onClick={() => o.setQuantity((q) => Math.max(o.minQty, q - 1))} className="w-12 h-12 flex items-center justify-center text-ink hover:bg-sunken/50 disabled:text-ink-faint disabled:hover:bg-transparent transition-colors">
              <Minus size={18} />
            </button>
            <input
              id="order-qty"
              type="number"
              inputMode="numeric"
              min={o.minQty}
              max={500}
              value={o.quantity}
              onChange={(e) => {
                const n = Math.floor(Number(e.target.value));
                o.setQuantity(Number.isFinite(n) ? Math.min(500, Math.max(1, n)) : o.minQty);
              }}
              onBlur={() => o.setQuantity((q) => Math.max(o.minQty, q))}
              className="w-16 h-12 text-center text-base font-semibold text-ink tabular-nums border-x border-line bg-surface focus:outline-none focus:bg-canvas [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <button type="button" aria-label="More" disabled={o.quantity >= 500} onClick={() => o.setQuantity((q) => Math.min(500, q + 1))} className="w-12 h-12 flex items-center justify-center text-ink hover:bg-sunken/50 disabled:text-ink-faint transition-colors">
              <Plus size={18} />
            </button>
          </div>
          {o.minQty > 1 && <p className="mobile-caption text-ink-muted">This shop takes orders of {o.minQty} pieces or more.</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between bg-surface border border-line rounded-lg px-4 py-3">
          <span className="text-sm text-ink-muted">Quantity (from your size breakdown)</span>
          <span className="text-base font-semibold text-ink tabular-nums">{o.pieces} pcs</span>
        </div>
      )}

      <div className="space-y-2.5">
        <SectionLabel htmlFor="order-needed-by">
          When do you need it? <span className="text-ink-faint font-normal">(Optional)</span>
        </SectionLabel>
        <p className="mobile-caption text-ink-muted -mt-1">The shop confirms the actual finish date when it accepts the order.</p>
        <input
          id="order-needed-by"
          type="date"
          min={tomorrow}
          value={o.neededBy}
          onChange={(e) => o.setNeededBy(e.target.value)}
          aria-describedby={usualDays ? 'order-usual-days' : undefined}
          className={`${FIELD} sm:w-64`}
        />
        {usualDays && (
          <p id="order-usual-days" className="text-sm text-ink-body">
            This service usually takes <strong className="font-semibold text-ink">{formatServiceTurnaround(usualDays.min, usualDays.max)}</strong>.
          </p>
        )}
        {tooSoon && (
          <p role="status" className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-snug text-amber-900">
            <Zap size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>That&apos;s sooner than this service usually takes. Consider <strong className="font-semibold">requesting rush production</strong> below.</span>
          </p>
        )}
      </div>

      <label className="flex items-start gap-3 bg-surface border border-line rounded-lg p-3.5 cursor-pointer has-[:checked]:border-taupe has-[:checked]:bg-taupe/10">
        <input type="checkbox" checked={o.rushRequested} onChange={(e) => o.setRushRequested(e.target.checked)} className="mt-0.5 w-5 h-5 accent-[#6B5346] shrink-0" />
        <span>
          <span className="block text-sm font-semibold text-ink">Request rush production</span>
          <span className="block mobile-caption text-ink-muted mt-0.5">If the shop can rush it, they'll add their rush fee before you pay.</span>
        </span>
      </label>

      <fieldset className="space-y-2.5">
        <SectionLabel as="legend">Payment term</SectionLabel>
        <div className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label="Payment term">
          {!fullOnly && (
            <ChoiceCard
              selected={o.paymentTerm === 'downpayment'}
              onSelect={() => o.setPaymentTerm('downpayment')}
              label={o.policy === 'none' ? 'Pay at pickup' : `Downpayment (${o.depositPercent}%)`}
              detail={o.policy === 'none' ? 'Nothing to pay before production.' : 'Pay the rest when you pick it up.'}
            />
          )}
          <ChoiceCard selected={o.paymentTerm === 'full'} onSelect={() => o.setPaymentTerm('full')} label="Full payment" detail="Settle everything before production starts." />
        </div>
      </fieldset>

      <OrderGcashPayment o={o} />

      <section className="bg-surface border-2 border-ink rounded-lg px-4 py-3">
        <h2 className="mobile-h4 text-ink pb-1">Order financial summary</h2>
        <dl className="divide-y divide-line">
          <Line label="Item rate" value={o.unitPrice > 0 ? peso(o.unitPrice) : 'Quoted by shop'} />
          <Line label="Quantity" value={`× ${o.pieces}`} />
          {o.rushRequested && <Line label="Rush fee" value="Set by the shop" />}
          <Line label="Estimated total" value={o.estimatedTotal !== null ? peso(o.estimatedTotal) : 'Quoted by shop'} strong />
          {o.dueNow !== null && o.dueNow > 0 && (
            <Line
              label={o.paymentNeeded ? 'Paying now by GCash' : o.paymentTerm === 'full' ? 'To pay before production' : 'Downpayment before production'}
              value={peso(o.dueNow)}
            />
          )}
        </dl>
        <ol className="mt-2 text-sm text-ink-body space-y-1.5 list-decimal pl-5 marker:text-ink-faint">
          <li>The shop reviews your order and confirms the final price.</li>
          <li>
            {o.paymentNeeded
              ? 'The shop checks your GCash receipt, then your balance updates in My Orders.'
              : `${paymentCopy(o.requirements)} You pay from My Orders once it's accepted.`}
          </li>
          <li>Track every stage, from cutting to pickup, in My Orders.</li>
        </ol>
      </section>

      {o.error && (
        <p role="alert" className="text-sm text-danger">
          {o.error}
        </p>
      )}
    </div>
  );
}
