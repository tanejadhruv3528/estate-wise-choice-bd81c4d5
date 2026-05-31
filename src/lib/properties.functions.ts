import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  MAX_RESULTS,
  MIN_RESULTS,
  RADIUS_LADDER,
  WHITELISTED_BUILDERS,
} from "./config";
import { haversineKm, scoreProperty, type SortMode } from "./scoring";
import { SEED_LOCALITIES, SEED_PROPERTIES } from "./seed-data";

// ============ Types ============

export interface SearchResultItem {
  id: string;
  name: string;
  builder: string;
  locality_name: string;
  locality_score: number;
  lat: number;
  lng: number;
  price_min: number;
  price_max: number;
  bhk: number[];
  property_type: string;
  status: string;
  images: string[];
  highlights: string[];
  manual_priority: number;
  distance_km: number;
  score: number;
  budget_score: number;
  is_top_pick: boolean;
}

export interface SearchResponse {
  results: SearchResultItem[];
  used_radius_km: number;
  expanded: boolean;
  top_pick_id: string | null;
  total_filtered: number;
}

// ============ searchProperties ============

const searchInput = z.object({
  lat: z.number(),
  lng: z.number(),
  budget_min: z.number().nonnegative(),
  budget_max: z.number().positive(),
  bhk: z.array(z.number().int().min(1).max(10)).optional().default([]),
  property_type: z.string().optional().nullable(),
  builders: z.array(z.string()).optional().default([]),
  status: z.string().optional().nullable(),
  sort_mode: z.enum(["smart", "budget", "nearest", "locality"]).default("smart"),
});

export const searchProperties = createServerFn({ method: "POST" })
  .inputValidator((input) => searchInput.parse(input))
  .handler(async ({ data }): Promise<SearchResponse> => {
    // Fetch properties + locality info (joined). Public read.
    const { data: rows, error } = await supabaseAdmin
      .from("properties")
      .select(
        "id,name,builder,lat,lng,price_min,price_max,bhk,property_type,status,images,highlights,manual_priority,locality:localities(name,overall_score)",
      );
    if (error) throw new Error(error.message);
    if (!rows) return { results: [], used_radius_km: 0, expanded: false, top_pick_id: null, total_filtered: 0 };

    // Pre-filter (cheap predicates before scoring).
    const baseFiltered = rows.filter((r: any) => {
      // BHK overlap
      if (data.bhk.length > 0) {
        const overlap = (r.bhk as number[]).some((b) => data.bhk.includes(b));
        if (!overlap) return false;
      }
      if (data.property_type && r.property_type !== data.property_type) return false;
      if (data.status && r.status !== data.status) return false;
      if (data.builders.length > 0 && !data.builders.includes(r.builder)) return false;

      // Budget: at least some overlap with property band (lenient — soft penalty later)
      const mid = (r.price_min + r.price_max) / 2;
      const halfSpread = (data.budget_max - data.budget_min);
      // allow up to 50% outside the budget band to surface "almost" matches
      if (mid < data.budget_min - halfSpread * 0.5) return false;
      if (mid > data.budget_max + halfSpread * 0.5) return false;
      return true;
    });

    // Distance expansion ladder.
    let usedRadius = RADIUS_LADDER[0];
    let withinRadius: any[] = [];
    for (const r of RADIUS_LADDER) {
      usedRadius = r;
      withinRadius = baseFiltered
        .map((p: any) => ({
          ...p,
          _distance: haversineKm({ lat: data.lat, lng: data.lng }, { lat: p.lat, lng: p.lng }),
        }))
        .filter((p: any) => p._distance <= r);
      if (withinRadius.length >= MIN_RESULTS) break;
    }
    const expanded = usedRadius > RADIUS_LADDER[0];

    // Score and rank.
    const scored = withinRadius.map((p: any) => {
      const localityScore = p.locality?.overall_score ?? 0.7;
      const s = scoreProperty(
        {
          priceMin: p.price_min,
          priceMax: p.price_max,
          distanceKm: p._distance,
          localityScore,
          manualPriority: p.manual_priority,
        },
        { budgetMin: data.budget_min, budgetMax: data.budget_max, lat: data.lat, lng: data.lng },
        data.sort_mode as SortMode,
      );
      return { p, s, localityScore };
    });

    scored.sort((a, b) => b.s.total - a.s.total);
    const top = scored.slice(0, MAX_RESULTS);

    // Top pick = highest scoring under SMART weights regardless of current sort
    // — recompute smart score so the badge is stable across sort changes.
    let topPickId: string | null = null;
    if (top.length > 0) {
      const smartScored = top.map(({ p, localityScore }) => ({
        id: p.id,
        smart: scoreProperty(
          {
            priceMin: p.price_min,
            priceMax: p.price_max,
            distanceKm: p._distance,
            localityScore,
            manualPriority: p.manual_priority,
          },
          { budgetMin: data.budget_min, budgetMax: data.budget_max, lat: data.lat, lng: data.lng },
          "smart",
        ).total,
      }));
      smartScored.sort((a, b) => b.smart - a.smart);
      topPickId = smartScored[0].id;
    }

    const results: SearchResultItem[] = top.map(({ p, s, localityScore }) => ({
      id: p.id,
      name: p.name,
      builder: p.builder,
      locality_name: p.locality?.name ?? "Bangalore",
      locality_score: localityScore,
      lat: p.lat,
      lng: p.lng,
      price_min: p.price_min,
      price_max: p.price_max,
      bhk: p.bhk,
      property_type: p.property_type,
      status: p.status,
      images: p.images,
      highlights: p.highlights,
      manual_priority: p.manual_priority,
      distance_km: p._distance,
      score: s.total,
      budget_score: s.budget,
      is_top_pick: p.id === topPickId,
    }));

    return {
      results,
      used_radius_km: usedRadius,
      expanded,
      top_pick_id: topPickId,
      total_filtered: withinRadius.length,
    };
  });

// ============ ingestProperties (one-time admin seed) ============

export const ingestSeedProperties = createServerFn({ method: "POST" }).handler(
  async () => {
    // Idempotent: skip if already seeded.
    const { count } = await supabaseAdmin
      .from("properties")
      .select("*", { count: "exact", head: true });
    if ((count ?? 0) > 0) {
      return { inserted: 0, message: "Already seeded" };
    }

    // Insert localities.
    const { data: locRows, error: locErr } = await supabaseAdmin
      .from("localities")
      .insert(SEED_LOCALITIES.map((l) => ({
        name: l.name,
        lat: l.lat,
        lng: l.lng,
        overall_score: l.overall_score,
      })))
      .select("id,name");
    if (locErr) throw new Error(`Localities: ${locErr.message}`);
    const locById = new Map(locRows.map((r: any) => [r.name, r.id]));

    // Insert properties.
    const propsPayload = SEED_PROPERTIES
      .filter((p) => WHITELISTED_BUILDERS.includes(p.builder as any))
      .map((p) => ({
        name: p.name,
        builder: p.builder,
        locality_id: locById.get(p.locality_name) ?? null,
        lat: p.lat,
        lng: p.lng,
        price_min: p.price_min,
        price_max: p.price_max,
        bhk: p.bhk,
        property_type: p.property_type,
        status: p.status,
        images: p.images,
        highlights: p.highlights,
        manual_priority: p.manual_priority,
      }));
    const { error: propErr } = await supabaseAdmin
      .from("properties")
      .insert(propsPayload);
    if (propErr) throw new Error(`Properties: ${propErr.message}`);

    return { inserted: propsPayload.length, localities: locRows.length };
  },
);
