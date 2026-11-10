import type { BadgeVariant } from '@/components/shared/Badge';

export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type PaymentType = 'new_shop' | 'upgrade' | 'renewal' | 'downgrade';

/** One row of Admin → Payments (Admin\PlatformPaymentController::row). */
export interface PlatformPayment {
  id: number;
  type: PaymentType;
  status: PaymentStatus;
  billing_cycle: 'monthly' | 'yearly';
  amount_due: number;
  amount_sent: number | null;
  payment_reference: string | null;
  sender_name: string | null;
  sender_number: string | null;
  paid_at_reported: string | null;
  has_receipt: boolean;
  rejection_reason: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  created_at: string;
  reviewed_at: string | null;
  resubmission_of_id: number | null;
  warning_count: number;
  store: { id: number; name: string } | null;
  owner: { name: string; email: string; phone: string | null } | null;
  plan: { id: number; name: string } | null;
  reviewer: string | null;
}

export interface PaymentDetail extends PlatformPayment {
  logs: { id: number; action: string; note: string | null; created_at: string; by: string | null }[];
  warnings: { code: string; message: string }[];
  store_subscription: { plan: string | null; status: string; ends_at: string | null; scheduled_plan: string | null } | null;
}

export interface PaymentStats {
  to_verify: number;
  with_applications: number;
  paid_this_month: number;
  paid_this_month_count: number;
  total_revenue: number;
  rejected_open: number;
  active_subscriptions: number;
  total: number;
  paid: number;
  pending: number;
}

export interface GcashSettings {
  name: string | null;
  number: string | null;
  qr_url: string | null;
}

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: 'Pending verification',
  approved: 'Paid',
  rejected: 'Rejected',
};

export const STATUS_BADGE: Record<PaymentStatus, BadgeVariant> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

export const TYPE_LABEL: Record<PaymentType, string> = {
  new_shop: 'New shop',
  upgrade: 'Upgrade',
  renewal: 'Renewal',
  downgrade: 'Downgrade',
};

/** Bold + colored type label; hues kept apart from the status badges (amber / green / red). */
export const TYPE_CLASS: Record<PaymentType, string> = {
  new_shop: 'font-bold text-taupe',
  upgrade: 'font-bold text-blue-700',
  renewal: 'font-bold text-teal-700',
  downgrade: 'font-bold text-orange-700',
};

export const QUICK_REJECT_REASONS = [
  'Reference not found in GCash',
  'Amount incorrect',
  'Unclear screenshot',
  'Sender name or number does not match',
];

/** ₱1,999.00 — thousands separators, always two decimals. */
export function peso(value: number | string | null | undefined): string {
  return `₱${Number(value ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Date-range presets → YYYY-MM-DD (Asia/Manila calendar days, like the server). */
export type DatePreset = '' | 'today' | '7d' | '30d' | 'month' | 'custom';

export function presetRange(preset: DatePreset): { from: string; to: string } {
  const day = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const now = new Date();
  const ago = (n: number) => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };
  switch (preset) {
    case 'today': return { from: day(now), to: day(now) };
    case '7d': return { from: day(ago(6)), to: day(now) };
    case '30d': return { from: day(ago(29)), to: day(now) };
    case 'month': {
      const today = day(now);
      return { from: `${today.slice(0, 8)}01`, to: today };
    }
    default: return { from: '', to: '' };
  }
}
