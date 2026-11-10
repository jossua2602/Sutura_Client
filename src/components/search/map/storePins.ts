import { isStoreOpen } from '@/lib/storeStatus';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import type { RelatedStore } from '../types';

type Branch = NonNullable<RelatedStore['branches']>[number];

const hasCoords = (b: Branch) =>
  b.latitude != null && b.longitude != null && !Number.isNaN(Number(b.latitude)) && !Number.isNaN(Number(b.longitude));

function toPin(store: RelatedStore, b: Branch, open: boolean): DiscoveryMapBranch {
  return {
    storeSlug: store.slug,
    storeName: store.name,
    storeLogoPath: store.logo_path,
    branchId: b.id,
    branchName: b.name,
    isMain: Boolean(b.is_main),
    address: b.address ?? null,
    city: b.city,
    district: b.district,
    landmark: null,
    latitude: Number(b.latitude),
    longitude: Number(b.longitude),
    isOpen: open,
    rating: store.reviews_avg_rating,
    reviewsCount: store.reviews_count,
    distanceKm: store.distance_km ?? null,
  };
}

/**
 * Search-result pins: one per shop — its main branch, or with a district filter
 * the branch in that district. The selected shop shows ALL its branches so the
 * customer can pick the one they'll visit.
 */
export function storesToPins(stores: RelatedStore[], selectedSlug: string | null, district = ''): DiscoveryMapBranch[] {
  const d = district.toLowerCase();
  return stores.flatMap((store) => {
    const open = isStoreOpen(store.operating_hours);
    const branches = (store.branches ?? []).filter(hasCoords);
    if (branches.length === 0) return [];
    if (store.slug === selectedSlug) return branches.map((b) => toPin(store, b, open));
    const primary = (d && branches.find((b) => b.district?.toLowerCase() === d))
      || branches.find((b) => Boolean(b.is_main))
      || branches[0];
    return [toPin(store, primary, open)];
  });
}
