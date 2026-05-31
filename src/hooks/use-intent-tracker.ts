import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { trackEvent } from "@/lib/bookings.functions";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const KEY = "nuvia_sid";
  let sid = sessionStorage.getItem(KEY);
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(KEY, sid);
  }
  return sid;
}

export type IntentLevel = "low" | "medium" | "high";

export function intentLevelFor(
  propertyClicks: number,
  hasWhatsAppClick: boolean,
): IntentLevel {
  if (hasWhatsAppClick) return "high";
  if (propertyClicks >= 3) return "medium";
  return "low";
}

export function useIntentTracker() {
  const sessionId = getSessionId();
  const fire = useServerFn(trackEvent);
  const counts = useRef({
    property_click: 0,
    filter_change: 0,
    whatsapp_click: 0,
  });
  const startedAt = useRef<number>(Date.now());
  const [propertyClicks, setPropertyClicks] = useState(0);
  const [hasWhatsAppClick, setHasWhatsApp] = useState(false);

  // Fire-and-forget event push.
  const send = (
    event_type: string,
    propertyId?: string | null,
    metadata?: Record<string, any>,
  ) => {
    fire({
      data: {
        session_id: sessionId,
        event_type,
        property_id: propertyId ?? null,
        metadata: metadata ?? {},
      },
    }).catch(() => {});
  };

  // Heartbeat for time-on-results.
  useEffect(() => {
    const t = setInterval(() => {
      const seconds = Math.round((Date.now() - startedAt.current) / 1000);
      send("results_time_spent", null, { seconds });
    }, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    sessionId,
    propertyClicks,
    hasWhatsAppClick,
    timeOnResultsMs: () => Date.now() - startedAt.current,
    trackPropertyClick(propertyId: string) {
      counts.current.property_click += 1;
      setPropertyClicks(counts.current.property_click);
      send("property_click", propertyId);
    },
    trackFilterChange(field: string, value: any) {
      counts.current.filter_change += 1;
      send("filter_change", null, { field, value });
    },
    trackWhatsAppClick(propertyId: string, meta?: Record<string, any>) {
      counts.current.whatsapp_click += 1;
      setHasWhatsApp(true);
      const intent_score = intentLevelFor(counts.current.property_click, true);
      send("whatsapp_click", propertyId, { ...meta, intent_score });
    },
    intentLevel(): IntentLevel {
      return intentLevelFor(counts.current.property_click, counts.current.whatsapp_click > 0);
    },
  };
}
