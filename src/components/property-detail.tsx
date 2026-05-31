import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import type { SearchResultItem } from "@/lib/properties.functions";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { formatPriceRange } from "@/lib/format";
import { buildMatchReason } from "@/lib/match-reason";
import { pickUrgencyBadge, urgencyBadgeLabel } from "@/lib/urgency-badge";
import { recordBookingIntent, bookTour, upsertLeadUser } from "@/lib/bookings.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

interface Props {
  property: SearchResultItem | null;
  open: boolean;
  onClose: () => void;
  prefs: { budget_min: number; budget_max: number };
  sessionId: string;
  onWhatsAppClick: (propertyId: string) => void;
}

function buildWhatsAppUrl(p: SearchResultItem, budget: string) {
  const msg = `Hi, I'm interested in ${p.name} in ${p.locality_name}. My budget is ${budget}. I'd like to book a virtual tour.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

export function PropertyDetail({ property, open, onClose, prefs, sessionId, onWhatsAppClick }: Props) {
  const intent = useServerFn(recordBookingIntent);
  const book = useServerFn(bookTour);
  const upsert = useServerFn(upsertLeadUser);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!property) return null;
  const p = property;
  const reason = buildMatchReason({
    budgetScore: p.budget_score,
    distanceKm: p.distance_km,
    localityScore: p.locality_score,
    localityName: p.locality_name,
    prefBudgetMin: prefs.budget_min,
    prefBudgetMax: prefs.budget_max,
  });
  const urgency = urgencyBadgeLabel(pickUrgencyBadge(p.locality_score, p.manual_priority));
  const priceText = formatPriceRange(p.price_min, p.price_max);

  const onWhatsApp = () => {
    onWhatsAppClick(p.id);
    intent({ data: {
      property_id: p.id, session_id: sessionId,
      budget_min: prefs.budget_min, budget_max: prefs.budget_max, locality: p.locality_name,
    }}).catch(() => {});
    window.open(buildWhatsAppUrl(p, priceText), "_blank", "noopener,noreferrer");
  };

  const onSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await book({ data: { name, phone, property_id: p.id, preferred_time: time, session_id: sessionId } });
      await upsert({ data: { name, phone } }).catch(() => {});
      toast.success("Request received. Our advisor will reach out shortly.");
      setShowForm(false);
      setName(""); setPhone(""); setTime("");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-3xl">{p.name}</SheetTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{p.builder}</span>
            <span>·</span>
            <span>{p.locality_name}</span>
            <span className="ml-auto inline-flex items-center rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-foreground">
              Top Builder
            </span>
          </div>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {p.images.slice(0, 4).map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${p.name} ${i + 1}`}
              loading="lazy"
              className={`h-32 w-full rounded-md object-cover ${i === 0 ? "col-span-2 h-48" : ""}`}
            />
          ))}
        </div>

        <div className="mt-5 space-y-1">
          <div className="text-2xl font-display">{priceText}</div>
          <div className="text-sm text-muted-foreground">{reason}</div>
          {urgency && (
            <div className="mt-1 inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              {urgency}
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div><div className="text-muted-foreground text-xs">Configuration</div><div>{p.bhk.join(", ")} BHK</div></div>
          <div><div className="text-muted-foreground text-xs">Type</div><div>{p.property_type}</div></div>
          <div><div className="text-muted-foreground text-xs">Status</div><div className="capitalize">{p.status.replace("-", " ")}</div></div>
          <div><div className="text-muted-foreground text-xs">Distance</div><div>{p.distance_km.toFixed(1)} km</div></div>
        </div>

        {p.highlights.length > 0 && (
          <div className="mt-5">
            <div className="text-xs text-muted-foreground mb-1">Highlights</div>
            <ul className="text-sm space-y-1">
              {p.highlights.map((h) => (
                <li key={h} className="flex gap-2"><span className="text-gold">·</span>{h}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Button size="lg" onClick={onWhatsApp} className="w-full">
            Book Virtual Tour on WhatsApp
          </Button>
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              Prefer we call you instead?
            </button>
          ) : (
            <form onSubmit={onSubmitForm} className="mt-2 space-y-3 rounded-md border border-border p-4">
              <div className="grid gap-2">
                <Label htmlFor="d-name">Name</Label>
                <Input id="d-name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="d-phone">Phone</Label>
                <Input id="d-phone" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="d-time">Preferred time</Label>
                <Input id="d-time" required placeholder="e.g. Sat 11 AM" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <Button type="submit" disabled={submitting} className="w-full" variant="secondary">
                {submitting ? "Submitting…" : "Request callback"}
              </Button>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
