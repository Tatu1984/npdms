"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js
const createIcon = (color: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const patrolIcon = createIcon("#22c55e"); // green
const respondingIcon = createIcon("#eab308"); // yellow
const incidentIcon = createIcon("#ef4444"); // red
const stationIcon = createIcon("#3b82f6"); // blue

interface Patrol {
  id: string;
  vehicle: string;
  officers: string[];
  beat: string;
  status: string;
  lastUpdate: string;
  location: { lat: number; lng: number };
  respondingTo?: string;
}

interface Incident {
  id: string;
  type: string;
  location: string;
  time: string;
  status: string;
  priority: string;
  coords: { lat: number; lng: number };
}

interface Beat {
  id: string;
  name: string;
  area: string;
  patrolCount: number;
  bounds?: [number, number][];
}

interface PatrolMapProps {
  patrols: Patrol[];
  incidents: Incident[];
  beats: Beat[];
  stationLocation: { lat: number; lng: number };
  stationName: string;
  showPatrols: boolean;
  showIncidents: boolean;
  showBeats: boolean;
  onPatrolClick?: (patrol: Patrol) => void;
  onIncidentClick?: (incident: Incident) => void;
}

// Component to handle map center updates
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export function PatrolMap({
  patrols,
  incidents,
  beats,
  stationLocation,
  stationName,
  showPatrols,
  showIncidents,
  showBeats,
  onPatrolClick,
  onIncidentClick,
}: PatrolMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const center: [number, number] = [stationLocation.lat, stationLocation.lng];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-background-tertiary flex items-center justify-center">
        <p className="text-foreground-muted">Loading map...</p>
      </div>
    );
  }

  // Sample beat boundaries (polygons around Koramangala area)
  const beatBoundaries: Record<string, [number, number][]> = {
    "beat-a": [
      [12.932, 77.620],
      [12.932, 77.630],
      [12.940, 77.630],
      [12.940, 77.620],
    ],
    "beat-b": [
      [12.940, 77.615],
      [12.940, 77.625],
      [12.948, 77.625],
      [12.948, 77.615],
    ],
    "beat-c": [
      [12.910, 77.635],
      [12.910, 77.650],
      [12.920, 77.650],
      [12.920, 77.635],
    ],
    "beat-d": [
      [12.915, 77.605],
      [12.915, 77.620],
      [12.928, 77.620],
      [12.928, 77.605],
    ],
  };

  const beatColors: Record<string, string> = {
    "beat-a": "#3b82f680",
    "beat-b": "#22c55e80",
    "beat-c": "#eab30880",
    "beat-d": "#8b5cf680",
  };

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: "100%", width: "100%" }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController center={center} />

      {/* Station marker */}
      <Marker position={center} icon={stationIcon}>
        <Popup>
          <div className="text-sm">
            <p className="font-bold">{stationName}</p>
            <p className="text-gray-600">Police Station</p>
          </div>
        </Popup>
      </Marker>

      {/* Beat boundaries */}
      {showBeats &&
        beats.map((beat) => {
          const bounds = beatBoundaries[beat.id];
          if (!bounds) return null;
          return (
            <Polygon
              key={beat.id}
              positions={bounds}
              pathOptions={{
                color: beatColors[beat.id] || "#3b82f680",
                fillColor: beatColors[beat.id] || "#3b82f640",
                fillOpacity: 0.3,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{beat.name}</p>
                  <p className="text-gray-600">{beat.area}</p>
                  <p className="text-gray-500">
                    {beat.patrolCount} patrol{beat.patrolCount !== 1 ? "s" : ""} active
                  </p>
                </div>
              </Popup>
            </Polygon>
          );
        })}

      {/* Patrol markers */}
      {showPatrols &&
        patrols.map((patrol) => (
          <Marker
            key={patrol.id}
            position={[patrol.location.lat, patrol.location.lng]}
            icon={patrol.status === "RESPONDING" ? respondingIcon : patrolIcon}
            eventHandlers={{
              click: () => onPatrolClick?.(patrol),
            }}
          >
            <Popup>
              <div className="text-sm min-w-[150px]">
                <p className="font-bold text-blue-600">{patrol.vehicle}</p>
                <p className="text-gray-600">{patrol.beat}</p>
                <p className="text-gray-500 text-xs">{patrol.officers.join(", ")}</p>
                <p
                  className={`text-xs mt-1 font-medium ${
                    patrol.status === "RESPONDING"
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {patrol.status.replace(/_/g, " ")}
                </p>
                {patrol.respondingTo && (
                  <p className="text-xs text-orange-600 mt-1">
                    Responding to: {patrol.respondingTo}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Updated: {patrol.lastUpdate}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* Incident markers */}
      {showIncidents &&
        incidents
          .filter((i) => i.status !== "RESOLVED")
          .map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.coords.lat, incident.coords.lng]}
              icon={incidentIcon}
              eventHandlers={{
                click: () => onIncidentClick?.(incident),
              }}
            >
              <Popup>
                <div className="text-sm min-w-[150px]">
                  <p className="font-bold text-red-600">{incident.type}</p>
                  <p className="text-gray-600">{incident.location}</p>
                  <p className="text-xs text-gray-500">
                    Priority: {incident.priority}
                  </p>
                  <p className="text-xs text-gray-500">
                    Status: {incident.status}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Time: {incident.time}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

      {/* Incident radius circles */}
      {showIncidents &&
        incidents
          .filter((i) => i.status !== "RESOLVED")
          .map((incident) => (
            <Circle
              key={`circle-${incident.id}`}
              center={[incident.coords.lat, incident.coords.lng]}
              radius={incident.priority === "HIGH" ? 300 : 150}
              pathOptions={{
                color: "#ef4444",
                fillColor: "#ef4444",
                fillOpacity: 0.1,
                weight: 1,
              }}
            />
          ))}
    </MapContainer>
  );
}
