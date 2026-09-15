"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, MapPin, X } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { useI18n } from "@/lib/i18n";
import { useDebounced, usePlaceSearch } from "@/hooks/use-legal";
import legalApi, { type GazetteerPlace } from "@/lib/api/legal";
import { KOLKATA_CENTER } from "@/lib/platform/wb";

const InteractiveMap = dynamic(() => import("./Map").then((m) => m.InteractiveMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-background-tertiary" />,
});

export interface LocationValue {
  location: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  label?: string;
  error?: string;
  mapHeight?: string;
}

/**
 * Incident location: free text with suggestions from the in-platform Kolkata
 * gazetteer (no external geocoding — the address never leaves the platform),
 * and a map pin the officer places by clicking or dragging. Picking a
 * suggestion fills the text and moves the map; setting a pin with the text
 * still empty fills in the nearest named place.
 */
export function LocationPicker({ value, onChange, label, error, mapHeight = "280px" }: LocationPickerProps) {
  const { t, isBengali } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [view, setView] = useState<{ center: [number, number]; zoom: number }>(() =>
    value.latitude !== null && value.longitude !== null
      ? { center: [value.latitude, value.longitude], zoom: 16 }
      : { center: [KOLKATA_CENTER.lat, KOLKATA_CENTER.lng], zoom: 12 },
  );
  const debounced = useDebounced(query, 250);
  const places = usePlaceSearch(open ? debounced : "");
  const suggestions = places.data?.data ?? [];
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const placeLabel = (p: GazetteerPlace) => (isBengali && p.nameBn ? p.nameBn : p.name);

  const choose = (p: GazetteerPlace) => {
    onChange({ location: p.pin && p.kind !== "pin_code" ? `${p.name}, ${p.pin}` : p.name, latitude: p.latitude, longitude: p.longitude });
    setView({ center: [p.latitude, p.longitude], zoom: p.kind === "pin_code" || p.kind === "locality" ? 15 : 16 });
    setOpen(false);
    setQuery("");
  };

  const setPin = async (lat: number, lng: number) => {
    const rounded = { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
    onChange({ ...valueRef.current, ...rounded });
    if (valueRef.current.location.trim() !== "") return;
    try {
      const near = await legalApi.nearestPlaces(rounded.latitude, rounded.longitude, 1);
      // Only fill in if the officer has not typed anything meanwhile.
      if (near[0] && valueRef.current.location.trim() === "") {
        onChange({ ...valueRef.current, ...rounded, location: t("legalScreen.location.nearest", { name: near[0].name }) });
      }
    } catch {
      /* the pin stands; the officer types the address */
    }
  };

  const pin = value.latitude !== null && value.longitude !== null ? { lat: value.latitude, lng: value.longitude } : null;
  const showList = open && debounced.trim().length >= 2;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          label={label ?? t("legalScreen.location.label")}
          placeholder={t("legalScreen.location.placeholder")}
          value={value.location}
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
          autoComplete="off"
          onChange={(v: string) => {
            onChange({ ...value, location: v });
            setQuery(v);
            setOpen(true);
            setHighlight(0);
          }}
          onFocus={() => value.location && (setQuery(value.location), setOpen(true))}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!showList || suggestions.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(suggestions[highlight]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          icon={<MapPin className="h-4 w-4" />}
          error={error}
        />
        {showList && (
          <ul
            role="listbox"
            className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
          >
            {places.isFetching && suggestions.length === 0 && (
              <li className="flex items-center gap-2 px-3 py-2 text-sm text-foreground-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("legalScreen.location.searching")}
              </li>
            )}
            {!places.isFetching && suggestions.length === 0 && (
              <li className="px-3 py-2 text-sm text-foreground-muted">{t("legalScreen.location.noMatch")}</li>
            )}
            {suggestions.map((p, i) => (
              <li key={p.id} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(p)}
                  onMouseEnter={() => setHighlight(i)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left ${
                    i === highlight ? "bg-background-tertiary" : ""
                  }`}
                >
                  <span className="text-sm text-foreground">{placeLabel(p)}</span>
                  <span className="whitespace-nowrap text-xs text-foreground-muted">
                    {t(`legalScreen.location.kinds.${p.kind}` as "legalScreen.location.kinds.locality")}
                    {p.pin && p.kind !== "pin_code" ? ` · ${p.pin}` : ""}
                  </span>
                </button>
              </li>
            ))}
            {suggestions.length > 0 && (
              <li className="px-3 py-1 text-[11px] text-foreground-subtle">{t("legalScreen.location.attribution")}</li>
            )}
          </ul>
        )}
      </div>

      <div style={{ height: mapHeight }} className="relative isolate z-0 overflow-hidden rounded-lg border border-border" data-testid="incident-map">
        <InteractiveMap
          center={view.center}
          zoom={view.zoom}
          height={mapHeight}
          pin={pin}
          onPinChange={setPin}
          pinTitle={value.location || undefined}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-foreground-muted">
        <span data-testid="incident-pin">
          {pin
            ? t("legalScreen.location.pinSet", { lat: pin.lat.toFixed(5), lng: pin.lng.toFixed(5) })
            : `${t("legalScreen.location.noPin")} — ${t("legalScreen.location.mapHint")}`}
        </span>
        {pin && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...value, latitude: null, longitude: null })}
          >
            <X className="mr-1 h-3 w-3" />
            {t("legalScreen.location.clearPin")}
          </Button>
        )}
      </div>
    </div>
  );
}
