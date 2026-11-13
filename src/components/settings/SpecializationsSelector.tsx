import React, { useState } from 'react';
import {
  Flower2, Gem, Plus, Ruler, Scissors, Shirt, Sun, Trophy, X,
  type LucideIcon,
} from 'lucide-react';
import { STORE_SPECIALIZATIONS, specializationLabel } from '@/lib/storeSpecializations';

interface SpecializationsSelectorProps {
  readonly specializations: string[];
  readonly onChange: (specializations: string[]) => void;
  /** The shop's own services ("+ Add Service"), shown in the same list. */
  readonly customServices: string[];
  readonly onCustomChange: (customServices: string[]) => void;
}

const ICONS: Record<string, LucideIcon> = {
  custom_tailoring: Ruler,
  alterations_repairs: Scissors,
  formal: Gem,
  casual: Sun,
  uniform: Shirt,
  sports: Trophy,
  embroidery: Flower2,
};

const OPTIONS = STORE_SPECIALIZATIONS.map((s) => ({ id: s.value, label: s.label, Icon: ICONS[s.value] ?? Scissors }));
const OPTION_IDS = new Set(OPTIONS.map((o) => o.id));
const MAX_OWN = 5;

const TILE = 'flex items-center gap-2 p-2.5 border text-xs font-medium text-left transition-all';
const ON = 'border-taupe bg-canvas text-ink';

function Tick({ on }: { readonly on: boolean }) {
  return (
    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] shrink-0 ${on ? 'border-taupe bg-taupe text-white' : 'border-line'}`}>
      {on ? '✓' : ''}
    </span>
  );
}

// The shop's Services: the 10 standard ones plus up to 5 of its own, in one list.
export default function SpecializationsSelector({ specializations, onChange, customServices, onCustomChange }: SpecializationsSelectorProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');

  const toggle = (id: string) => {
    onChange(specializations.includes(id) ? specializations.filter((s) => s !== id) : [...specializations, id]);
  };
  // Saved earlier from a list that has since changed — still shown so the owner can remove them.
  const retired = specializations.filter((id) => !OPTION_IDS.has(id));

  const addOwn = () => {
    const name = draft.trim().replace(/\s+/g, ' ');
    if (name.length < 2) return setError('Type the service name (at least 2 letters).');
    if (name.length > 40) return setError('Keep the service name under 40 characters.');
    const taken = [...customServices, ...OPTIONS.map((o) => o.label)].some((s) => s.toLowerCase() === name.toLowerCase());
    if (taken) return setError(`"${name}" is already on your list.`);
    if (customServices.length >= MAX_OWN) return setError(`You can add up to ${MAX_OWN} services of your own.`);
    onCustomChange([...customServices, name]);
    setDraft('');
    setError('');
    setAdding(false);
  };
  const cancel = () => { setAdding(false); setDraft(''); setError(''); };

  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-muted">
        The services your shop offers. Customers filter shops by these on search and the map, and you file each service under one of them.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {OPTIONS.map((spec) => {
          const isChecked = specializations.includes(spec.id);
          const SpecIcon = spec.Icon;
          return (
            <button
              key={spec.id}
              type="button"
              aria-pressed={isChecked}
              onClick={() => toggle(spec.id)}
              className={`${TILE} cursor-pointer ${isChecked ? ON : 'border-line bg-white text-ink-body hover:bg-canvas'}`}
            >
              <SpecIcon size={14} className="shrink-0 text-current" />
              <span className="flex-1">{spec.label}</span>
              <Tick on={isChecked} />
            </button>
          );
        })}
        {customServices.map((name) => (
          <div key={name} className={`${TILE} ${ON}`}>
            <Scissors size={14} className="shrink-0 text-current" aria-hidden="true" />
            <span className="flex-1 min-w-0 break-words">{name}</span>
            <button
              type="button"
              onClick={() => onCustomChange(customServices.filter((s) => s !== name))}
              aria-label={`Remove ${name}`}
              className="-m-1.5 grid size-8 shrink-0 place-items-center text-ink-muted hover:text-danger cursor-pointer"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        ))}
        {!adding && customServices.length < MAX_OWN && (
          <button
            type="button"
            onClick={() => { setAdding(true); setError(''); }}
            className={`${TILE} justify-center border-dashed border-line-strong bg-white text-ink hover:bg-canvas cursor-pointer`}
          >
            <Plus size={14} aria-hidden="true" /> Add Service
          </button>
        )}
      </div>

      {adding && (
        <div className="space-y-1.5 border-t border-line pt-2">
          <label htmlFor="own-service" className="block text-xs text-ink">Can&rsquo;t find your service? Type it below</label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="own-service"
              autoFocus
              value={draft}
              maxLength={40}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOwn(); } if (e.key === 'Escape') cancel(); }}
              placeholder="e.g., Costume Design"
              className="h-10 min-w-0 flex-1 basis-48 border border-line-strong bg-white px-3 text-sm text-ink placeholder:text-ink-faint focus:border-taupe focus:outline-none"
            />
            <button type="button" onClick={cancel} className="min-h-10 px-3 text-xs text-ink-muted hover:text-ink cursor-pointer">Cancel</button>
            <button type="button" onClick={addOwn} className="min-h-10 bg-ink px-4 text-xs font-semibold text-white hover:bg-black cursor-pointer">Add</button>
          </div>
          {error && <p role="alert" className="text-xs text-danger">{error}</p>}
        </div>
      )}

      {retired.length > 0 && (
        <div className="space-y-1.5 border-t border-line pt-2">
          <p className="text-xs text-ink-muted">No longer offered as a choice — remove these and pick from the list above:</p>
          <div className="flex flex-wrap gap-1.5">
            {retired.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                aria-label={`Remove ${specializationLabel(id)}`}
                className="inline-flex min-h-8 items-center gap-1 border border-line bg-sunken px-2 text-xs text-ink-body hover:border-danger/40 hover:text-danger cursor-pointer"
              >
                {specializationLabel(id)}
                <X size={12} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
