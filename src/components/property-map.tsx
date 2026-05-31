import { useEffect, useRef } from "react";
import type { MapsStatus } from "@/hooks/use-google-maps";
import type { SearchResultItem } from "@/lib/properties.functions";
import { formatPricePill } from "@/lib/format";

interface Props {
  status: MapsStatus;
  center: { lat: number; lng: number };
  properties: SearchResultItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function PropertyMap({ status, center, properties, activeId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);

  // Init map once ready
  useEffect(() => {
    if (status !== "ready" || !containerRef.current || mapRef.current) return;
    const g = (window as any).google;
    mapRef.current = new g.maps.Map(containerRef.current, {
      center,
      zoom: 12,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
    });
  }, [status, center]);

  // Render markers
  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;
    const g = (window as any).google;
    // Clear old
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    class PriceOverlay extends g.maps.OverlayView {
      private div: HTMLDivElement | null = null;
      constructor(
        private position: any,
        private label: string,
        private isActive: boolean,
        private isTopPick: boolean,
        private onClick: () => void,
      ) {
        super();
      }
      onAdd() {
        const d = document.createElement("div");
        d.className = `nuvia-marker${this.isActive ? " nuvia-marker--active" : ""}${this.isTopPick ? " nuvia-marker--top-pick" : ""}`;
        d.textContent = this.label;
        d.addEventListener("click", this.onClick);
        this.div = d;
        this.getPanes().floatPane.appendChild(d);
      }
      draw() {
        if (!this.div) return;
        const proj = this.getProjection();
        const p = proj.fromLatLngToDivPixel(this.position);
        this.div.style.left = `${p.x}px`;
        this.div.style.top = `${p.y - 6}px`;
      }
      onRemove() {
        if (this.div?.parentNode) this.div.parentNode.removeChild(this.div);
        this.div = null;
      }
    }

    properties.forEach((p) => {
      const ov = new PriceOverlay(
        new g.maps.LatLng(p.lat, p.lng),
        formatPricePill(p.price_min, p.price_max),
        p.id === activeId,
        p.is_top_pick,
        () => onSelect(p.id),
      );
      ov.setMap(mapRef.current);
      overlaysRef.current.push(ov);
    });

    // Pan to active.
    if (activeId) {
      const active = properties.find((p) => p.id === activeId);
      if (active) mapRef.current.panTo({ lat: active.lat, lng: active.lng });
    }
  }, [status, properties, activeId, onSelect]);

  return <div ref={containerRef} className="h-full w-full" />;
}
