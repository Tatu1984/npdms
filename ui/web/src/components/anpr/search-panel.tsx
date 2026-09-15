"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { EmptyState, Panel, StatusPill } from "@/components/platform/primitives";
import { useReadSearch } from "@/hooks/use-anpr";
import { useCameras } from "@/hooks/use-video";
import type { PlateRead, ReadSearch } from "@/lib/api/anpr";
import { formatDateTime } from "@/lib/utils";
import { LabeledField, Pager, confidenceTone, errorText, inputClass, localToISO, pct } from "./shared";

const PAGE_SIZE = 25;

/**
 * Purpose-logged search over stored plate reads. The query runs only when the
 * officer presses Search; the server records the purpose before answering.
 * `renderAction` lets other screens (the traffic incident page) act on a read.
 */
export function ReadSearchForm({
  renderAction,
  compact,
}: {
  renderAction?: (read: PlateRead) => React.ReactNode;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const cameras = useCameras({ status: "ACTIVE", pageSize: 100 });
  const [purpose, setPurpose] = React.useState("");
  const [plate, setPlate] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [cameraId, setCameraId] = React.useState("");
  const [nearId, setNearId] = React.useState("");
  const [radius, setRadius] = React.useState("1000");
  const [search, setSearch] = React.useState<ReadSearch | null>(null);
  const result = useReadSearch(search);
  const cams = cameras.data?.data ?? [];

  const run = (page = 1) => {
    const near = cams.find((c) => c.id === nearId);
    setSearch({
      purpose: purpose.trim(),
      plate: plate.trim() || undefined,
      from: from ? localToISO(from) : undefined,
      to: to ? localToISO(to) : undefined,
      cameraId: cameraId || undefined,
      ...(near && near.latitude != null && near.longitude != null
        ? { latitude: near.latitude, longitude: near.longitude, radiusM: Number(radius) }
        : {}),
      page,
      pageSize: PAGE_SIZE,
    });
  };
  const rows = result.data?.data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className={compact ? "grid gap-3" : "grid gap-3 md:grid-cols-3"}>
        <div className={compact ? "" : "md:col-span-3"}>
          <LabeledField label={t("anprScreen.search.purpose")} htmlFor="anpr-search-purpose">
            <input id="anpr-search-purpose" className={inputClass} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </LabeledField>
        </div>
        <LabeledField label={t("anprScreen.search.plate")} htmlFor="anpr-search-plate">
          <input id="anpr-search-plate" className={`${inputClass} font-mono uppercase`} value={plate} onChange={(e) => setPlate(e.target.value)} />
        </LabeledField>
        {!compact && (
          <>
            <LabeledField label={t("anprScreen.search.from")} htmlFor="anpr-search-from">
              <input id="anpr-search-from" type="datetime-local" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
            </LabeledField>
            <LabeledField label={t("anprScreen.search.to")} htmlFor="anpr-search-to">
              <input id="anpr-search-to" type="datetime-local" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
            </LabeledField>
            <LabeledField label={t("anprScreen.search.camera")} htmlFor="anpr-search-camera">
              <select id="anpr-search-camera" className={inputClass} value={cameraId} onChange={(e) => setCameraId(e.target.value)}>
                <option value="">{t("anprScreen.search.anyCamera")}</option>
                {cams.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </LabeledField>
            <LabeledField label={t("anprScreen.search.near")} htmlFor="anpr-search-near">
              <select id="anpr-search-near" className={inputClass} value={nearId} onChange={(e) => setNearId(e.target.value)}>
                <option value="">{t("anprScreen.search.nowhere")}</option>
                {cams.filter((c) => c.latitude != null).map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </LabeledField>
            <LabeledField label={t("anprScreen.search.radius")} htmlFor="anpr-search-radius">
              <input id="anpr-search-radius" type="number" min={50} max={50000} className={inputClass} value={radius} onChange={(e) => setRadius(e.target.value)} disabled={!nearId} />
            </LabeledField>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={() => run(1)} disabled={purpose.trim().length < 10 || result.isFetching} data-testid="anpr-search-run">
          {result.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {t("anprScreen.search.run")}
        </Button>
        {purpose.trim().length > 0 && purpose.trim().length < 10 && (
          <span className="text-xs text-foreground-muted">{t("anprScreen.common.purposeShort")}</span>
        )}
        {result.data && <span className="text-xs text-foreground-muted">{t("anprScreen.search.results", { total: result.data.total })}</span>}
      </div>
      {result.isError && <p className="text-sm text-danger">{errorText(result.error)}</p>}
      {result.data && rows.length === 0 && <EmptyState icon={Search} title={t("anprScreen.search.empty")} />}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="anpr-search-results">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
              <tr>
                <th className="py-2 pr-3">{t("anprScreen.result.plate")}</th>
                <th className="py-2 pr-3">{t("anprScreen.result.confidence")}</th>
                <th className="py-2 pr-3">{t("anprScreen.search.time")}</th>
                <th className="py-2 pr-3">{t("anprScreen.search.where")}</th>
                {!compact && <th className="py-2 pr-3">{t("anprScreen.search.analysis")}</th>}
                {!compact && <th className="py-2 pr-3">{t("anprScreen.search.model")}</th>}
                {renderAction && <th className="py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 pr-3 font-mono font-semibold">{r.displayNumber}</td>
                  <td className="py-2 pr-3"><StatusPill tone={confidenceTone(r.confidence)}>{pct(r.confidence)}</StatusPill></td>
                  <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(r.frameTime)}</td>
                  <td className="py-2 pr-3">{r.cameraCode ? `${r.cameraCode} · ${r.cameraLocation}` : t("anprScreen.hits.noCamera")}</td>
                  {!compact && <td className="py-2 pr-3 font-mono text-xs">{r.analysisNumber}</td>}
                  {!compact && <td className="py-2 pr-3 text-xs text-foreground-muted">{r.modelVersion}</td>}
                  {renderAction && <td className="py-2 text-right">{renderAction(r)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result.data && (
        <Pager page={result.data.page} pages={result.data.totalPages} onPage={(p) => run(p)} />
      )}
    </div>
  );
}

export function SearchPanel() {
  const { t } = useI18n();
  return (
    <Panel title={t("anprScreen.search.title")} description={t("anprScreen.search.description")}>
      <ReadSearchForm />
    </Panel>
  );
}
