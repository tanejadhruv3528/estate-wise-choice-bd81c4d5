import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { EntryGate, type EntryPrefs } from "@/components/entry-gate";
import { ResultsView } from "@/components/results-view";
import { ingestSeedProperties } from "@/lib/properties.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nuvia Estates — Decide on a home, instantly" },
      {
        name: "description",
        content:
          "A curated, map-first real estate advisor featuring India's top A-category builders. Find the right home, book a tour on WhatsApp.",
      },
      { property: "og:title", content: "Nuvia Estates" },
      {
        property: "og:description",
        content: "Curated homes from top builders. Decide faster, book on WhatsApp.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [prefs, setPrefs] = useState<EntryPrefs | null>(null);
  const ingest = useServerFn(ingestSeedProperties);

  // One-time idempotent seed on first mount.
  useEffect(() => {
    if (sessionStorage.getItem("nuvia_seeded")) return;
    ingest()
      .then(() => sessionStorage.setItem("nuvia_seeded", "1"))
      .catch((e: any) => console.warn("seed:", e?.message));
  }, [ingest]);

  if (!prefs) return <EntryGate onSubmit={setPrefs} />;
  return <ResultsView prefs={prefs} onReset={() => setPrefs(null)} />;
}
