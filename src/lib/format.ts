// Indian price formatting helpers (Lakh / Crore).

export function formatPriceShort(rupees: number): string {
  if (rupees >= 1e7) {
    const cr = rupees / 1e7;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (rupees >= 1e5) {
    const l = rupees / 1e5;
    return `₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)} L`;
  }
  return `₹${rupees.toLocaleString("en-IN")}`;
}

export function formatPriceRange(min: number, max: number): string {
  if (min === max) return formatPriceShort(min);
  // Compact: "₹2–3 Cr"
  if (min >= 1e7 && max >= 1e7) {
    const a = (min / 1e7).toFixed(min % 1e7 === 0 ? 0 : 1);
    const b = (max / 1e7).toFixed(max % 1e7 === 0 ? 0 : 1);
    return `₹${a}–${b} Cr`;
  }
  return `${formatPriceShort(min)} – ${formatPriceShort(max)}`;
}

export function formatPricePill(min: number, max: number): string {
  // Marker pill uses midpoint, very compact.
  const mid = (min + max) / 2;
  return formatPriceShort(mid);
}
