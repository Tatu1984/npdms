"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { StatusPill, type StatusTone } from "@/components/platform/primitives";
import anprApi, { AnprError, type AnalysisFrame, type PlateCharacter, type PlateRead } from "@/lib/api/anpr";

export const inputClass =
  "h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";
export const textareaClass =
  "min-h-[64px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

export function errorText(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

/** Converts a datetime-local value to RFC 3339 with the browser's offset. */
export function localToISO(value: string): string {
  return value ? new Date(value).toISOString() : "";
}

export function nowLocalInput(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}

export function confidenceTone(v: number): StatusTone {
  if (v >= 0.85) return "success";
  if (v >= 0.6) return "warning";
  return "danger";
}

export function LabeledField({ label, htmlFor, children, hint }: { label: string; htmlFor?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs font-medium text-foreground-muted">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-foreground-subtle">{hint}</p>}
    </div>
  );
}

/** Per-character confidence: each character is shaded by how sure the reader was. */
export function PlateCharacters({ characters }: { characters: PlateCharacter[] }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex flex-wrap gap-0.5" data-testid="plate-characters">
      {characters.map((c, i) => (
        <span
          key={i}
          title={`${c.char}: ${pct(c.confidence)}${c.corrected ? ` · ${t("anprScreen.result.corrected")} (${c.raw}→${c.char})` : ""}`}
          className={cn(
            "flex w-5 flex-col items-center rounded border px-0.5 font-mono text-xs leading-tight",
            c.confidence >= 0.85
              ? "border-success/40 bg-success-subtle text-success"
              : c.confidence >= 0.6
                ? "border-warning/40 bg-warning-subtle text-warning"
                : "border-danger/40 bg-danger-subtle text-danger",
            c.corrected && "underline decoration-dotted",
          )}
        >
          <span className="font-semibold">{c.char}</span>
          <span className="text-[0.55rem]">{Math.round(c.confidence * 100)}</span>
        </span>
      ))}
    </span>
  );
}

export function PlateReadSummary({ read }: { read: PlateRead }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-semibold text-foreground" data-testid="plate-number">
          {read.displayNumber}
        </span>
        <StatusPill tone={confidenceTone(read.confidence)}>{pct(read.confidence)}</StatusPill>
        {read.minCharConfidence < 0.6 && <StatusPill tone="danger">{t("anprScreen.result.lowConfidence")}</StatusPill>}
      </div>
      <PlateCharacters characters={read.characters} />
      <p className="text-xs text-foreground-muted">
        {t("anprScreen.result.weakest", { value: pct(read.minCharConfidence) })} · {t("anprScreen.result.format")} {read.plateFormat} ·{" "}
        {t("anprScreen.result.rawText")} <span className="font-mono">{read.rawText}</span>
        {read.corrections.length > 0 && ` · ${t("anprScreen.result.corrections")}: ${read.corrections.join("; ")}`}
      </p>
      <p className="text-[0.7rem] text-foreground-subtle">{read.modelVersion}</p>
    </div>
  );
}

/**
 * Shows a stored frame with the detector's boxes (vehicles) and the reader's
 * boxes (plates) drawn over it. The image is fetched with the officer's
 * credentials; the server serves it only after the analysis was opened under a
 * stated purpose.
 */
export function FrameViewer({ analysisId, frame, highlightReadId }: { analysisId: string; frame: AnalysisFrame; highlightReadId?: string }) {
  const { t } = useI18n();
  const [url, setUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<AnprError | Error | null>(null);

  React.useEffect(() => {
    let revoked = false;
    let objectUrl: string | null = null;
    setUrl(null);
    setError(null);
    anprApi
      .frameUrl(analysisId, frame.id)
      .then((u) => {
        objectUrl = u;
        if (revoked) URL.revokeObjectURL(u);
        else setUrl(u);
      })
      .catch((e) => !revoked && setError(e));
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [analysisId, frame.id]);

  const box = (b: [number, number, number, number]) => ({
    left: `${(b[0] / frame.width) * 100}%`,
    top: `${(b[1] / frame.height) * 100}%`,
    width: `${((b[2] - b[0]) / frame.width) * 100}%`,
    height: `${((b[3] - b[1]) / frame.height) * 100}%`,
  });
  const reads = [
    ...frame.detections.flatMap((d) => (d.plateRead ? [d.plateRead] : [])),
    ...frame.unattachedPlateReads,
  ];

  if (error) {
    const needsPurpose = error instanceof AnprError && error.status === 403;
    return (
      <div className="rounded-md border border-dashed border-border p-4 text-sm text-foreground-muted">
        {needsPurpose ? t("anprScreen.frame.needsPurpose") : `${t("anprScreen.frame.failed")} ${error.message}`}
      </div>
    );
  }
  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-border p-4 text-sm text-foreground-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> {t("anprScreen.frame.loading")}
      </div>
    );
  }
  return (
    <div className="relative w-full overflow-hidden rounded-md border border-border bg-black" data-testid="frame-viewer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`Frame ${frame.frameIndex}`} className="block h-auto w-full" />
      {frame.detections.map((d) => (
        <div key={d.id} className="pointer-events-none absolute border-2 border-sky-400" style={box(d.box)}>
          <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-sky-500 px-1 text-[0.65rem] font-semibold text-white">
            {t(`anprScreen.classes.${d.vehicleClass}` as const)} {pct(d.confidence)}
          </span>
        </div>
      ))}
      {reads.map((r) => (
        <div
          key={r.id}
          className={cn(
            "pointer-events-none absolute border-2",
            highlightReadId === r.id ? "border-red-500" : "border-amber-400",
          )}
          style={box(r.box)}
        >
          <span className="absolute left-0 top-full mt-0.5 whitespace-nowrap rounded bg-amber-500 px-1 font-mono text-[0.65rem] font-semibold text-black">
            {r.displayNumber} {pct(r.confidence)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  const { t } = useI18n();
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-2 text-xs text-foreground-muted">
      <button type="button" className="rounded border border-border px-2 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        {t("anprScreen.common.previous")}
      </button>
      <span>{t("anprScreen.common.page", { page, pages })}</span>
      <button type="button" className="rounded border border-border px-2 py-1 disabled:opacity-40" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        {t("anprScreen.common.next")}
      </button>
    </div>
  );
}
