import { useEffect, useState } from "react";

declare global {
  interface Window {
    google?: any;
    __nuviaInitMap?: () => void;
  }
}

export type MapsStatus = "loading" | "ready" | "failed";

let loadPromise: Promise<void> | null = null;

function loadMapsScript(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("no window"));
    if (window.google?.maps) return resolve();

    const key = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
    const channel = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;
    if (!key) return reject(new Error("Missing Maps browser key"));

    window.__nuviaInitMap = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&libraries=places&callback=__nuviaInitMap${channel ? `&channel=${channel}` : ""}`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("Maps script failed to load"));
    document.head.appendChild(s);
  });
  return loadPromise;
}

export function useGoogleMaps(): MapsStatus {
  const [status, setStatus] = useState<MapsStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled && status === "loading") setStatus("failed");
    }, 9000);

    loadMapsScript()
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return status;
}
