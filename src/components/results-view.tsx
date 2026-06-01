import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { searchProperties, type SearchResultItem } from "@/lib/properties.functions";
import { useGoogleMaps } from "@/hooks/use-google-maps";
import { useIntentTracker } from "@/hooks/use-intent-tracker";
import { PropertyMap } from "@/components/property-map";
import { PropertyCard } from "@/components/property-card";
import { PropertyDetail } from "@/components/property-detail";
import { LeadCaptureModal } from "@/components/lead-capture-modal";
import type { EntryPrefs } from "@/components/entry-gate";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Props {
  prefs: EntryPrefs;
  onReset: () => void;
}

type SortMode = "smart" | "budget" | "nearest" | "locality";

export function ResultsView({ prefs, onReset }: Props) {
  const mapStatus = useGoogleMaps();
  const tracker = useIntentTracker();
  const search = useServerFn(searchProperties);

  const [sortMode, setSortMode] = useState<SortMode>("smart");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"map" | "list">("list");

  const { data, isLoading } = useQuery({
    queryKey: ["search", prefs, sortMode],
    queryFn: () =>
      search({
        data: {
          lat: prefs.lat,
          lng: prefs.lng,
          budget_min: prefs.budget_min,
          budget_max: prefs.budget_max,
          bhk: prefs.bhk,
          sort_mode: sortMode,
        },
      }),
  });

  // Sort: Top Pick always first
  const results: SearchResultItem[] = useMemo(() => {
    const r = data?.results ?? [];
    return [...r].sort((a, b) => {
      if (a.is_top_pick && !b.is_top_pick) return -1;
      if (!a.is_top_pick && b.is_top_pick) return 1;
      return b.score - a.score;
    });
  }, [data]);

  const active = results.find((p) => p.id === activeId) ?? null;

  // Soft lead capture: trigger on 2+ clicks or 30s
  useEffect(() => {
    if (sessionStorage.getItem("nuvia_lead")) return;
    if (tracker.propertyClicks >= 2) setLeadOpen(true);
  }, [tracker.propertyClicks]);

  useEffect(() => {
    if (sessionStorage.getItem("nuvia_lead")) return;
    const t = setTimeout(() => {
      if (!sessionStorage.getItem("nuvia_lead")) setLeadOpen(true);
    }, 30000);
    return () => clearTimeout(t);
  }, []);

  const handleSelect = (id: string) => {
    setActiveId(id);
    tracker.trackPropertyClick(id);
    setDetailOpen(true);
  };

  const onWhatsAppClick = (id: string) => {
    tracker.trackWhatsAppClick(id, { locality: prefs.locality_name });
    if (!sessionStorage.getItem("nuvia_lead")) setLeadOpen(true);
  };

  const onSortChange = (v: string) => {
    setSortMode(v as SortMode);
    tracker.trackFilterChange("sort_mode", v);
  };

  const mapBroken = mapStatus === "failed";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center gap-4">
          <button
            type="button"
            onClick={onReset}
            className="font-display text-xl tracking-tight hover:opacity-70 transition"
          >
            Nuvia<span className="text-gold">.</span>
          </button>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <span>{prefs.locality_name}</span>
            <span>·</span>
            <span>₹{(prefs.budget_min / 1e7).toFixed(1)}–{(prefs.budget_max / 1e7).toFixed(1)} Cr</span>
            <span>·</span>
            <span>{prefs.bhk.join(", ")} BHK</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Select value={sortMode} onValueChange={onSortChange}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smart">Smart match</SelectItem>
                <SelectItem value="budget">Best for budget</SelectItem>
                <SelectItem value="nearest">Nearest</SelectItem>
                <SelectItem value="locality">Top localities</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={onReset} className="hidden sm:inline-flex">
              Edit
            </Button>
          </div>
        </div>

        {/* Mobile map/list toggle */}
        {!mapBroken && (
          <div className="md:hidden border-t border-border px-4 py-2 flex gap-2">
            <button
              onClick={() => setMobileView("list")}
              className={`flex-1 h-8 rounded-md text-xs ${mobileView === "list" ? "bg-foreground text-background" : "bg-secondary"}`}
            >List</button>
            <button
              onClick={() => setMobileView("map")}
              className={`flex-1 h-8 rounded-md text-xs ${mobileView === "map" ? "bg-foreground text-background" : "bg-secondary"}`}
            >Map</button>
          </div>
        )}
      </header>

      {/* Expansion + map-failure notices */}
      {(data?.expanded || mapBroken) && (
        <div className="border-b border-border bg-secondary/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2 text-xs text-muted-foreground">
            {mapBroken && (
              <span>Map unavailable — showing properties in list view.</span>
            )}
            {data?.expanded && (
              <span>
                {mapBroken ? " · " : ""}
                Expanded search to {data.used_radius_km} km radius to surface more results.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main split */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
        <div className={`grid gap-6 ${mapBroken ? "grid-cols-1" : "md:grid-cols-[1fr_1.1fr]"}`}>
          {/* List */}
          <section className={`${mobileView === "map" && !mapBroken ? "hidden md:block" : ""} space-y-3`}>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-xl bg-secondary/60 animate-pulse" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-10 text-center">
                <p className="font-display text-2xl">No matches just yet.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try widening your budget or picking a nearby locality.
                </p>
                <Button onClick={onReset} className="mt-5">Refine preferences</Button>
              </div>
            ) : (
              <>
                <div className="text-xs text-muted-foreground">
                  {results.length} curated {results.length === 1 ? "match" : "matches"}
                </div>
                {results.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    active={p.id === activeId}
                    onClick={() => handleSelect(p.id)}
                    prefs={prefs}
                  />
                ))}
              </>
            )}
          </section>

          {/* Map */}
          {!mapBroken && (
            <section className={`${mobileView === "list" ? "hidden md:block" : ""} md:sticky md:top-[72px] md:self-start`}>
              <div className="h-[70vh] md:h-[calc(100vh-7rem)] rounded-xl overflow-hidden border border-border bg-secondary/40 relative">
                {mapStatus === "loading" && (
                  <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
                    Loading map…
                  </div>
                )}
                <PropertyMap
                  status={mapStatus}
                  center={{ lat: prefs.lat, lng: prefs.lng }}
                  properties={results}
                  activeId={activeId}
                  onSelect={handleSelect}
                />
              </div>
            </section>
          )}
        </div>
      </main>

      <PropertyDetail
        property={active}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        prefs={{ budget_min: prefs.budget_min, budget_max: prefs.budget_max }}
        sessionId={tracker.sessionId}
        onWhatsAppClick={onWhatsAppClick}
      />
      <LeadCaptureModal open={leadOpen} onClose={() => setLeadOpen(false)} />
    </div>
  );
}
