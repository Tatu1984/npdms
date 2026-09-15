'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with webpack
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  type?: 'vehicle' | 'incident' | 'patrol' | 'evidence' | 'alert' | 'default';
  status?: string;
}

export interface MapProps {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  showControls?: boolean;
  onMarkerClick?: (marker: MapMarker) => void;
  className?: string;
  /**
   * A single location pin, e.g. an incident spot. With `onPinChange` the officer
   * sets it by clicking the map or dragging the pin; without it the pin is shown.
   */
  pin?: { lat: number; lng: number } | null;
  onPinChange?: (lat: number, lng: number) => void;
  pinTitle?: string;
}

const markerColors: Record<string, string> = {
  vehicle: '#3b82f6', // blue
  incident: '#ef4444', // red
  patrol: '#22c55e', // green
  evidence: '#f59e0b', // amber
  alert: '#dc2626', // red
  default: '#6b7280', // gray
};

// Drawn inline so the pin needs no image from another host.
const pinIcon = L.divIcon({
  className: 'location-pin',
  html: `<svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M15 1C7.3 1 1 7.2 1 14.9 1 25.3 15 41 15 41s14-15.7 14-26.1C29 7.2 22.7 1 15 1z" fill="#dc2626" stroke="#fff" stroke-width="2"/>
    <circle cx="15" cy="15" r="5" fill="#fff"/></svg>`,
  iconSize: [30, 42],
  iconAnchor: [15, 41],
  popupAnchor: [0, -38],
});

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export function InteractiveMap({
  markers = [],
  center = [22.5726, 88.3639], // Kolkata (lib/platform/wb.ts KOLKATA_CENTER)
  zoom = 12,
  height = '400px',
  showControls = true,
  onMarkerClick,
  className = '',
  pin,
  onPinChange,
  pinTitle,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const pinRef = useRef<L.Marker | null>(null);
  const onPinChangeRef = useRef(onPinChange);
  const [isClient, setIsClient] = useState(false);
  const [lat, lng] = center;

  useEffect(() => {
    onPinChangeRef.current = onPinChange;
  }, [onPinChange]);

  useEffect(() => {
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Create the map once; later centre and zoom changes move it (below) rather
  // than rebuilding it, so a new [lat, lng] array each render costs nothing.
  useEffect(() => {
    if (!isClient || !mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: zoom,
      zoomControl: showControls,
    });

    // OpenStreetMap tiles, loaded by the browser.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => onPinChangeRef.current?.(e.latlng.lat, e.latlng.lng));
    mapInstanceRef.current = map;
    // A map laid out while hidden (a dialog opening, a tab) draws grey tiles
    // until told its real size.
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(mapRef.current);

    return () => {
      resize.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      markerLayerRef.current = null;
      pinRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]);

  useEffect(() => {
    mapInstanceRef.current?.setView([lat, lng], zoom);
  }, [lat, lng, zoom]);

  // The location pin: draggable when the caller can change it.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isClient) return;
    if (!pin) {
      pinRef.current?.remove();
      pinRef.current = null;
      return;
    }
    if (!pinRef.current) {
      const marker = L.marker([pin.lat, pin.lng], { icon: pinIcon, draggable: Boolean(onPinChange), keyboard: false });
      marker.on('dragend', () => {
        const p = marker.getLatLng();
        onPinChangeRef.current?.(p.lat, p.lng);
      });
      pinRef.current = marker.addTo(map);
    } else {
      pinRef.current.setLatLng([pin.lat, pin.lng]);
    }
    if (pinTitle) pinRef.current.bindTooltip(escapeHtml(pinTitle));
  }, [pin, pinTitle, onPinChange, isClient]);

  // Update markers when they change
  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer || !isClient) return;

    layer.clearLayers();

    markers.forEach((marker) => {
      const color = markerColors[marker.type || 'default'];

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background-color: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });

      const leafletMarker = L.marker([marker.lat, marker.lng], { icon: customIcon }).addTo(layer);

      // Add popup
      const popupContent = `
        <div style="min-width: 150px;">
          <strong>${escapeHtml(marker.title)}</strong>
          ${marker.description ? `<br/><span style="color: #666; font-size: 12px;">${escapeHtml(marker.description)}</span>` : ''}
          ${marker.status ? `<br/><span style="color: ${color}; font-size: 11px; font-weight: 500;">${escapeHtml(marker.status)}</span>` : ''}
        </div>
      `;
      leafletMarker.bindPopup(popupContent);

      if (onMarkerClick) {
        leafletMarker.on('click', () => onMarkerClick(marker));
      }
    });
  }, [markers, isClient, onMarkerClick]);

  if (!isClient) {
    return (
      <div
        className={`bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-slate-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={`rounded-lg overflow-hidden ${className}`}
      style={{ height, width: '100%' }}
    />
  );
}

// Vehicle tracking specific component
export interface VehicleMapProps {
  vehicles: Array<{
    id: string;
    registrationNumber: string;
    type: string;
    status: string;
    gpsLocation?: { lat: number; lng: number } | null;
    driver?: string | null;
  }>;
  height?: string;
  onVehicleClick?: (vehicleId: string) => void;
}

export function VehicleTrackingMap({ vehicles, height = '400px', onVehicleClick }: VehicleMapProps) {
  const vehiclesWithLocation = vehicles.filter((v) => v.gpsLocation);

  const markers: MapMarker[] = vehiclesWithLocation.map((vehicle) => ({
    id: vehicle.id,
    lat: vehicle.gpsLocation!.lat,
    lng: vehicle.gpsLocation!.lng,
    title: vehicle.registrationNumber,
    description: `${vehicle.type} - ${vehicle.driver || 'No driver assigned'}`,
    type: 'vehicle' as const,
    status: vehicle.status,
  }));

  // Calculate center based on vehicle locations, default to central Kolkata (Lalbazar)
  let center: [number, number] = [22.5697, 88.3506];
  if (vehiclesWithLocation.length > 0) {
    const avgLat = vehiclesWithLocation.reduce((sum, v) => sum + v.gpsLocation!.lat, 0) / vehiclesWithLocation.length;
    const avgLng = vehiclesWithLocation.reduce((sum, v) => sum + v.gpsLocation!.lng, 0) / vehiclesWithLocation.length;
    center = [avgLat, avgLng];
  }

  return (
    <InteractiveMap
      markers={markers}
      center={center}
      zoom={13}
      height={height}
      onMarkerClick={(marker) => onVehicleClick?.(marker.id)}
    />
  );
}

// Incident/Crime map component
export interface IncidentMapProps {
  incidents: Array<{
    id: string;
    title: string;
    location: string;
    coords?: { lat: number; lng: number };
    type: string;
    status?: string;
  }>;
  height?: string;
  onIncidentClick?: (incidentId: string) => void;
}

export function IncidentMap({ incidents, height = '400px', onIncidentClick }: IncidentMapProps) {
  const markers: MapMarker[] = incidents
    .filter((i) => i.coords)
    .map((incident) => ({
      id: incident.id,
      lat: incident.coords!.lat,
      lng: incident.coords!.lng,
      title: incident.title,
      description: incident.location,
      type: 'incident' as const,
      status: incident.type,
    }));

  return (
    <InteractiveMap
      markers={markers}
      height={height}
      onMarkerClick={(marker) => onIncidentClick?.(marker.id)}
    />
  );
}

// Patrol tracking map
export interface PatrolMapProps {
  patrols: Array<{
    id: string;
    officer: string;
    beat: string;
    location: { lat: number; lng: number };
    status: string;
  }>;
  height?: string;
  onPatrolClick?: (patrolId: string) => void;
}

export function PatrolTrackingMap({ patrols, height = '400px', onPatrolClick }: PatrolMapProps) {
  const markers: MapMarker[] = patrols.map((patrol) => ({
    id: patrol.id,
    lat: patrol.location.lat,
    lng: patrol.location.lng,
    title: patrol.officer,
    description: `Beat: ${patrol.beat}`,
    type: 'patrol' as const,
    status: patrol.status,
  }));

  return (
    <InteractiveMap
      markers={markers}
      height={height}
      onMarkerClick={(marker) => onPatrolClick?.(marker.id)}
    />
  );
}

export default InteractiveMap;
