'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import '@/lib/leafletSafe';
import 'leaflet/dist/leaflet.css';
import { LocateFixed, Minus, Plus } from 'lucide-react';
import type { SavedLocation } from '@/lib/customerLocation';
import LocationPickerHeader from './location-picker/LocationPickerHeader';
import LocationPickerFooter from './location-picker/LocationPickerFooter';
import { useLocationPickerState } from './location-picker/useLocationPickerState';

function MapRefSetter({ mapRef }: { readonly mapRef: React.MutableRefObject<LeafletMap | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    // Re-measure when the window (and so the full-screen map) changes size,
    // or getCenter() would disagree with the CSS centre pin and the saved
    // spot would drift. pan:false keeps the current centre while resizing.
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => map.invalidateSize({ pan: false }))
      : null;
    observer?.observe(map.getContainer());
    return () => {
      clearTimeout(timer);
      observer?.disconnect();
      try {
        map.stop();
      } catch {
        // Safe fallback
      }
    };
  }, [map, mapRef]);
  return null;
}

function MapCenterTracker({ onMoveEnd }: { readonly onMoveEnd: (lat: number, lng: number) => void }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      onMoveEnd(c.lat, c.lng);
    },
  });
  return null;
}

interface LocationPickerProps {
  readonly initial: SavedLocation | null;
  readonly onClose: () => void;
  readonly onConfirm: (loc: SavedLocation) => void;
  readonly confirmLabel?: string;
}

/**
 * Full-screen "choose a spot": the map with a fixed pin in its middle, a search
 * bar (addresses, popular Davao places, recents, Maps links) floating above,
 * locate/zoom buttons, and the chosen address with one button below. No shop
 * pins — this is for placing your own spot.
 */
export default function LocationPicker({
  initial,
  onClose,
  onConfirm,
  confirmLabel = 'Choose this Location',
}: Readonly<LocationPickerProps>) {
  const state = useLocationPickerState(initial, onConfirm);

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const control = 'w-11 h-11 rounded-full bg-white border border-line flex items-center justify-center text-ink shadow-md hover:bg-sunken disabled:opacity-60';

  // Rendered on <body>, not where it's used: callers open it from inside their
  // own <form> (shop registration, branch form), and a picker living in that
  // form's DOM would let Enter or any stray button submit it.
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Choose a location" className="fixed inset-0 z-[70] h-dvh w-screen overflow-hidden bg-canvas">
      <MapContainer center={state.position} zoom={16} className="absolute inset-0 w-full h-full" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRefSetter mapRef={state.mapRef} />
        <MapCenterTracker onMoveEnd={state.handleMapMoveEnd} />
      </MapContainer>

      {/* Centre pin: its tip marks the map centre. */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-[500]">
        <svg width="34" height="44" viewBox="0 0 30 38" fill="none" aria-hidden="true">
          <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.7 23.3 0 15 0z" fill="#2D2A26" stroke="#fff" strokeWidth="2" />
          <circle cx="15" cy="15" r="5" fill="#fff" />
        </svg>
      </div>

      <LocationPickerHeader
        query={state.query}
        setQuery={state.setQuery}
        searching={state.searching}
        onSearchSubmit={(text) => void state.handleSearchSubmit(text)}
        onClose={onClose}
        suggestionsVisible={state.suggestionsVisible}
        searchResults={state.searchResults}
        recents={state.recents}
        onPickSearchResult={state.handlePickSearchResult}
        onPickRecent={state.handlePickRecent}
        onInputFocus={state.handleInputFocus}
        onInputBlur={state.handleInputBlur}
      />

      {/* Locate + zoom, on the right above the bottom card. */}
      <div className="absolute right-3 bottom-[calc(11rem+env(safe-area-inset-bottom))] z-[550] flex flex-col gap-2">
        <button type="button" onClick={state.handleUseCurrentLocation} disabled={state.locating} className={control} aria-label="Go to my current location">
          <LocateFixed size={20} className={state.locating ? 'animate-pulse' : ''} />
        </button>
        <button type="button" onClick={() => state.zoomBy(1)} className={control} aria-label="Zoom in">
          <Plus size={20} />
        </button>
        <button type="button" onClick={() => state.zoomBy(-1)} className={control} aria-label="Zoom out">
          <Minus size={20} />
        </button>
      </div>

      <LocationPickerFooter
        error={state.error}
        reverseLoading={state.reverseLoading}
        address={state.address}
        confirmLabel={confirmLabel}
        onConfirm={state.handleConfirm}
      />
    </div>,
    document.body,
  );
}
