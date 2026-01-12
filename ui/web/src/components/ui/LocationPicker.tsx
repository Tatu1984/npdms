'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Crosshair, Loader2, AlertCircle, Search, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './button';
import { Input } from './input';

// Fix for default markers in Leaflet
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

export interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface LocationPickerProps {
  value?: string;
  onChange: (address: string, locationData?: LocationData) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  showMap?: boolean;
  defaultCenter?: [number, number];
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
    county?: string;
    village?: string;
    town?: string;
  };
}

export function LocationPicker({
  value = '',
  onChange,
  label = 'Location',
  placeholder = 'Enter address or use auto-detect',
  required = false,
  error,
  showMap = true,
  defaultCenter = [12.9716, 77.5946], // Bangalore default
}: LocationPickerProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isClient, setIsClient] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isClient || !showMap || !mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: coordinates ? [coordinates.lat, coordinates.lng] : defaultCenter,
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add click handler to set location
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setCoordinates({ lat, lng });

      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data: NominatimResult = await response.json();

        if (data.display_name) {
          const locationData: LocationData = {
            address: data.display_name,
            latitude: lat,
            longitude: lng,
            city: data.address.city || data.address.town || data.address.village,
            state: data.address.state,
            country: data.address.country,
            postalCode: data.address.postcode,
          };
          onChange(data.display_name, locationData);
        }
      } catch (err) {
        console.error('Reverse geocoding failed:', err);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, showMap, defaultCenter]);

  // Update marker when coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !coordinates) return;

    const map = mapInstanceRef.current;

    if (markerRef.current) {
      markerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
    } else {
      markerRef.current = L.marker([coordinates.lat, coordinates.lng]).addTo(map);
    }

    map.setView([coordinates.lat, coordinates.lng], 16);
  }, [coordinates]);

  // Auto-detect current location
  const handleAutoDetect = useCallback(async () => {
    setIsDetecting(true);
    setDetectError(null);

    if (!navigator.geolocation) {
      setDetectError('Geolocation is not supported by your browser');
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });

        // Reverse geocode using Nominatim (OpenStreetMap)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data: NominatimResult = await response.json();

          if (data.display_name) {
            const locationData: LocationData = {
              address: data.display_name,
              latitude,
              longitude,
              city: data.address.city || data.address.town || data.address.village,
              state: data.address.state,
              country: data.address.country,
              postalCode: data.address.postcode,
            };
            onChange(data.display_name, locationData);
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          // Still set coordinates even if reverse geocoding fails
          onChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, {
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            latitude,
            longitude,
          });
        }

        setIsDetecting(false);
      },
      (err) => {
        let errorMessage = 'Failed to detect location';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        setDetectError(errorMessage);
        setIsDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [onChange]);

  // Search for location
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&addressdetails=1&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data: NominatimResult[] = await response.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 500);
  }, []);

  // Select search result
  const handleSelectResult = useCallback((result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    setCoordinates({ lat, lng });
    setSearchResults([]);
    setShowResults(false);
    setSearchQuery('');

    const locationData: LocationData = {
      address: result.display_name,
      latitude: lat,
      longitude: lng,
      city: result.address.city || result.address.town || result.address.village,
      state: result.address.state,
      country: result.address.country,
      postalCode: result.address.postcode,
    };

    onChange(result.display_name, locationData);
  }, [onChange]);

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}

      {/* Main input with auto-detect button */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={value}
            onChange={(v: string) => onChange(v)}
            placeholder={placeholder}
            icon={<MapPin className="h-4 w-4" />}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleAutoDetect}
          disabled={isDetecting}
          className="flex-shrink-0"
        >
          {isDetecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Crosshair className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">
            {isDetecting ? 'Detecting...' : 'Auto Detect'}
          </span>
        </Button>
      </div>

      {/* Search box */}
      <div className="relative">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(v: string) => handleSearch(v)}
            placeholder="Search for a place..."
            icon={isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                type="button"
                onClick={() => handleSelectResult(result)}
                className="w-full px-4 py-3 text-left hover:bg-background-secondary border-b border-border last:border-b-0"
              >
                <p className="text-sm text-foreground line-clamp-2">{result.display_name}</p>
                {result.address.state && (
                  <p className="text-xs text-foreground-muted mt-1">
                    {[result.address.city || result.address.town, result.address.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error messages */}
      {detectError && (
        <div className="flex items-center gap-2 text-sm text-error">
          <AlertCircle className="h-4 w-4" />
          {detectError}
        </div>
      )}

      {error && (
        <p className="text-xs text-error">{error}</p>
      )}

      {/* Coordinates display */}
      {coordinates && (
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          <MapPin className="h-3 w-3" />
          <span>
            Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
          </span>
        </div>
      )}

      {/* Map */}
      {showMap && isClient && (
        <div className="relative">
          <div
            ref={mapRef}
            className="h-[250px] rounded-lg border border-border overflow-hidden"
          />
          <div className="absolute bottom-2 left-2 bg-background/90 px-2 py-1 rounded text-xs text-foreground-muted">
            Click on map to set location
          </div>
        </div>
      )}

      {/* Loading placeholder for SSR */}
      {showMap && !isClient && (
        <div className="h-[250px] rounded-lg border border-border bg-background-secondary flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
        </div>
      )}
    </div>
  );
}

export default LocationPicker;
