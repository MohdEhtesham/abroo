// OpenStreetMap Nominatim wrapper for India-wide location search.
//
// Free public service, no API key. The terms of use require a polite
// User-Agent and a soft rate limit of ~1 req/sec — we hit it via debounce
// at the call site, plus an AbortController so successive keystrokes
// cancel the prior request.
//
// We bias every query to India (countrycodes=in) and ask for parsed
// address components so the picker can show 'Powai, Mumbai, Maharashtra'
// instead of a long single-line label.

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Identify ourselves per their usage policy.
// https://operations.osmfoundation.org/policies/nominatim/
const USER_AGENT = 'AabrooApp/1.0 (real-estate; contact: support@aabroo.com)';

export interface LocationSearchResult {
  /** Full display label for the dropdown. */
  displayName: string;
  /** Short label shown in compact UI ("Powai", "Indiranagar"). */
  primary: string;
  /** Parent context shown muted ("Mumbai, Maharashtra"). */
  secondary: string;
  /** Best-effort city/town/village name. */
  city: string;
  /** Locality / suburb if present (varies by place type). */
  locality?: string;
  state?: string;
  lat: number;
  lng: number;
  /** OSM type — 'city' / 'suburb' / 'town' / 'state' / 'village' / etc. */
  kind: string;
  /** Stable id for React keys. */
  id: string;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  county?: string;
  state_district?: string;
  state?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  quarter?: string;
  postcode?: string;
}

interface NominatimRaw {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  class: string;
  address?: NominatimAddress;
}

const cityFromAddress = (a: NominatimAddress | undefined): string =>
  a?.city ?? a?.town ?? a?.village ?? a?.hamlet ?? a?.state_district ?? a?.county ?? '';

const localityFromAddress = (a: NominatimAddress | undefined): string | undefined =>
  a?.suburb ?? a?.neighbourhood ?? a?.city_district ?? a?.quarter;

const buildLabels = (raw: NominatimRaw): { primary: string; secondary: string } => {
  const a = raw.address;
  const locality = localityFromAddress(a);
  const city = cityFromAddress(a);
  const state = a?.state ?? '';

  // Prefer locality as the primary if we have one; fall back to city.
  if (locality) {
    const tail = [city, state].filter(Boolean).join(', ');
    return { primary: locality, secondary: tail };
  }
  if (city) {
    return { primary: city, secondary: state };
  }
  // Last-ditch: use the first segment of display_name.
  const parts = raw.display_name.split(',').map(p => p.trim());
  return { primary: parts[0] ?? raw.display_name, secondary: parts.slice(1, 3).join(', ') };
};

const normalize = (raw: NominatimRaw): LocationSearchResult => {
  const { primary, secondary } = buildLabels(raw);
  const a = raw.address;
  return {
    id: String(raw.place_id),
    displayName: raw.display_name,
    primary,
    secondary,
    city: cityFromAddress(a),
    locality: localityFromAddress(a),
    state: a?.state,
    lat: Number(raw.lat),
    lng: Number(raw.lon),
    kind: raw.type,
  };
};

/**
 * Search for India locations. Pass an AbortSignal so debounced callers
 * can cancel in-flight requests on the next keystroke.
 */
export const searchIndianLocations = async (
  query: string,
  signal?: AbortSignal,
  limit = 8,
): Promise<LocationSearchResult[]> => {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    q,
    format: 'json',
    addressdetails: '1',
    countrycodes: 'in',
    limit: String(limit),
    'accept-language': 'en',
  });

  const url = `${NOMINATIM_BASE}/search?${params.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Location search failed (${res.status})`);
  }

  const raw = (await res.json()) as NominatimRaw[];
  // Drop entries whose address didn't yield a usable city (e.g. open ocean
  // hits) so the dropdown isn't full of unhelpful rows.
  return raw.map(normalize).filter(r => r.primary && r.city);
};
