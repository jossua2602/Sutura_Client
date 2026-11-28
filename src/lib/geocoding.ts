export interface GeocodeResult {
  address: string;
  district: string;
  street?: string;
}

export interface PlaceSearchResult {
  lat: number;
  lng: number;
  display_name: string;
}

// A free service that hangs must not hold the address on "Locating…" forever.
const LOOKUP_TIMEOUT_MS = 5000;

// "Talomo District" → "Talomo".
const cleanDistrict = (d?: string) => (d ?? '').replace(/\s+district$/i, '').trim();

/** "Street, Barangay, District, City" with blanks and repeats left out. */
function joinAddress(...parts: (string | undefined)[]): string {
  const out: string[] = [];
  for (const p of parts) {
    const v = p?.trim();
    if (v && !out.includes(v)) out.push(v);
  }
  return out.join(', ');
}

// Photon (OSM / Komoot): short, street-level names. Asks for the nearest
// street first: the nearest thing of any kind is often a hotel, school or
// shop, whose own street can be a block away (someone on Jasmin Street was
// shown "Citistyle Inn, Rafael Castillo"). If no street comes back, the
// nearest feature is used, with its street ahead of its name, because the
// name changes every few metres as the reading drifts. Null when it has
// nothing usable.
async function photonReverse(lat: number, lng: number): Promise<GeocodeResult | null> {
  return (await photonQuery(lat, lng, true)) ?? photonQuery(lat, lng, false);
}

async function photonQuery(lat: number, lng: number, streetOnly: boolean): Promise<GeocodeResult | null> {
  try {
    const layer = streetOnly ? '&layer=street&limit=1' : '';
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}${layer}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data?.features?.[0]?.properties;
    if (!feature) return null;
    // A street feature's `name` is the street itself.
    const primary = streetOnly ? feature.name || feature.street : feature.street || feature.name;
    const district = cleanDistrict(feature.district);
    const address = joinAddress(primary, feature.locality, district, feature.city);
    if (!address) return null;
    return {
      address,
      district: district || feature.locality || feature.city || 'Davao City',
      street: primary,
    };
  } catch {
    return null;
  }
}

// Nominatim (OSM): usually faster here. Asked at street zoom (17), and the
// label is built from the address parts: display_name starts with whatever
// building or shop is nearest.
async function nominatimReverse(lat: number, lng: number): Promise<GeocodeResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data?.address;
    if (!a && !data?.display_name) return null;
    const barangay = a?.quarter || a?.neighbourhood || a?.village;
    const district = cleanDistrict(a?.suburb || a?.city_district);
    const address = a?.road ? joinAddress(a.road, barangay, district, a.city || 'Davao City') : data?.display_name;
    if (!address) return null;
    return {
      address,
      district: district || barangay || a?.city || 'Davao City',
      street: a?.road,
    };
  } catch {
    return null;
  }
}

// BigDataCloud's keyless client endpoint: no street, but the district and
// city ("Poblacion, Davao City"). Used only when Photon and Nominatim both
// fail — Nominatim rate-limits busy connections (429) and Photon has outages.
async function bigDataCloudReverse(lat: number, lng: number): Promise<GeocodeResult | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const admin: { name?: string; adminLevel?: number }[] = data?.localityInfo?.administrative ?? [];
    // Deepest named area below the city (adminLevel 8+: district / barangay).
    const area = [...admin].reverse().find((a) => (a.adminLevel ?? 0) >= 8 && a.name)?.name;
    const city = data?.city === 'Davao' ? 'Davao City' : data?.city || data?.locality;
    const parts = [area, city].filter((p): p is string => !!p);
    if (parts.length === 0) return null;
    return { address: parts.join(', '), district: area || city || 'Davao City' };
  } catch {
    return null;
  }
}

const PREFER_PHOTON_MS = 1500;

// The picker asks for the same spot twice (once when it jumps there, once when
// the map stops moving): share one lookup per ~1 m spot, and remember answers,
// so the free services see half the traffic and rate-limit us less.
const reverseCache = new Map<string, Promise<GeocodeResult | null>>();

/**
 * Coordinates → a human-readable address with the street name. Asks Photon
 * and Nominatim at the same time: Photon's shorter label wins if it answers
 * within 1.5 s, otherwise whichever answers first. If both fail, BigDataCloud
 * gives the district and city. Coordinates as the label only when all three
 * fail (offline).
 */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<GeocodeResult> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  let lookup = reverseCache.get(key);
  if (!lookup) {
    lookup = lookupAddress(lat, lng);
    reverseCache.set(key, lookup);
    // Don't remember a failure: the next try may get through.
    void lookup.then((r) => { if (!r) reverseCache.delete(key); });
  }
  const result = await lookup;
  return result ?? { address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, district: 'Davao City' };
}

