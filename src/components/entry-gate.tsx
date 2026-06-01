import { useState } from "react";
import { SEED_LOCALITIES } from "@/lib/seed-data";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export interface EntryPrefs {
  locality_name: string;
  lat: number;
  lng: number;
  budget_min: number;
  budget_max: number;
  bhk: number[];
}

interface Props {
  onSubmit: (prefs: EntryPrefs) => void;
}

const BHK_OPTIONS = [1, 2, 3, 4];
// budget in Crore for slider; multiply by 1e7 for rupees
const MIN_CR = 0.5;
const MAX_CR = 20;

export function EntryGate({ onSubmit }: Props) {
  const [localityName, setLocalityName] = useState<string>(SEED_LOCALITIES[0].name);
  const [range, setRange] = useState<[number, number]>([1.5, 4]);
  const [bhk, setBhk] = useState<number[]>([2, 3]);

  const submit = () => {
    const loc = SEED_LOCALITIES.find((l) => l.name === localityName) ?? SEED_LOCALITIES[0];
    onSubmit({
      locality_name: loc.name,
      lat: loc.lat,
      lng: loc.lng,
      budget_min: Math.round(range[0] * 1e7),
      budget_max: Math.round(range[1] * 1e7),
      bhk,
    });
  };

  const toggleBhk = (n: number) =>
    setBhk((b) => (b.includes(n) ? b.filter((x) => x !== n) : [...b, n].sort()));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <div className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground">
            Nuvia Estates
          </div>
          <h1 className="mt-3 font-display text-5xl sm:text-6xl leading-[1.05]">
            Find a home worth deciding on.
          </h1>
          <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto">
            A curated selection from India's most trusted builders — handpicked,
            scored, and ready to tour.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-7 shadow-sm">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Preferred locality
            </Label>
            <Select value={localityName} onValueChange={setLocalityName}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEED_LOCALITIES.map((l) => (
                  <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Budget
              </Label>
              <span className="font-display text-lg">
                ₹{range[0]}–{range[1]} Cr
              </span>
            </div>
            <Slider
              min={MIN_CR}
              max={MAX_CR}
              step={0.5}
              value={range}
              onValueChange={(v) => setRange([v[0], v[1]] as [number, number])}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Configuration
            </Label>
            <div className="flex gap-2">
              {BHK_OPTIONS.map((n) => {
                const on = bhk.includes(n);
                return (
                  <button
                    type="button"
                    key={n}
                    onClick={() => toggleBhk(n)}
                    className={`flex-1 h-11 rounded-md border text-sm transition
                      ${on ? "bg-foreground text-background border-foreground" : "bg-card border-border hover:border-foreground/40"}`}
                  >
                    {n} BHK
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={submit} size="lg" className="w-full h-12 text-base">
            Show me curated properties
          </Button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-6">
          Only A-category builders. Maximum 15 results. No spam.
        </p>
      </div>
    </div>
  );
}
