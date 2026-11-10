import type { Map as LeafletMap } from 'leaflet';

/** Street level — close enough to see the block you're on. */
export const FOCUS_ZOOM = 16;

/**
 * Centre the map on a place at street level. Zooms in when the map is farther
 * out, but never zooms OUT of a closer view the person already chose.
 */
export function focusOn(map: LeafletMap, lat: number, lng: number, animate = true): void {
  const zoom = Math.max(map.getZoom(), FOCUS_ZOOM);
  map.flyTo([lat, lng], zoom, { animate, duration: animate ? 0.6 : 0 });
}
