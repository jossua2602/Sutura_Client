'use client';

import React from 'react';
import { Info } from 'lucide-react';
import type { PublicService } from '@/components/store-storefront/types';

/** Text field look for every step of the online order: white, rounded, light border. */
export const FIELD = 'w-full h-12 rounded-lg border border-line bg-surface px-4 text-base text-ink placeholder:text-ink-faint transition-colors focus:outline-none focus:border-taupe focus:ring-2 focus:ring-taupe/15';

/** Light-blue tip box (Sizing Guide, Measurement Tip, own fabric) shown above the fields it's about. */
export function FitTip({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div role="note" className="flex items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
      <Info size={22} className="shrink-0 text-blue-800" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-sm leading-snug text-ink-body">{children}</p>
      </div>
    </div>
  );
}

/** The highlighted phrase inside a FitTip. */
export function Em({ children }: Readonly<{ children: React.ReactNode }>) {
  return <strong className="font-semibold text-blue-800">{children}</strong>;
}

export function peso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

type Requirements = NonNullable<PublicService['order_requirements']>;

export function measurementCopy(r?: Requirements): string {
  switch (r?.measurement_requirement) {
    case 'none':
      return 'No measurements needed for this service.';
    case 'existing':
      return 'The shop works from measurements it already has on file for you.';
    default:
      return 'The shop takes your measurements in person before cutting.';
  }
}

export function paymentCopy(r?: Requirements): string {
  switch (r?.payment_policy) {
    case 'none':
      return 'Nothing to pay before production starts.';
    case 'full':
      return 'Full payment is needed before production starts.';
    default:
      return `A ${r?.payment_policy_percent ?? 50}% deposit is needed before production starts.`;
  }
}

// Each step's heading, named after the matching step of the walk-in wizard.
export function StepIntro({ title, text }: Readonly<{ title: string; text: string }>) {
  return (
    <div>
      <h2 className="text-lg font-bold text-ink text-balance">{title}</h2>
      <p className="text-sm text-ink-muted mt-0.5">{text}</p>
    </div>
  );
}

export function SectionLabel({
  children,
  htmlFor,
  as = 'label',
}: Readonly<{ children: React.ReactNode; htmlFor?: string; as?: 'label' | 'legend' | 'p' }>) {
  const cls = 'mobile-h4 text-ink block mb-0';
  if (as === 'legend') return <legend className={`${cls} mb-2.5`}>{children}</legend>;
  if (as === 'p' || !htmlFor) return <p className={cls}>{children}</p>;
  return <label htmlFor={htmlFor} className={cls}>{children}</label>;
}

// Same radio-card look as the booking wizard's material picker.
export function ChoiceCard({
  selected,
  onSelect,
  label,
  detail,
  trailing,
}: Readonly<{ selected: boolean; onSelect: () => void; label: string; detail?: string; trailing?: string }>) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`min-h-[52px] w-full p-3.5 rounded-lg border text-left transition-colors cursor-pointer flex items-center gap-3 ${
        selected ? 'border-taupe bg-taupe/10 shadow-sm' : 'border-line bg-surface hover:border-taupe/40'
      }`}
    >
      <span
        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
          selected ? 'border-taupe bg-taupe' : 'border-line bg-surface'
        }`}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-white" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-sm font-medium ${selected ? 'text-ink' : 'text-ink-body'}`}>{label}</span>
        {detail && <span className="block mobile-caption text-ink-muted mt-0.5">{detail}</span>}
      </span>
      {trailing && <span className="text-sm font-semibold text-ink tabular-nums shrink-0">{trailing}</span>}
    </button>
  );
}
