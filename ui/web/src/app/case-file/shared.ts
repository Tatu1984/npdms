import type { StatusTone } from "@/components/platform/primitives";
import type { CaseFileStatus, ChainState, IntegrityState } from "@/lib/api/case-files";

// Kept out of page.tsx: Next.js rejects extra exports from a page module.

export const STATUS_TONE: Record<CaseFileStatus, StatusTone> = {
  DRAFT: "neutral",
  SUBMITTED: "info",
  APPROVED: "success",
  RETURNED: "warning",
};

export const INTEGRITY_TONE: Record<IntegrityState, StatusTone> = {
  verified: "success",
  broken: "danger",
  pending: "warning",
};

export const CHAIN_TONE: Record<ChainState, StatusTone> = {
  valid: "success",
  invalid: "danger",
  unsigned: "danger",
  legacy: "warning",
  empty: "danger",
};

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
