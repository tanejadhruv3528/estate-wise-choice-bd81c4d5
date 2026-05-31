// Centralized config for Nuvia Estates.

// WhatsApp number for booking. E.164 without "+" (wa.me format).
export const WHATSAPP_NUMBER = "919876543210"; // TODO: replace with real advisor number

// The 9 whitelisted A-category builders (display names).
export const WHITELISTED_BUILDERS = [
  "Prestige",
  "Sobha",
  "Brigade",
  "Godrej",
  "Embassy",
  "Birla",
  "Mahindra Lifespaces",
  "Puravankara",
  "Total Environment",
] as const;

export type Builder = (typeof WHITELISTED_BUILDERS)[number];

// Max properties ever returned by search.
export const MAX_RESULTS = 15;

// Radius expansion sequence (km) until at least MIN_RESULTS results are found.
export const RADIUS_LADDER = [3, 5, 7, 10];
export const MIN_RESULTS = 5;
