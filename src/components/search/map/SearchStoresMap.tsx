'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronRight, MapPin, Star, X } from 'lucide-react';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import type { RelatedStore } from '../types';
import { storesToPins } from './storePins';

const DiscoveryMap = dynamic(() => import('@/components/discovery/DiscoveryMap'), {
  ssr: false,
  loading: () => <div className="h-130 flex items-center justify-center border border-line text-sm text-ink-muted">Loading map…</div>,
});

interface Props {
  readonly stores: RelatedStore[];
  readonly userCoords?: { lat: number; lng: number } | null;
  readonly gate: (href: string) => string;
  /** The District filter, so each shop's pin is its branch in that district. */
  readonly district?: string;
}

// The Shops results on a map: tap a shop's pin to see its branches and open it.
export default function SearchStoresMap({ stores, userCoords, gate, district = '' }: Props) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<DiscoveryMapBranch | null>(null);

  const pins = useMemo(() => storesToPins(stores, selectedSlug, district), [stores, selectedSlug, district]);
  const selectedStore = stores.find((s) => s.slug === selectedSlug) ?? null;
  const withoutPin = stores.filter((s) => !(s.branches ?? []).some((b) => b.latitude && b.longitude)).length;

  const select = (b: DiscoveryMapBranch | null) => {
    setSelectedBranch(b);
    setSelectedSlug(b?.storeSlug ?? null);
  };

  return (
    <div className="space-y-3">
      <DiscoveryMap
        branches={pins}
        userLocation={userCoords ?? null}
        onSelectBranch={select}
        cluster
        selectedBranch={selectedBranch}
        // Selecting a shop adds its branch pins; keep the view where the person tapped.
        disableFitBounds={selectedSlug !== null}
      />

      {selectedStore && selectedBranch ? (
        <div className="border border-line bg-surface p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-ink truncate">{selectedStore.name}</p>
              <p className="text-xs text-ink-muted flex items-center gap-2 flex-wrap">
                {selectedStore.reviews_avg_rating ? (
                  <span className="inline-flex items-center gap-0.5 font-semibold">
                    <Star size={11} className="fill-current text-taupe" />
                    {Number(selectedStore.reviews_avg_rating).toFixed(1)} ({selectedStore.reviews_count ?? 0})
                  </span>
                ) : null}
                {selectedStore.distance_km != null && <span>{selectedStore.distance_km.toFixed(1)} km away</span>}
              </p>
            </div>
            <button type="button" onClick={() => select(null)} aria-label="Close" className="w-9 h-9 flex items-center justify-center text-ink-muted hover:text-ink shrink-0">
              <X size={16} />
            </button>
          </div>

          {(selectedStore.branches ?? []).length > 1 && (
            <ul className="divide-y divide-line border-y border-line">
              {(selectedStore.branches ?? []).map((b) => {
                const on = selectedBranch.branchId === b.id;
                const pin = pins.find((p) => p.storeSlug === selectedStore.slug && p.branchId === b.id);
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      disabled={!pin}
                      onClick={() => pin && setSelectedBranch(pin)}
                      className={`w-full min-h-11 flex items-center gap-2 px-1 text-left text-sm ${on ? 'font-semibold text-ink' : 'text-ink-body'} disabled:opacity-50`}
                    >
                      <MapPin size={14} className={on ? 'text-taupe' : 'text-ink-faint'} />
                      <span className="truncate flex-1">{b.name}{b.district ? ` · ${b.district}` : ''}</span>
                      {b.is_main ? <span className="text-[10px] font-bold uppercase tracking-wide text-taupe">Main</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <Link href={gate(`/store/${selectedStore.slug}`)} className="min-h-11 w-full flex items-center justify-center gap-1 bg-ink text-white text-sm font-semibold hover:bg-black">
            View shop <ChevronRight size={16} />
          </Link>
        </div>
      ) : (
        <p className="text-xs text-ink-muted">
          Tap a shop&apos;s pin to see its branches.
          {withoutPin > 0 ? ` ${withoutPin} shop${withoutPin === 1 ? " hasn't" : "s haven't"} set a map pin yet — see them in List view.` : ''}
        </p>
      )}
    </div>
  );
}
