// Pure scoring helpers. Keep this file free of server-only imports so it
// can be reused on either side of the RPC boundary.

export type SortMode = "smart" | "budget" | "nearest" | "locality";

export interface ScoringInput {
  priceMin: number;
  priceMax: number;
  distanceKm: number;
  localityScore: number; // 0..1
  manualPriority: number; // 0..1
}

export interface UserPrefs {
  budgetMin: number;
  budgetMax: number;
  lat: number;
  lng: number;
}

const WEIGHTS: Record<
  SortMode,
  { budget: number; distance: number; locality: number; priority: number }
> = {
  smart: { budget: 0.4, distance: 0.3, locality: 0.2, priority: 0.1 },
  budget: { budget: 0.7, distance: 0.15, locality: 0, priority: 0.15 },
  nearest: { budget: 0.2, distance: 0.7, locality: 0, priority: 0.1 },
  locality: { budget: 0.3, distance: 0.2, locality: 0.5, priority: 0 },
};

const MAX_DISTANCE_KM = 12; // beyond this distanceScore is 0

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Budget overlap → 0..1
export function budgetScore(
  priceMin: number,
  priceMax: number,
  prefMin: number,
  prefMax: number,
): number {
  const propMid = (priceMin + priceMax) / 2;
  if (propMid >= prefMin && propMid <= prefMax) return 1;
  // Soft penalty proportional to how far outside the band the midpoint is.
  const spread = Math.max(prefMax - prefMin, 1);
  const offset =
    propMid < prefMin ? prefMin - propMid : propMid - prefMax;
  return Math.max(0, 1 - offset / spread);
}

export function distanceScore(distanceKm: number): number {
  if (distanceKm <= 0) return 1;
  if (distanceKm >= MAX_DISTANCE_KM) return 0;
  return 1 - distanceKm / MAX_DISTANCE_KM;
}

export function scoreProperty(
  input: ScoringInput,
  prefs: UserPrefs,
  mode: SortMode,
): { total: number; budget: number; distance: number; locality: number; priority: number } {
  const w = WEIGHTS[mode];
  const b = budgetScore(input.priceMin, input.priceMax, prefs.budgetMin, prefs.budgetMax);
  const d = distanceScore(input.distanceKm);
  const l = input.localityScore;
  const p = input.manualPriority;
  const total = w.budget * b + w.distance * d + w.locality * l + w.priority * p;
  return { total, budget: b, distance: d, locality: l, priority: p };
}
