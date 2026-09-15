"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Image as ImageIcon, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusPill } from "@/components/platform/primitives";
import { useI18n } from "@/lib/i18n";
import faceRecognitionApi, { type FaceMatchCandidate } from "@/lib/api/face-recognition";
import { useConfirmCandidate, useRejectCandidate } from "@/hooks/use-face-recognition";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import type { Role } from "@/types";
import { AuthImage } from "./AuthImage";
import { DemoTag } from "./FRStatusBanner";

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "medium" });

const STATUS_TONE = { PENDING: "warning", CONFIRMED: "success", REJECTED: "neutral" } as const;

/**
 * One face match candidate: the enrolled photo beside the face found in the
 * footage, with the similarity, threshold, model version and source frame
 * always on show, and the confirm / reject actions.
 */
export function CandidateCard({ c, showReport }: { c: FaceMatchCandidate; showReport?: boolean }) {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const [frame, setFrame] = React.useState(false);
  const [dialog, setDialog] = React.useState<null | "confirm" | "reject">(null);
  const [note, setNote] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const confirm = useConfirmCandidate();
  const reject = useRejectCandidate();

  const own = user?.id === c.submittedBy;
  const canReview = Boolean(user && hasMinimumRole(user.role as Role, "ASI")) && c.status === "PENDING";
  const place = c.locationText ?? (c.cameraName ? `${c.cameraCode} — ${c.cameraName}` : null);

  const submit = async () => {
    setError(null);
    try {
      if (dialog === "confirm") await confirm.mutateAsync({ id: c.id, note, location: place ? undefined : location });
      else await reject.mutateAsync({ id: c.id, note });
      setDialog(null);
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="rounded-md border border-border p-3" data-testid="fr-candidate" data-candidate-id={c.id} data-status={c.status}>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex gap-2">
          <figure className="flex w-28 flex-col gap-1">
            <AuthImage path={faceRecognitionApi.paths.enrolmentFace(c.enrolmentId)} alt={t("faceRecognitionScreen.candidate.enrolledFace")} className="h-28 w-28 rounded" />
            <figcaption className="text-center text-[11px] text-foreground-subtle">{t("faceRecognitionScreen.candidate.enrolledFace")}</figcaption>
          </figure>
          <figure className="flex w-28 flex-col gap-1">
            <AuthImage path={faceRecognitionApi.paths.candidateCrop(c.id)} alt={t("faceRecognitionScreen.candidate.sourceFace")} className="h-28 w-28 rounded" />
            <figcaption className="text-center text-[11px] text-foreground-subtle">{t("faceRecognitionScreen.candidate.sourceFace")}</figcaption>
          </figure>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold tabular-nums text-foreground" data-testid="fr-similarity">
              {t("faceRecognitionScreen.candidate.similarity")} {c.similarity.toFixed(3)}
            </span>
            <span className="text-xs text-foreground-muted">
              ({t("faceRecognitionScreen.candidate.threshold")} {c.thresholdUsed.toFixed(2)} · {t("faceRecognitionScreen.candidate.model")}{" "}
              <span className="font-mono">{c.modelVersion}</span>)
            </span>
            <StatusPill tone={STATUS_TONE[c.status]}>{t(`faceRecognitionScreen.candidate.status.${c.status}`)}</StatusPill>
            {c.isDemo && <DemoTag />}
          </div>
          {showReport && (
            <p>
              {t("faceRecognitionScreen.candidate.report")}:{" "}
              <Link className="text-accent hover:underline" href={`/missing-persons/${c.reportId}?tab=face-matching`}>
                {c.reportNumber}
              </Link>{" "}
              · {c.personName}
            </p>
          )}
          <p className="text-foreground-muted">
            {t("faceRecognitionScreen.candidate.frameTime")}: <span className="text-foreground">{when(c.frameTime)}</span>
            {c.frameOffsetMs !== null && ` (${(c.frameOffsetMs / 1000).toFixed(1)} s ${t("faceRecognitionScreen.candidate.offset")})`}
          </p>
          <p className="text-foreground-muted">
            {c.cameraName ? t("faceRecognitionScreen.candidate.camera") : t("faceRecognitionScreen.candidate.location")}:{" "}
            <span className="text-foreground">{place ?? "—"}</span>
            {c.latitude !== null && c.longitude !== null && (
              <span className="font-mono text-xs"> ({c.latitude.toFixed(5)}, {c.longitude.toFixed(5)})</span>
            )}
          </p>
          <p className="text-foreground-muted">
            {t("faceRecognitionScreen.candidate.submittedBy")}: <span className="text-foreground">{c.submittedByName}</span> ·{" "}
            {t("faceRecognitionScreen.candidate.purpose")}: <span className="text-foreground">{c.purpose}</span>
          </p>
          <p className="break-all font-mono text-[11px] text-foreground-subtle">
            {t("faceRecognitionScreen.candidate.frameHash")} {c.mediaSha256}
          </p>
          {c.status !== "PENDING" && (
            <p className="text-foreground-muted">
              {t("faceRecognitionScreen.candidate.reviewedBy")}: <span className="text-foreground">{c.reviewedByName}</span>
              {c.reviewedAt && ` · ${when(c.reviewedAt)}`}
              {c.reviewNote && ` — ${c.reviewNote}`}
              {c.sightingId && (
                <span className="ml-2 text-success" data-testid="fr-sighting-created">
                  {t("faceRecognitionScreen.candidate.sighting")}
                </span>
              )}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button size="sm" variant="ghost" onClick={() => setFrame((v) => !v)}>
              <ImageIcon className="h-3.5 w-3.5" />
              {frame ? t("faceRecognitionScreen.candidate.hideFrame") : t("faceRecognitionScreen.candidate.viewFrame")}
            </Button>
            {canReview && own && <span className="text-xs text-foreground-muted">{t("faceRecognitionScreen.candidate.ownSubmission")}</span>}
            {canReview && !own && (
              <>
                <Button size="sm" variant="success" onClick={() => setDialog("confirm")} data-testid="fr-confirm">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("faceRecognitionScreen.candidate.confirm")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDialog("reject")} data-testid="fr-reject">
                  <XCircle className="h-3.5 w-3.5" />
                  {t("faceRecognitionScreen.candidate.reject")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {frame && (
        <AuthImage
          path={faceRecognitionApi.paths.candidateFrame(c.id)}
          alt="source frame"
          className="mt-3 max-w-3xl overflow-hidden rounded border border-border"
          box={c.frameWidth && c.frameHeight ? { ...c.boundingBox, width: c.frameWidth, height: c.frameHeight } : undefined}
        />
      )}

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "confirm" ? t("faceRecognitionScreen.candidate.confirmTitle") : t("faceRecognitionScreen.candidate.rejectTitle")}
            </DialogTitle>
            <DialogDescription>
              {dialog === "confirm" ? t("faceRecognitionScreen.candidate.confirmBody") : t("faceRecognitionScreen.leadRule")}
            </DialogDescription>
          </DialogHeader>
          {c.isDemo && <DemoTag />}
          <div className="grid gap-3">
            {dialog === "confirm" && !place && (
              <div className="grid gap-1.5">
                <Label htmlFor="fr-location">{t("faceRecognitionScreen.search.location")}</Label>
                <Input id="fr-location" value={location} onChange={setLocation} />
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="fr-note">
                {dialog === "confirm" ? t("faceRecognitionScreen.candidate.note") : t("faceRecognitionScreen.candidate.rejectReason")}
              </Label>
              <Textarea id="fr-note" value={note} onChange={setNote} rows={3} />
            </div>
            {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              {t("faceRecognitionScreen.common.cancel")}
            </Button>
            <Button
              onClick={submit}
              disabled={confirm.isPending || reject.isPending || (dialog === "reject" && !note.trim())}
              data-testid="fr-review-submit"
            >
              {dialog === "confirm" ? t("faceRecognitionScreen.candidate.confirm") : t("faceRecognitionScreen.candidate.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
