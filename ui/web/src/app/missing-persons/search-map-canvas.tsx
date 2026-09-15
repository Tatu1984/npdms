"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Leaflet drawing for the missing-person search map. Loaded only in the
 * browser (see search-map.tsx). Every point comes from a stored coordinate.
 */

export type MapPointKind = "LAST_SEEN" | "VERIFIED" | "UNVERIFIED" | "REJECTED" | "MATCH_CONFIRMED" | "MATCH_PENDING" | "CAMERA";

export interface CanvasPoint {
  key: string;
  kind: MapPointKind;
  lat: number;
  lng: number;
  title: string;
}

export interface CanvasPathStop {
  key: string;
  lat: number;
  lng: number;
}

const style: Record<MapPointKind, L.CircleMarkerOptions> = {
  LAST_SEEN: { radius: 10, color: "#ffffff", weight: 3, fillColor: "#dc2626", fillOpacity: 1 },
  VERIFIED: { radius: 8, color: "#ffffff", weight: 2, fillColor: "#16a34a", fillOpacity: 1 },
  UNVERIFIED: { radius: 8, color: "#d97706", weight: 3, dashArray: "3 3", fillColor: "#fef3c7", fillOpacity: 0.9 },
  REJECTED: { radius: 6, color: "#6b7280", weight: 2, fillColor: "#e5e7eb", fillOpacity: 0.8 },
  MATCH_CONFIRMED: { radius: 8, color: "#ffffff", weight: 2, fillColor: "#7c3aed", fillOpacity: 1 },
  MATCH_PENDING: { radius: 8, color: "#7c3aed", weight: 3, dashArray: "3 3", fillColor: "#ede9fe", fillOpacity: 0.9 },
  CAMERA: { radius: 4, color: "#1d4ed8", weight: 1, fillColor: "#3b82f6", fillOpacity: 0.7 },
};

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export default function SearchMapCanvas({
  points,
  path,
  selected,
  onSelect,
  height = "480px",
}: {
  points: CanvasPoint[];
  path: CanvasPathStop[];
  selected: string | null;
  onSelect: (key: string) => void;
  height?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { center: [22.5726, 88.3639], zoom: 12 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    // A new map (including React's development double mount) fits afresh.
    fitted.current = false;
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(el.current);
    return () => {
      resize.disconnect();
      m.remove();
      map.current = null;
      layer.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();

    if (path.length > 1) {
      L.polyline(
        path.map((p) => [p.lat, p.lng] as [number, number]),
        { color: "#15803d", weight: 4, opacity: 0.75 },
      ).addTo(g);
    }
    path.forEach((stop, i) => {
      L.marker([stop.lat, stop.lng], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "mp-path-stop",
          html: `<span style="display:flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:9999px;background:#14532d;color:#fff;font:600 10px/1 system-ui;transform:translate(10px,-18px)">${i + 1}</span>`,
          iconSize: [18, 18],
          iconAnchor: [0, 0],
        }),
      }).addTo(g);
    });

    // Cameras first so the report's own points sit on top.
    const ordered = [...points].sort((a, b) => (a.kind === "CAMERA" ? -1 : 0) - (b.kind === "CAMERA" ? -1 : 0));
    for (const p of ordered) {
      const isSelected = p.key === selected;
      const marker = L.circleMarker([p.lat, p.lng], {
        ...style[p.kind],
        ...(isSelected ? { weight: 5, color: "#0f172a" } : {}),
      }).addTo(g);
      marker.bindTooltip(escapeHtml(p.title), { direction: "top" });
      marker.on("click", () => onSelectRef.current(p.key));
      const node = marker.getElement();
      if (node) node.setAttribute("data-point", p.kind);
    }

    if (!fitted.current) {
      const own = points.filter((p) => p.kind !== "CAMERA");
      if (own.length > 0) {
        fitted.current = true;
        // The container may have been laid out after the map was created (a
        // tab, a dynamic import); measure it before fitting or the zoom is wrong.
        requestAnimationFrame(() => {
          if (map.current !== m) return;
          m.invalidateSize();
          if (own.length === 1) m.setView([own[0].lat, own[0].lng], 15);
          else m.fitBounds(L.latLngBounds(own.map((p) => [p.lat, p.lng] as [number, number])), { padding: [48, 48], maxZoom: 16 });
        });
      }
    }
  }, [points, path, selected]);

  return <div ref={el} style={{ height, width: "100%" }} className="rounded-md" data-testid="search-map" />;
}
