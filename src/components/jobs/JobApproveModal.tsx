import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import type { Job } from './jobHelpers';
import type { Staff } from '@/components/staff/staffHelpers';
import { staffForBranch, staffOptionLabel } from '@/components/staff/staffHelpers';
import { getLocalDateString } from '@/components/appointments/appointmentHelpers';

export interface ApprovePayload {
  due_date: string;
  assigned_staff_id: number | null;
}

interface JobApproveModalProps {
  readonly job: Job | null;
  readonly staffList: Staff[];
  readonly onClose: () => void;
  readonly onConfirm: (jobId: number, payload: ApprovePayload) => Promise<boolean>;
}

// The service's usual turnaround, else a week — the same starting point the walk-in form suggests.
function suggestedDueDate(job: Job): string {
  if (job.due_date) return job.due_date.slice(0, 10);
  const days = Number(job.service?.estimated_days) || 7;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
}

/**
 * Approving an online order asks for what a walk-in order is created with:
 * a due date (required) and, optionally, who will work on it.
 */
export default function JobApproveModal({ job, staffList, onClose, onConfirm }: JobApproveModalProps) {
  return (
    <Modal isOpen={!!job} onClose={onClose} title="Approve Order">
      {/* Keyed so each order opens with its own suggested values. */}
      {job && <ApproveForm key={job.id} job={job} staffList={staffList} onClose={onClose} onConfirm={onConfirm} />}
    </Modal>
  );
}

function ApproveForm({ job, staffList, onClose, onConfirm }: Readonly<{ job: Job } & Omit<JobApproveModalProps, 'job'>>) {
  const currentStaff = job.assigned_staff_id ?? job.assigned_to ?? null;
  const [dueDate, setDueDate] = useState(() => suggestedDueDate(job));
  const [staffId, setStaffId] = useState<string>(currentStaff ? String(currentStaff) : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const today = getLocalDateString(new Date());

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!dueDate) { setError('Set a due date before approving this order.'); return; }
    if (dueDate < today) { setError("The due date can't be in the past."); return; }
    setError('');
    setSubmitting(true);
    const ok = await onConfirm(job.id, { due_date: dueDate, assigned_staff_id: staffId ? Number(staffId) : null });
    setSubmitting(false);
    if (ok) onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-ink-body">
        <strong>{job.order_number ?? `Order #${job.id}`}</strong>
        {job.customer?.name ? ` · ${job.customer.name}` : ''} moves into <strong>Production</strong>.
      </p>

      <div>
        <label htmlFor="approve-due-date" className="block text-sm font-medium text-ink-body mb-1.5">
          Due date <span className="text-danger">*</span>
        </label>
        <input
          id="approve-due-date"
          type="date"
          required
          min={today}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full min-h-11 bg-canvas border border-line rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe"
        />
      </div>

      <div>
        <label htmlFor="approve-staff" className="block text-sm font-medium text-ink-body mb-1.5">
          Assign staff <span className="text-ink-faint font-normal">(optional)</span>
        </label>
        <select
          id="approve-staff"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          className="w-full min-h-11 bg-canvas border border-line rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe"
        >
          <option value="">Unassigned</option>
          {staffForBranch(staffList, job.store_branch_id, currentStaff).map((s) => {
            const uid = s.user_id ?? s.user?.id;
            return uid ? <option key={uid} value={uid}>{staffOptionLabel(s)}</option> : null;
          })}
        </select>
      </div>

      {error && <p className="text-sm text-danger" role="alert">{error}</p>}

      <div className="pt-1 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 px-4 py-2 rounded-lg text-sm font-medium text-ink-body hover:bg-sunken transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 bg-ink hover:bg-ink/90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Approve order
        </button>
      </div>
    </form>
  );
}
