// Best-effort parse of pasted Google Maps URLs to extract lat/lng.

export function parseMapsLink(input: string): { lat: number; lng: number } | null {
  const s = input.trim();
  // Pattern: @lat,lng (most common)
  const at = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[2]) };

  // Pattern: !3dlat!4dlng (place URLs)
  const place = s.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (place) return { lat: parseFloat(place[1]), lng: parseFloat(place[2]) };

  // Pattern: q=lat,lng or query=lat,lng
  const q = s.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (q) return { lat: parseFloat(q[1]), lng: parseFloat(q[2]) };

  // Pattern: bare "lat,lng"
  const bare = s.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (bare) return { lat: parseFloat(bare[1]), lng: parseFloat(bare[2]) };

  return null;
}
