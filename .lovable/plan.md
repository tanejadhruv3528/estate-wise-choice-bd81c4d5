
# Nuvia Estates — Revised Plan (WhatsApp-first + Soft Lead Capture)

A premium, map-first real estate advisor. Single page, two states: entry gate → results (map + ≤15 curated cards). Booking is **WhatsApp-first**; lead capture is non-blocking; the highest-scoring property is surfaced as a "Top Pick for You".

## Stack (unchanged)

- TanStack Start (React 19 + Vite) — already scaffolded
- Lovable Cloud (Postgres) — backend, seeded data
- Google Maps connector (managed key) — map + Places autocomplete + geocoding
- Tailwind v4 + shadcn/ui
- ~40 hand-authored Bangalore properties across the 9 whitelisted A-category builders
- WhatsApp click-to-chat (`wa.me`) — no Twilio

## Single Page, Two States

**Route:** `src/routes/index.tsx` (replaces placeholder). Local state machine: `entry` → `results`.

**State 1 — Entry gate** (centered card): location (geolocation / Places autocomplete / pasted Maps link), budget slider, BHK chips, property type, CTA "Show Homes".

**State 2 — Results**:
- Desktop: list (left, ≤15) + map (right). Mobile: full map + bottom sheet.
- Sticky filter bar: Budget, Location, BHK, Type, Builder, Status.
- Sort: Smart (default) / Budget First / Nearest First / Best Locality.
- Per-card content (see additions below).

## Behavior changes from the user's iteration

### 1. WhatsApp-first booking
- **Book Virtual Tour** = immediate `window.open(wa.me/<number>?text=<msg>)` with prefilled:
  `"Hi, I'm interested in {name} in {locality}. My budget is ₹{budget}. I'd like to book a virtual tour."`
- In parallel, fire-and-forget (no UI block):
  - `trackEvent("whatsapp_click", { propertyId })`
  - `recordBookingIntent({ propertyId, budget, locality })` → inserts a row in `bookings` with `status='intent'`
- **Optional fallback form** stays inside the property detail panel (collapsed under "Prefer we call you?") — submits to the same `bookTour` server fn with `status='requested'`.
- The destination WhatsApp number lives in a single config constant (`src/lib/config.ts`) for easy editing.

### 2. Soft lead capture (non-blocking)
- `src/components/lead-capture-modal.tsx` — shadcn Dialog, dismissible, no backdrop blocker on first browse.
- Triggers (any one):
  - `propertyClickCount >= 2`
  - `timeOnResults >= 30s` (single `setTimeout`, cleared on unmount)
  - Right before any WhatsApp click (shown once, not blocking — modal opens, WhatsApp opens too)
- Fields: Name, Phone (validated E.164-ish via Zod). On submit → `upsertUser` server fn → store in `users` → close.
- Persistence: once captured (or dismissed) in this session, never reshown — flagged in `sessionStorage` (`nuvia_lead = captured | dismissed`).

### 3. "Top Pick for You" highlight
- Scoring already returns sorted top-15 with numeric scores. The single highest-scoring property gets `isTopPick = true` (server-side).
- Card treatment: gold hairline border + small "Top Pick for You" pill (gold text on near-black, or vice versa). Always pinned at position 0 of the list even if user resorts (with a subtle "(Top Pick)" tag); other items follow the chosen sort. Map marker for it uses a filled gold pill instead of outline.

### 4. "Why this matches you" line (per card)
- Pure helper `src/lib/match-reason.ts` takes `{ budgetMatch, distanceKm, localityScore, prefs }` and emits ONE line, e.g.:
  - `"Matches your ₹2–3 Cr budget and ${locality} preference"`
  - `"Closest to you (2.1 km) with strong locality rating"`
  - Falls back to `"Strong overall fit for your preferences"`.
- Rendered in muted-foreground, 12–13px, one line truncated.

### 5. Subtle urgency badges
- Pure helper `src/lib/urgency-badge.ts`. At most ONE badge per card, picked deterministically:
  - `locality.overall_score ≥ 0.85` → "High demand area"
  - `manual_priority ≥ 0.8` → "Limited inventory"
  - `locality.overall_score 0.7–0.85` → "Price appreciation zone"
- Outline badge style, tiny, no color flooding.

### 6. Premium price-pill markers
- `src/components/property-map.tsx` uses `google.maps.OverlayView` to render custom HTML markers (not `Marker`/`AdvancedMarker`). Each pill: rounded-full, paper bg, hairline border, "₹2.3 Cr" text. Top Pick pill is filled gold.
- Active state: scale 1.08, raised z-index, 150ms ease. Hover on desktop mirrors active. Click syncs with list selection.
- Smooth pan to marker on card hover via `map.panTo()` (debounced 120ms).

### 7. Intent tracking + intent_score
- `src/hooks/use-intent-tracker.ts` increments local counters and batches `trackEvent` calls (debounced 1s):
  - `property_click`, `filter_change`, `whatsapp_click`, plus a single `results_time_spent` heartbeat every 15s.
