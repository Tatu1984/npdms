"use client";

import * as React from "react";
import { FlaskConical, RefreshCw, ScanFace, Search, ShieldCheck, Upload } from "lucide-react";
import { Panel, StatusPill } from "@/components/platform/primitives";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import faceRecognitionApi, { type FaceMatchSearchResult, type FRPhoto } from "@/lib/api/face-recognition";
import {
  useEnrol,
  useFaceSearch,
  useFRReport,
  useFRReportCandidates,
  useFRStatus,
  useUploadSyntheticPhoto,
  useWithdrawEnrolment,
} from "@/hooks/use-face-recognition";
import { useCameras } from "@/hooks/use-video";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import type { Role } from "@/types";
import { AuthImage } from "./AuthImage";
import { CandidateCard } from "./CandidateCard";
import { DemoTag, FRStatusBanner } from "./FRStatusBanner";

const selectClass =
  "h-10 w-full rounded-md border border-border bg-background-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

const nowLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * "Face matching" on a missing-person report: authorisation and service
 * status, enrolment of the report's photos, footage search and the report's
 * candidates. Kept in its own file so the report page only mounts it.
 */
export function FaceMatchingPanel({ reportId, open }: { reportId: string; open: boolean }) {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const role = (user?.role ?? "CONSTABLE") as Role;
  const canASI = Boolean(user && hasMinimumRole(role, "ASI"));
  const canSI = Boolean(user && hasMinimumRole(role, "SI"));
  const isAdmin = role === "DGP";

  const status = useFRStatus();
  const usable = Boolean(status.data?.service.configured && status.data?.service.reachable);
  const report = useFRReport(reportId, Boolean(status.data));
  const candidates = useFRReportCandidates(reportId, Boolean(status.data));

  if (status.isLoading) return <Skeleton className="h-40 w-full" />;
  if (status.isError || !status.data) {
    return (
      <Alert variant="danger">
        <ScanFace />
        <AlertDescription>
          {t("faceRecognitionScreen.common.loadFailed")}: {message(status.error)}
        </AlertDescription>
      </Alert>
    );
  }
  const st = status.data;
  const on = usable && st.mode !== "OFF";

  return (
    <div className="flex flex-col gap-4" data-testid="face-matching-panel">
      <FRStatusBanner status={st} />
      <Alert variant="info">
        <ShieldCheck />
        <AlertDescription>{t("faceRecognitionScreen.leadRule")}</AlertDescription>
      </Alert>

      <Panel
        title={t("faceRecognitionScreen.panel.photos")}
        actions={
          on && open && canASI ? <EnrolButton reportId={reportId} /> : undefined
        }
      >
        {report.isLoading && <Skeleton className="h-24 w-full" />}
        {report.isError && <p className="text-sm text-danger">{message(report.error)}</p>}
        {report.data && report.data.photos.length === 0 && (
          <p className="text-sm text-foreground-muted">{t("faceRecognitionScreen.panel.noPhotos")}</p>
        )}
        {st.mode === "DEMO" && <p className="mb-2 text-xs text-foreground-muted">{t("faceRecognitionScreen.panel.realPhotoNeedsOrder")}</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {(report.data?.photos ?? []).map((ph) => (
            <PhotoRow key={ph.id} reportId={reportId} photo={ph} canSI={canSI} />
          ))}
        </div>
      </Panel>

      {on && open && isAdmin && st.activeDemo && <SyntheticUpload reportId={reportId} />}
      {on && canASI && <FootageSearch demoAvailable={Boolean(st.activeDemo)} realAvailable={Boolean(st.activeOrder)} />}

      <Panel title={`${t("faceRecognitionScreen.candidate.title")} (${candidates.data?.data.length ?? 0})`}>
        {candidates.isError && <p className="text-sm text-danger">{message(candidates.error)}</p>}
        {candidates.data && candidates.data.data.length === 0 && (
          <p className="text-sm text-foreground-muted">{t("faceRecognitionScreen.candidate.none")}</p>
        )}
        <div className="flex flex-col gap-3">
          {(candidates.data?.data ?? []).map((c) => (
            <CandidateCard key={c.id} c={c} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function EnrolButton({ reportId }: { reportId: string }) {
  const { t } = useI18n();
  const enrol = useEnrol(reportId);
  return (
    <div className="flex items-center gap-2">
      {enrol.isError && <span className="max-w-xs text-xs text-danger" role="alert">{message(enrol.error)}</span>}
      <Button size="sm" onClick={() => enrol.mutate({})} disabled={enrol.isPending} data-testid="fr-enrol-all">
        <ScanFace className="h-3.5 w-3.5" />
        {enrol.isPending ? t("faceRecognitionScreen.panel.enrolling") : t("faceRecognitionScreen.panel.enrolAll")}
      </Button>
    </div>
  );
}

function PhotoRow({ reportId, photo, canSI }: { reportId: string; photo: FRPhoto; canSI: boolean }) {
  const { t } = useI18n();
  const e = photo.enrolment;
  const withdraw = useWithdrawEnrolment(reportId);
  const enrol = useEnrol(reportId);
  const tone = !e ? "neutral" : e.status === "ENROLLED" ? (e.currentModel ? "success" : "warning") : e.status === "REJECTED" ? "danger" : "neutral";
  const label = !e
    ? t("faceRecognitionScreen.panel.notEnrolled")
    : e.status === "ENROLLED"
      ? e.currentModel
        ? t("faceRecognitionScreen.panel.enrolled")
        : t("faceRecognitionScreen.panel.staleModel")
      : e.status === "REJECTED"
        ? t("faceRecognitionScreen.panel.rejected")
        : t("faceRecognitionScreen.panel.retired");
  return (
    <div className="flex gap-3 rounded-md border border-border p-2" data-testid="fr-photo" data-enrolment-status={e?.status ?? "NONE"}>
      <AuthImage path={faceRecognitionApi.paths.photo(reportId, photo.id, photo.kind)} alt="photo" className="h-24 w-24 shrink-0 rounded" />
      <div className="min-w-0 flex-1 space-y-1 text-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill tone={tone}>{label}</StatusPill>
          {photo.kind === "SYNTHETIC_TEST" ? <DemoTag /> : <span className="text-xs text-foreground-muted">{t("faceRecognitionScreen.panel.reportPhoto")}</span>}
          {photo.isPrimary && <StatusPill tone="info">{t("faceRecognitionScreen.panel.primary")}</StatusPill>}
        </div>
        {photo.kind === "SYNTHETIC_TEST" && <p className="text-xs text-foreground-muted">{photo.syntheticSource}</p>}
        {photo.providedByName && (
          <p className="text-xs text-foreground-muted">
            {t("faceRecognitionScreen.panel.providedBy")} {photo.providedByName}
            {photo.relationship ? ` (${photo.relationship})` : ""}
          </p>
        )}
        {e?.status === "REJECTED" && (
          <p className="text-xs text-danger" data-testid="fr-rejection">
            {e.rejectionReason ? t(`faceRecognitionScreen.reasons.${e.rejectionReason}` as TranslationKey) : ""} — {e.rejectionMessage}
          </p>
        )}
        {e && e.quality && (
          <p className="text-xs text-foreground-subtle">
            {t("faceRecognitionScreen.panel.quality")} {e.quality.score.toFixed(2)} · {e.quality.facePx}px · {e.modelVersion}
            {e.automatic ? ` · ${t("faceRecognitionScreen.panel.automatic")}` : ""}
          </p>
        )}
        <div className="flex gap-2">
          {e?.status === "ENROLLED" && canSI && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const reason = window.prompt(t("faceRecognitionScreen.panel.withdrawReason"));
                if (reason) withdraw.mutate({ enrolmentId: e.id, reason });
              }}
            >
              {t("faceRecognitionScreen.panel.withdraw")}
            </Button>
          )}
          {e && (e.status !== "ENROLLED" || !e.currentModel) && (
            <Button size="sm" variant="ghost" onClick={() => enrol.mutate({ photoId: photo.id, kind: photo.kind })} disabled={enrol.isPending}>
              <RefreshCw className="h-3 w-3" />
              {t("faceRecognitionScreen.panel.reEnrol")}
            </Button>
          )}
        </div>
        {(withdraw.isError || enrol.isError) && <p className="text-xs text-danger">{message(withdraw.error ?? enrol.error)}</p>}
      </div>
    </div>
  );
}

function SyntheticUpload({ reportId }: { reportId: string }) {
  const { t } = useI18n();
  const upload = useUploadSyntheticPhoto(reportId);
  const [file, setFile] = React.useState<File | null>(null);
  const [source, setSource] = React.useState("");
  const [declared, setDeclared] = React.useState(false);
  const [done, setDone] = React.useState(false);
  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4" />
          {t("faceRecognitionScreen.demoUpload.title")}
        </span>
      }
      description={t("faceRecognitionScreen.demoUpload.body")}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="fr-synth-file">{t("faceRecognitionScreen.demoUpload.file")}</Label>
          <input id="fr-synth-file" type="file" accept="image/jpeg,image/png" className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background-secondary file:px-3 file:py-1.5 file:text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fr-synth-source">{t("faceRecognitionScreen.demoUpload.source")}</Label>
          <Input id="fr-synth-source" value={source} onChange={setSource} />
        </div>
        <label className="flex items-start gap-2 text-sm sm:col-span-2">
          <Checkbox id="fr-synth-declare" checked={declared} onCheckedChange={(v) => setDeclared(v === true)} />
          <span>{t("faceRecognitionScreen.demoUpload.declare")}</span>
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button
          size="sm"
          disabled={!file || !declared || source.trim().length < 5 || upload.isPending}
          onClick={async () => {
            if (!file) return;
            setDone(false);
            await upload.mutateAsync({ file, source, declared }).then(() => setDone(true)).catch(() => undefined);
          }}
          data-testid="fr-synth-submit"
        >
          <Upload className="h-3.5 w-3.5" />
          {t("faceRecognitionScreen.demoUpload.submit")}
        </Button>
        {upload.isError && <span className="text-sm text-danger">{message(upload.error)}</span>}
        {done && <DemoTag />}
      </div>
    </Panel>
  );
}

function FootageSearch({ demoAvailable, realAvailable }: { demoAvailable: boolean; realAvailable: boolean }) {
  const { t } = useI18n();
  const search = useFaceSearch();
  const cameras = useCameras({ pageSize: 100, status: "ACTIVE" });
  const [file, setFile] = React.useState<File | null>(null);
  const [purpose, setPurpose] = React.useState("");
  const [recordedAt, setRecordedAt] = React.useState(nowLocal());
  const [cameraId, setCameraId] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [result, setResult] = React.useState<FaceMatchSearchResult | null>(null);
  const [demo, setDemo] = React.useState(demoAvailable && !realAvailable);

  const run = async () => {
    if (!file) return;
    setResult(null);
    try {
      const res = await search.mutateAsync({
        file,
        purpose,
        recordedAt: new Date(recordedAt).toISOString(),
        cameraId: cameraId || undefined,
        location: cameraId ? undefined : location,
        demo: demoAvailable ? demo : undefined,
      });
      setResult(res);
    } catch {
      /* shown below */
    }
  };

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          {t("faceRecognitionScreen.search.title")}
        </span>
      }
      description={t("faceRecognitionScreen.search.body")}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="fr-search-file">{t("faceRecognitionScreen.search.file")}</Label>
          <input id="fr-search-file" type="file" accept="video/*,image/jpeg,image/png" className="block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-background-secondary file:px-3 file:py-1.5 file:text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fr-search-time">{t("faceRecognitionScreen.search.recordedAt")}</Label>
          <Input id="fr-search-time" type="datetime-local" value={recordedAt} onChange={setRecordedAt} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fr-search-camera">{t("faceRecognitionScreen.search.camera")}</Label>
          <select id="fr-search-camera" className={selectClass} value={cameraId} onChange={(e) => setCameraId(e.target.value)}>
            <option value="">{t("faceRecognitionScreen.search.noCamera")}</option>
            {(cameras.data?.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
        {!cameraId && (
          <div className="grid gap-1.5">
            <Label htmlFor="fr-search-location">{t("faceRecognitionScreen.search.location")}</Label>
            <Input id="fr-search-location" value={location} onChange={setLocation} />
          </div>
        )}
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="fr-search-purpose">{t("faceRecognitionScreen.search.purpose")}</Label>
          <Textarea id="fr-search-purpose" rows={2} value={purpose} onChange={setPurpose} />
          <p className="text-xs text-foreground-subtle">{t("faceRecognitionScreen.search.purposeHint")}</p>
        </div>
      </div>
      {demoAvailable && realAvailable && (
        <label className="mt-3 flex items-center gap-2 text-sm">
          <Checkbox id="fr-search-demo" checked={demo} onCheckedChange={(v) => setDemo(v === true)} data-testid="fr-search-demo" />
          <span>{t("faceRecognitionScreen.search.demoSearch")}</span>
        </label>
      )}
      {demoAvailable && (demo || !realAvailable) && (
        <div className="mt-2">
          <DemoTag />
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button onClick={run} disabled={!file || purpose.trim().length < 10 || search.isPending} data-testid="fr-search-submit">
          <Search className="h-4 w-4" />
          {t("faceRecognitionScreen.search.submit")}
        </Button>
        {search.isPending && <span className="text-sm text-foreground-muted">{t("faceRecognitionScreen.search.running")}</span>}
        {search.isError && (
          <span className="text-sm text-danger" role="alert" data-testid="fr-search-error">
            {message(search.error)}
          </span>
        )}
      </div>
      {result && (
        <div className="mt-3 rounded-md border border-border bg-background-secondary p-3 text-sm" data-testid="fr-search-result">
          <div className="flex flex-wrap items-center gap-2">
            <strong>{t("faceRecognitionScreen.search.result")}:</strong> {result.message}
            {result.search.isDemo && <DemoTag />}
          </div>
          <p className="mt-1 text-xs text-foreground-muted">
            {result.search.framesAnalysed ?? 0} {t("faceRecognitionScreen.search.frames")} · {result.search.facesSeen ?? 0}{" "}
            {t("faceRecognitionScreen.search.faces")} · {result.search.gallerySize ?? 0} {t("faceRecognitionScreen.search.gallery")} ·{" "}
            {t("faceRecognitionScreen.candidate.threshold")} {result.search.thresholdUsed.toFixed(2)} · {result.search.modelVersion}
          </p>
        </div>
      )}
    </Panel>
  );
}