async function lookupAddress(lat: number, lng: number): Promise<GeocodeResult | null> {
  const photon = photonReverse(lat, lng);
  const nominatim = nominatimReverse(lat, lng);

  const quickPhoton = await Promise.race([
    photon,
    new Promise<null>((r) => setTimeout(() => r(null), PREFER_PHOTON_MS)),
  ]);
  const result =
    quickPhoton ??
    // First non-null of the two; null only when both came back empty.
    (await new Promise<GeocodeResult | null>((resolve) => {
      let pending = 2;
      const take = (r: GeocodeResult | null) => {
        if (r) resolve(r);
        else if (--pending === 0) resolve(null);
      };
      void photon.then(take);
      void nominatim.then(take);
    }));

  return result ?? bigDataCloudReverse(lat, lng);
}

async function singleQueryPlaces(query: string): Promise<PlaceSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Strategy 1: Photon search biased to Davao City (7.0707, 125.6083)
  try {
    const res = await fetch(
      // bbox: only places in the Davao area (the same box as the Nominatim search below). Without it Photon
      // only leans toward Davao, and "… in front of … Gym" came back with gyms in Karachi and Korea.
      `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lat=7.0707&lon=125.6083&bbox=125.30,6.85,125.80,7.40&limit=8`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) }
    );
    if (res.ok) {
      const data = await res.json();
      const features = data?.features;
      if (Array.isArray(features) && features.length > 0) {
        const results: PlaceSearchResult[] = features
          .map((f: any) => {
            const p = f.properties;
            const parts: string[] = [];
            const primary = p.name || p.street;
            if (primary) parts.push(primary);
            if (p.locality && !parts.includes(p.locality)) parts.push(p.locality);
            const district = cleanDistrict(p.district);
            if (district && !parts.includes(district)) parts.push(district);
            if (p.city && !parts.includes(p.city)) parts.push(p.city);

            const display_name = parts.join(', ');
            const [lng, lat] = f.geometry?.coordinates ?? [];
            return {
              lat,
              lng,
              display_name: display_name || primary,
            };
          })
          .filter((r) => r.lat != null && r.lng != null && !!r.display_name);

        if (results.length > 0) return results;
      }
    }
  } catch {
    // Fallback
  }

  // Strategy 2: Nominatim search
  try {
    const isDavaoQuery = trimmed.toLowerCase().includes('davao');
    const queryText = isDavaoQuery ? trimmed : `${trimmed}, Davao City`;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        queryText
      )}&viewbox=125.30,7.40,125.80,6.85&bounded=1&limit=8&countrycodes=ph`,
      { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((d: any) => ({
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
          display_name: d.display_name,
        }));
      }
    }
  } catch {
    // Fallback
  }

  return [];
}

// "St." → "Street", "Brgy." → "Barangay": OSM spells these out.
function expandAbbreviations(text: string): string {
  return text
    .replace(/\bste?\b\.?/gi, 'Street')
    .replace(/\bave\b\.?/gi, 'Avenue')
    .replace(/\bblvd\b\.?/gi, 'Boulevard')
    .replace(/\brd\b\.?/gi, 'Road')
    .replace(/\bext\b\.?/gi, 'Extension')
    .replace(/\b(?:brgy|bgy)\b\.?/gi, 'Barangay')
    .replace(/\s+/g, ' ')
    .trim();
}

// "in front of", "near", "corner"…: how people describe a spot here, which the map services don't understand.
const LANDMARK_WORDS =
  /\b(?:in\s*front\s*of|infront\s*of|front\s*of|fronting|near(?:\s*by|\s*to)?|beside|next\s*to|across(?:\s*from)?|opposite(?:\s*to)?|corner|cor\.?|along|behind|back\s*of|adjacent\s*to|close\s*to|between)\b/i;

/** At most this many extra searches when the full text finds nothing. */
const MAX_RETRIES = 4;

/**
 * Places around Davao City for what the visitor typed. When the full text
 * finds nothing, tries again with "St." spelled out, then each part of
 * "Pichon St. in front of Almendras Gym" on its own (street, then landmark).
 * Normal searches make one request, same as before.
 * Adapted from Joshua's map branch (map-for-bongo).
 */
export async function searchPlacesAroundDavao(query: string): Promise<PlaceSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const direct = await singleQueryPlaces(trimmed);
  if (direct.length > 0) return direct;

  const tries: string[] = [];
  const add = (q: string) => {
    const v = q.trim().replace(/^[,\s.-]+|[,\s.-]+$/g, '');
    if (v.length >= 2 && v !== trimmed && !/^(?:davao|davao city|philippines)$/i.test(v) && !tries.includes(v)) tries.push(v);
  };
  add(expandAbbreviations(trimmed));
  const splitter = new RegExp(LANDMARK_WORDS.source, 'gi');
  const parts = LANDMARK_WORDS.test(trimmed) ? trimmed.split(splitter) : trimmed.includes(',') ? trimmed.split(',') : [];
  for (const part of parts) add(expandAbbreviations(part.replace(/,\s*davao.*$/i, '')));

  const found: PlaceSearchResult[] = [];
  const seen = new Set<string>();
  for (const q of tries.slice(0, MAX_RETRIES)) {
    for (const hit of await singleQueryPlaces(q)) {
      const key = `${hit.lat.toFixed(4)},${hit.lng.toFixed(4)}`;
      if (!seen.has(key)) {
        seen.add(key);
        found.push(hit);
      }
    }
    if (found.length >= 8) break;
  }
  return found.slice(0, 8);
}