- Server-side `computeIntentScore({ userId | sessionId })` derives:
  - clicks 1–2 → `low`, 3–5 → `medium`, any `whatsapp_click` → `high`.
- Stored as `events.metadata.intent_score` snapshot whenever WhatsApp is clicked or lead capture submits (no separate column → schema unchanged).

### 8. Search expansion feedback
- `searchProperties` already auto-widens radius (3 → 5 → 7 → 10 km) until ≥5 results. The response now also returns `{ usedRadiusKm, expanded: boolean }`.
- When `expanded`, a thin info strip renders above the list: *"No exact matches. Showing best options within {usedRadiusKm} km."* Dismissible per session.

### 9. Builder trust signal
- Builder name shown prominently on each card under property name.
- Static "Top Builder" badge rendered on every card (every property is from the whitelist by construction).

### 10. Map fallback mode
- `src/hooks/use-google-maps.ts` resolves to one of: `ready | loading | failed`.
- `failed` triggers after: script load error, 8s load timeout, or runtime error in `initMap`.
- Results view watches the status; when `failed`, hides the map column, expands list to full width, and shows a one-line notice: *"Map unavailable. Showing properties in list view."* App never throws.

## Scoring (unchanged structure)

`src/lib/scoring.ts`. Smart 40/30/20/10, Budget 70/15/–/15, Nearest 20/70/–/10, Locality 30/20/50/–. Haversine for distance. Returns top 15 + `isTopPick` flag on highest scorer + `usedRadiusKm` + `expanded`.

## Database (Lovable Cloud / Postgres) — unchanged schema

5 tables: `localities`, `properties`, `users`, `bookings`, `events`. RLS + GRANTs per public-schema rules. `bookings.status` accepts `intent | requested | confirmed | cancelled` (already part of the original schema — no migration change). Builder whitelist enforced via CHECK constraint on normalized name.

## Server Functions

- `searchProperties(prefs, sortMode)` → returns `{ results, usedRadiusKm, expanded, topPickId }`
- `recordBookingIntent({ propertyId, budget, locality, sessionId })` → inserts `bookings` row with `status='intent'`, never blocks
- `bookTour({ name, phone, propertyId, preferredTime })` → optional fallback path, `status='requested'`
- `upsertUser({ name, phone })` → soft lead capture target; idempotent on phone
- `trackEvent({ sessionId, eventType, propertyId?, metadata? })` → batched inserts
- `ingestProperties(jsonPayload)` → one-time seed, admin

All public-read fns run via `supabaseAdmin` (no auth required — anonymous browsing).

## Design (premium minimal)

- Palette in `src/styles.css` using oklch: near-black bg `oklch(0.18 0 0)`, paper `oklch(0.99 0.005 80)`, muted slate, accent **subtle gold** `oklch(0.78 0.12 80)`.
- Type: **Instrument Serif** display + **Inter** UI.
- Hairline borders, no heavy shadows, 8px radius, micro-transitions only (150ms ease).
- All colors via semantic tokens — no hardcoded hex in components.

## Files (additions to original plan)

```
src/components/lead-capture-modal.tsx           (new)
src/hooks/use-intent-tracker.ts                 (new)
src/hooks/use-google-maps.ts                    (status: ready|loading|failed)
src/lib/match-reason.ts                         (new)
src/lib/urgency-badge.ts                        (new)
src/lib/config.ts                               (WhatsApp number, weights)
src/components/property-map.tsx                 (OverlayView price pills)
src/components/property-card.tsx                (top-pick, match line, urgency, top-builder)
src/components/property-detail.tsx              (WhatsApp-first CTA + fallback form)
src/lib/bookings.functions.ts                   (recordBookingIntent + bookTour + upsertUser)
src/lib/properties.functions.ts                 (searchProperties returns topPickId/usedRadiusKm)
```

## Implementation order

1. Link Google Maps connector
2. Migration: 5 tables + GRANTs + RLS + CHECK constraint
3. Seed data + generated property images
4. Server fns (search, intent, book, upsertUser, trackEvent, ingest) + run ingest once
5. Tokens + fonts + base layout
6. Entry gate
7. Results view skeleton (list + map split, mobile sheet)
8. Custom OverlayView price-pill markers + map fallback
9. Property card with Top Pick / Why-this-matches / urgency / Top Builder
10. WhatsApp-first detail panel + fallback form
11. Intent tracker hook + soft lead capture modal triggers
12. Search expansion notice
13. Verify: invoke `searchProperties`, simulate WhatsApp click path, confirm fallback when maps script blocked

## Out of scope (unchanged)

- User auth — anonymous browsing
- Listing-heavy pagination (hard cap 15)
- Scraping homelocator.in (curated seed)
- SMS/email — WhatsApp click-to-chat only
- Admin dashboard
