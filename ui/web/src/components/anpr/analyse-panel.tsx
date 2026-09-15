"use client";

import * as React from "react";
import { FolderOpen, Loader2, ScanLine, Upload } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, Field, Panel, StatusPill } from "@/components/platform/primitives";
import { useAnalyses, useOpenAnalysis, useSubmitAnalysis } from "@/hooks/use-anpr";
import { useCameras } from "@/hooks/use-video";
import type { Analysis, ANPRStatus } from "@/lib/api/anpr";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/stores/toastStore";
import {
  FrameViewer,
  LabeledField,
  Pager,
  PlateReadSummary,
  confidenceTone,
  errorText,
  inputClass,
  localToISO,
  nowLocalInput,
  pct,
  textareaClass,
} from "./shared";

const RECENT_PAGE_SIZE = 8;

export function AnalysisView({ analysis }: { analysis: Analysis }) {
  const { t } = useI18n();
  const frames = analysis.frames ?? [];
  const hits = analysis.hits ?? [];
  return (
    <Panel
      title={t("anprScreen.result.title", { number: analysis.analysisNumber })}
      description={t("anprScreen.machineNotice")}
      actions={<StatusPill tone="ai">{t("anprScreen.aiBadge")}</StatusPill>}
    >
      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4" data-testid="analysis-summary">
        <Field label={t("anprScreen.result.source")} value={`${t(`anprScreen.result.sourceKinds.${analysis.sourceKind}` as const)}${analysis.cameraCode ? ` · ${analysis.cameraCode}` : ""}`} />
        <Field label={t("anprScreen.result.capturedAt")} value={formatDateTime(analysis.capturedAt)} />
        <Field label={t("anprScreen.result.submittedBy")} value={analysis.submittedByName} />
        <Field label={t("anprScreen.result.processing")} value={analysis.processingMs != null ? `${(analysis.processingMs / 1000).toFixed(1)} s` : "—"} />
        <Field label={t("anprScreen.result.detector")} value={analysis.detectorVersion} className="sm:col-span-2" />
        <Field label={t("anprScreen.result.reader")} value={analysis.plateReaderVersion} className="sm:col-span-2" />
        <Field label={t("anprScreen.result.mediaHash")} value={analysis.mediaSha256} mono className="sm:col-span-2 break-all" />
        <Field label={t("anprScreen.result.sampled")} value={`${analysis.sampledFrames} · ${t("anprScreen.result.frames")} ${analysis.frameCount}`} />
        <Field label={t("anprScreen.result.purpose")} value={analysis.purpose} />
      </dl>

      {frames.length === 0 ? (
        <p className="mt-4 text-sm text-foreground-muted">{t("anprScreen.result.noOutput")}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-6">
          {frames.map((f) => (
            <div key={f.id} className="grid gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <p className="mb-1 text-xs text-foreground-muted">
                  {t("anprScreen.result.frame", { index: f.frameIndex, time: formatDateTime(f.frameTime) })} · {t("anprScreen.result.frameHash")}{" "}
                  <span className="font-mono">{f.sha256.slice(0, 16)}…</span>
                </p>
                <FrameViewer analysisId={analysis.id} frame={f} />
              </div>
              <ul className="flex flex-col divide-y divide-border lg:col-span-2" data-testid="detections">
                {f.detections.map((d) => (
                  <li key={d.id} className="flex flex-col gap-1 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">{t(`anprScreen.classes.${d.vehicleClass}` as const)}</span>
                      <StatusPill tone={confidenceTone(d.confidence)}>{pct(d.confidence)}</StatusPill>
                    </div>
                    {d.plateRead ? (
                      <PlateReadSummary read={d.plateRead} />
                    ) : (
                      <p className="text-xs text-foreground-subtle">{t("anprScreen.result.noPlate")}</p>
                    )}
                  </li>
                ))}
                {f.unattachedPlateReads.map((r) => (
                  <li key={r.id} className="flex flex-col gap-1 py-2">
                    <span className="text-xs text-foreground-muted">{t("anprScreen.result.unattached")}</span>
                    <PlateReadSummary read={r} />
                  </li>
                ))}
                <li className="pt-2 text-[0.7rem] text-foreground-subtle">{f.detections[0]?.modelVersion}</li>
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-md border border-border p-3" data-testid="analysis-hits">
        <p className="text-sm font-medium text-foreground">{t("anprScreen.result.hitsRaised")}</p>
        {hits.length === 0 ? (
          <p className="text-sm text-foreground-muted">{t("anprScreen.result.noHits")}</p>
        ) : (
          <ul className="mt-1 flex flex-col gap-1 text-sm">
            {hits.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-2">
                <span className="font-mono">{h.hitNumber}</span>
                <span className="font-mono font-semibold">{h.read.displayNumber}</span>
                <StatusPill tone={h.status === "PENDING" ? "warning" : h.status === "CONFIRMED" ? "danger" : "neutral"}>
                  {t(`anprScreen.hits.status.${h.status}` as const)}
                </StatusPill>
                <span className="text-foreground-muted">
                  {t(`anprScreen.hits.source.${h.source}` as const)} {h.lookoutNumber || h.watchlistReason}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

export function AnalysePanel({ status, onAnalysis }: { status: ANPRStatus; onAnalysis: (a: Analysis) => void }) {
  const { t } = useI18n();
  const [file, setFile] = React.useState<File | null>(null);
  const [capturedAt, setCapturedAt] = React.useState(nowLocalInput());
  const [cameraId, setCameraId] = React.useState("");
  const [sampleSeconds, setSampleSeconds] = React.useState("1");
  const [purpose, setPurpose] = React.useState("");
  const submit = useSubmitAnalysis();
  const cameras = useCameras({ status: "ACTIVE", pageSize: 100 });
  const isVideo = Boolean(file?.type.startsWith("video/"));
  const ready = status.canAnalyse && file && purpose.trim().length >= 10 && capturedAt;

  const run = async () => {
    if (!file) return;
    try {
      const a = await submit.mutateAsync({
        file,
        purpose: purpose.trim(),
        capturedAt: localToISO(capturedAt),
        cameraId: cameraId || undefined,
        sampleSeconds: isVideo ? Number(sampleSeconds) : undefined,
      });
      onAnalysis(a);
      toast.success(a.analysisNumber, t("anprScreen.recent.counts", { detections: a.detectionCount, reads: a.plateReadCount, hits: a.hitCount }));
    } catch (e) {
      toast.error(t("anprScreen.submit.title"), errorText(e));
    }
  };

  return (
    <Panel title={t("anprScreen.submit.title")} description={t("anprScreen.submit.description")}>
      <div className="grid gap-3 md:grid-cols-2">
        <LabeledField label={t("anprScreen.submit.file")} htmlFor="anpr-file">
          <input
            id="anpr-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,video/*"
            className="text-sm text-foreground file:mr-3 file:rounded file:border file:border-border file:bg-surface file:px-2 file:py-1"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </LabeledField>
        <LabeledField label={t("anprScreen.submit.capturedAt")} htmlFor="anpr-captured">
          <input id="anpr-captured" type="datetime-local" className={inputClass} value={capturedAt} onChange={(e) => setCapturedAt(e.target.value)} />
        </LabeledField>
        <LabeledField label={t("anprScreen.submit.camera")} htmlFor="anpr-camera">
          <select id="anpr-camera" className={inputClass} value={cameraId} onChange={(e) => setCameraId(e.target.value)}>
            <option value="">{t("anprScreen.submit.noCamera")}</option>
            {(cameras.data?.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </LabeledField>
        {isVideo && (
          <LabeledField label={t("anprScreen.submit.sampleSeconds")} htmlFor="anpr-sample">
            <input id="anpr-sample" type="number" min={0.2} max={60} step={0.2} className={inputClass} value={sampleSeconds} onChange={(e) => setSampleSeconds(e.target.value)} />
          </LabeledField>
        )}
        <div className="md:col-span-2">
          <LabeledField label={t("anprScreen.submit.purpose")} htmlFor="anpr-purpose" hint={t("anprScreen.submit.purposeHint")}>
            <textarea id="anpr-purpose" className={textareaClass} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </LabeledField>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button onClick={run} disabled={!ready || submit.isPending} data-testid="anpr-analyse">
          {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {submit.isPending ? t("anprScreen.submit.running") : t("anprScreen.submit.run")}
        </Button>
        {!status.canAnalyse && <span className="text-xs text-foreground-muted">{t("anprScreen.submit.unavailable")}</span>}
      </div>
    </Panel>
  );
}

export function RecentAnalyses({ onOpened }: { onOpened: (a: Analysis) => void }) {
  const { t } = useI18n();
  const [page, setPage] = React.useState(1);
  const list = useAnalyses(page, RECENT_PAGE_SIZE);
  const open = useOpenAnalysis();
  const [target, setTarget] = React.useState<Analysis | null>(null);
  const [purpose, setPurpose] = React.useState("");
  const rows = list.data?.data ?? [];

  const confirm = async () => {
    if (!target) return;
    try {
      const a = await open.mutateAsync({ id: target.id, purpose: purpose.trim() });
      onOpened(a);
      setTarget(null);
      setPurpose("");
    } catch (e) {
      toast.error(target.analysisNumber, errorText(e));
    }
  };

  return (
    <Panel title={t("anprScreen.recent.title")} bodyClassName="p-0">
      {list.isLoading ? (
        <div className="flex items-center gap-2 p-4 text-sm text-foreground-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : list.isError ? (
        <div className="flex items-center justify-between gap-2 p-4 text-sm text-danger">
          {t("anprScreen.common.loadFailed")}: {errorText(list.error)}
          <Button size="sm" variant="outline" onClick={() => list.refetch()}>{t("anprScreen.common.retry")}</Button>
        </div>
      ) : rows.length === 0 ? (
        <div className="p-4"><EmptyState icon={ScanLine} title={t("anprScreen.recent.empty")} /></div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
              <div className="min-w-0">
                <p className="font-mono text-foreground">{a.analysisNumber}</p>
                <p className="text-xs text-foreground-muted">
                  {t(`anprScreen.result.sourceKinds.${a.sourceKind}` as const)}
                  {a.cameraCode ? ` · ${a.cameraCode}` : ""} · {formatDateTime(a.capturedAt)} · {a.submittedByName}
                </p>
                <p className="text-xs text-foreground-subtle">
                  {t("anprScreen.recent.counts", { detections: a.detectionCount, reads: a.plateReadCount, hits: a.hitCount })}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setTarget(a)}>
                <FolderOpen className="h-4 w-4" /> {t("anprScreen.recent.open")}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="px-4 py-2">
        <Pager page={page} pages={list.data?.totalPages ?? 0} onPage={setPage} />
      </div>
      <Dialog open={Boolean(target)} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("anprScreen.recent.openTitle", { number: target?.analysisNumber ?? "" })}</DialogTitle>
            <DialogDescription>{t("anprScreen.machineNotice")}</DialogDescription>
          </DialogHeader>
          <LabeledField label={t("anprScreen.recent.openPurpose")} htmlFor="anpr-open-purpose">
            <textarea id="anpr-open-purpose" className={textareaClass} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          </LabeledField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>{t("anprScreen.common.cancel")}</Button>
            <Button onClick={confirm} disabled={purpose.trim().length < 10 || open.isPending}>{t("anprScreen.recent.open")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
