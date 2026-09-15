import type { TranslationKey } from "@/lib/i18n";
import type { StatusTone } from "@/components/platform/primitives";
import type { CameraHealth, VideoEventStatus, VideoEventType } from "@/lib/api/video";

/** Enum labels for Phase 03. Codes stay in the data; words stay here. */

export const EVENT_TYPE_LABEL: Record<VideoEventType, { en: string; bn: string }> = {
  SUSPICIOUS_ACTIVITY: { en: "Suspicious activity", bn: "সন্দেহজনক কার্যকলাপ" },
  ABANDONED_OBJECT: { en: "Abandoned object", bn: "পরিত্যক্ত বস্তু" },
  CROWD_BUILDUP: { en: "Crowd build-up", bn: "ভিড় জমা" },
  TRAFFIC_VIOLATION: { en: "Traffic violation", bn: "ট্রাফিক আইন লঙ্ঘন" },
  ACCIDENT: { en: "Accident", bn: "দুর্ঘটনা" },
  ASSAULT: { en: "Assault", bn: "হামলা" },
  THEFT: { en: "Theft", bn: "চুরি" },
  VEHICLE_OF_INTEREST: { en: "Vehicle of interest", bn: "সন্দেহভাজন যান" },
  PERSON_OF_INTEREST: { en: "Person of interest", bn: "সন্দেহভাজন ব্যক্তি" },
  CAMERA_TAMPERING: { en: "Camera tampering", bn: "ক্যামেরায় কারসাজি" },
  OTHER: { en: "Other", bn: "অন্যান্য" },
};

export const OWNER_LABEL: Record<string, { en: string; bn: string }> = {
  KP: { en: "Kolkata Police", bn: "কলকাতা পুলিশ" },
  KMC: { en: "Kolkata Municipal Corporation", bn: "কলকাতা পৌরসংস্থা" },
  TRAFFIC: { en: "Traffic Police", bn: "ট্রাফিক পুলিশ" },
  PRIVATE: { en: "Private (integrated)", bn: "বেসরকারি (সংযুক্ত)" },
  OTHER: { en: "Other agency", bn: "অন্য সংস্থা" },
};

export const HEALTH_LABEL: Record<CameraHealth, { en: string; bn: string; tone: StatusTone }> = {
  REACHABLE: { en: "Reachable", bn: "সংযোগযোগ্য", tone: "success" },
  UNREACHABLE: { en: "Unreachable", bn: "সংযোগহীন", tone: "danger" },
  UNCHECKED: { en: "Not checked", bn: "পরীক্ষিত নয়", tone: "neutral" },
  NO_STREAM: { en: "No stream", bn: "স্ট্রিম নেই", tone: "neutral" },
};

export const RETENTION_LABEL: Record<string, { en: string; bn: string }> = {
  SHORT: { en: "Short", bn: "স্বল্প" },
  STANDARD: { en: "Standard", bn: "সাধারণ" },
  EXTENDED: { en: "Extended", bn: "বর্ধিত" },
  EVIDENTIAL: { en: "Evidential", bn: "সাক্ষ্যমূলক" },
};

export const EVENT_STATUS: Record<VideoEventStatus, { key: TranslationKey; tone: StatusTone }> = {
  RAISED: { key: "video.statusRaised", tone: "warning" },
  CONFIRMED: { key: "video.statusConfirmed", tone: "success" },
  DISMISSED: { key: "video.statusDismissed", tone: "neutral" },
};

/** A datetime-local value (browser local time) as RFC 3339 for the API. */
export function localInputToISO(value: string): string {
  return new Date(value).toISOString();
}

/** Now, as a datetime-local input value in browser local time. */
export function nowLocalInput(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export const inputClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";
