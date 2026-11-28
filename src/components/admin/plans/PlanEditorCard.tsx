'use client';

import { useState } from 'react';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import Badge from '@/components/shared/Badge';

export interface AdminPlan {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: string;
  price_yearly: string;
  max_staff: number;
  max_branches: number | null;
  max_services: number;
  max_appointments_per_month: number;
  features: string[] | null;
  is_active: boolean;
}

// The perks SUTURA really has, per plan (same lists as the server migration
// 2026_11_28_120000_keep_only_real_plan_perks). Anything else typed in is just text.
// "Featured Store Visibility (Top Placement)" must keep this exact wording: the
// server reads it to mark a shop as featured.
const STANDARD_PERKS: Record<string, string[]> = {
  basic: ['Customer Management', 'Appointment Scheduling', 'Order Tracking', 'Measurement Recording', 'Standard Search Listing'],
  pro: ['All Basic Plan Features', 'Sales & Staff Reports', 'SMS Text Notifications'],
  premium: ['All Pro Plan Features', 'Multi-Branch Management', 'Featured Store Visibility (Top Placement)', 'Branch Comparison Reports', 'Income & Receipt Exports'],
};
const REAL_PERKS = new Set(Object.values(STANDARD_PERKS).flat());

const FIELD = 'w-full min-h-11 border border-line-strong bg-surface px-3 text-base text-ink focus:border-ink focus:outline-none';
const NUMBERS = [
  ['price_monthly', 'Monthly (₱)'], ['price_yearly', 'Yearly (₱)'], ['max_staff', 'Max staff'],
  ['max_branches', 'Max branch shops'], ['max_services', 'Max services'], ['max_appointments_per_month', 'Appointments / mo'],
] as const;

export default function PlanEditorCard({ plan, onSaved }: { readonly plan: AdminPlan; readonly onSaved: (plan: AdminPlan) => void }) {
  const toast = useToast();
  const [draft, setDraft] = useState(plan);
  const [features, setFeatures] = useState((plan.features ?? []).join('\n'));
  const [saving, setSaving] = useState(false);
  const standard = STANDARD_PERKS[plan.slug];
  const unknown = features.split('\n').map((f) => f.trim()).filter((f) => f && !REAL_PERKS.has(f));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApi.put(`/admin/subscription-plans/${plan.id}`, {
        ...draft,
        features: features.split('\n').map((f) => f.trim()).filter(Boolean),
      });
      onSaved(res.data.data);
      toast.success(`${draft.name} plan saved.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save this plan.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="admin-card overflow-hidden p-5">
      <div className="flex items-center justify-between gap-3">
        <input aria-label="Plan name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="tablet-h3 min-w-0 flex-1 border-b border-transparent bg-transparent text-ink focus:border-ink focus:outline-none" />
        <Badge variant={draft.is_active ? 'success' : 'neutral'}>{draft.is_active ? 'On sale' : 'Retired'}</Badge>
      </div>
      <textarea aria-label="Description" rows={2} value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={`${FIELD} mt-3 py-2`} />

      <div className="mt-4 grid grid-cols-2 gap-3">
        {NUMBERS.map(([key, label]) => (
          <label key={key} className="text-sm text-ink-muted">
            {label}
            <input type="number" min={key.startsWith('price') ? 0 : -1} step={key.startsWith('price') ? '0.01' : '1'} required value={draft[key] ?? ''}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} className={`${FIELD} mt-1`} />
          </label>
        ))}
      </div>
      <p className="mt-2 text-xs text-ink-faint">-1 means unlimited. Max branch shops counts locations beyond the main shop, which never counts (0 = main shop only). Both limits are shown to shops automatically (e.g. “Up to 2 staff accounts”, “Main shop + 1 branch shop”) — no need to add them as perks.</p>

      <label className="mt-4 block text-sm text-ink-muted">
        Perks (one per line)
        <textarea rows={5} value={features} onChange={(e) => setFeatures(e.target.value)} className={`${FIELD} mt-1 py-2`} />
      </label>
      <p className="mt-2 text-xs text-ink-faint">
        Shops see these on the plan cards. Only list what this plan really unlocks; reports, text messages, branches,
        featured placement and exports follow the plan itself, not this text.
      </p>
      {unknown.length > 0 && (
        <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2">
          Not a SUTURA feature, so shops won&apos;t get it: {unknown.join(', ')}.
        </p>
      )}
      {standard && (
        <button
          type="button"
          onClick={() => setFeatures(standard.join('\n'))}
          className="mt-2 min-h-9 border border-line-strong bg-surface px-3 text-xs font-semibold text-ink hover:bg-sunken"
        >
          Use the standard perks for {draft.name}
        </button>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} className="h-5 w-5 accent-ink" />
          Offer on the shop application
        </label>
        <button type="submit" disabled={saving} className="min-h-11 bg-ink px-5 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Plan'}
        </button>
      </div>
    </form>
  );
}
