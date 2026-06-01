import type { SearchResultItem } from "@/lib/properties.functions";
import { formatPriceRange } from "@/lib/format";
import { buildMatchReason } from "@/lib/match-reason";
import { pickUrgencyBadge, urgencyBadgeLabel } from "@/lib/urgency-badge";

interface Props {
  property: SearchResultItem;
  active: boolean;
  onClick: () => void;
  prefs: { budget_min: number; budget_max: number };
}

export function PropertyCard({ property: p, active, onClick, prefs }: Props) {
  const reason = buildMatchReason({
    budgetScore: p.budget_score,
    distanceKm: p.distance_km,
    localityScore: p.locality_score,
    localityName: p.locality_name,
    prefBudgetMin: prefs.budget_min,
    prefBudgetMax: prefs.budget_max,
  });
  const urgency = urgencyBadgeLabel(pickUrgencyBadge(p.locality_score, p.manual_priority));

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full text-left rounded-xl border bg-card overflow-hidden transition-all
        ${active ? "border-foreground shadow-md" : "border-border hover:border-foreground/40"}
        ${p.is_top_pick ? "ring-1 ring-gold/60" : ""}`}
    >
      <div className="relative">
        <img
          src={p.images[0]}
          alt={p.name}
          loading="lazy"
          className="h-44 w-full object-cover"
        />
        {p.is_top_pick && (
          <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-medium text-gold-foreground shadow-sm">
            Top Pick for You
          </span>
        )}
        <span className="absolute right-3 top-3 inline-flex items-center rounded-full border border-border bg-card/90 px-2 py-0.5 text-[10px] font-medium text-foreground/80 backdrop-blur">
          Top Builder
        </span>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-display text-xl leading-tight truncate">{p.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {p.builder} · {p.locality_name}
            </div>
          </div>
          <div className="font-display text-lg whitespace-nowrap">
            {formatPriceRange(p.price_min, p.price_max)}
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-1">{reason}</p>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
            {p.bhk.join(", ")} BHK
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground capitalize">
            {p.status.replace("-", " ")}
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
            {p.distance_km.toFixed(1)} km
          </span>
          {urgency && (
            <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] text-foreground">
              {urgency}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
