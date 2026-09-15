"use client";

import * as React from "react";
import { AlertTriangle, ImagePlus, Lock, MapPinOff, ShieldCheck, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ApiClientError } from "@/lib/api/client";
import {
  PHOTO_MAX_BYTES,
  PHOTO_SOURCES,
  PHOTO_TYPES,
  type MissingPerson,
  type MissingPersonPhoto,
  type PhotoSource,
} from "@/lib/api/missing-persons";
import { useMissingPhotos, usePhotoUrl, useRetirePhoto, useSetPrimaryPhoto, useUploadPhoto } from "@/hooks/use-missing-persons";
import { act } from "@/components/platform/actions";
import { Panel, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { errorMessage, Field, formatWhen, selectClass } from "./shared";

/**
 * A neutral head-and-shoulders outline shown where there is no photograph.
 * Deliberately not a face: nothing here could be mistaken for the person.
 */
export function Silhouette({ className, label }: { className?: string; label: string }) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label={label} className={className}>
      <title>{label}</title>
      <rect width="64" height="64" fill="currentColor" opacity="0.08" />
      <circle cx="32" cy="25" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.45" />
      <path d="M12 60c1.5-11 9.5-18 20-18s18.5 7 20 18" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.45" />
    </svg>
  );
}

const thumbSizes = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
} as const;

/** The primary photograph's server-drawn thumbnail, or the neutral outline. */
export function PersonThumb({
  reportId,
  photoId,
  size = "sm",
  name,
}: {
  reportId: string;
  photoId: string | null | undefined;
  size?: keyof typeof thumbSizes;
  name: string;
}) {
  const { t } = useI18n();
  const url = usePhotoUrl(reportId, photoId, "thumbnail");
  const box = `${thumbSizes[size]} shrink-0 overflow-hidden rounded-md border border-border bg-background-tertiary text-foreground`;
  if (!photoId || url.isError) {
    return (
      <div className={box} data-testid="person-thumb-placeholder">
        <Silhouette className="h-full w-full" label={t("missingBoard.photos.noPhoto")} />
      </div>
    );
  }
  if (!url.data) return <Skeleton className={thumbSizes[size]} />;
  return (
    <div className={box}>
      {/* eslint-disable-next-line @next/next/no-img-element -- an authenticated object URL, not a static asset */}
      <img src={url.data} alt={name} className="h-full w-full object-cover" data-testid="person-thumb" />
    </div>
  );
}

function PhotoImage({ reportId, photo, className }: { reportId: string; photo: MissingPersonPhoto; className: string }) {
  const { t } = useI18n();
  const url = usePhotoUrl(reportId, photo.id, "image");
  if (url.isError) {
    return (
      <div className={`${className} flex items-center justify-center bg-background-tertiary p-3 text-center text-xs text-foreground-muted`}>
        {errorMessage(url.error) ?? t("missingBoard.photos.loadFailed")}
      </div>
    );
  }
  if (!url.data) return <Skeleton className={className} />;
  // eslint-disable-next-line @next/next/no-img-element -- an authenticated object URL
  return <img src={url.data} alt={`${photo.providedByName} · ${photo.relationship}`} className={className} />;
}

/**
 * Photographs first on the report: family and friends' photographs lead (the
 * API orders them), each labelled with who gave it and when.
 */
export function PhotoGallery({ person, canUpload, canRetire }: { person: MissingPerson; canUpload: boolean; canRetire: boolean }) {
  const { t } = useI18n();
  const [showRetired, setShowRetired] = React.useState(false);
  const photos = useMissingPhotos(person.id, showRetired);
  const [uploading, setUploading] = React.useState(false);
  const [viewing, setViewing] = React.useState<MissingPersonPhoto | null>(null);
  const [retiring, setRetiring] = React.useState<MissingPersonPhoto | null>(null);
  const setPrimary = useSetPrimaryPhoto();
  const open = person.status === "REPORTED" || person.status === "SEARCHING";
  const list = photos.data ?? [];
  const active = list.filter((p) => !p.retiredAt);
  const retired = list.filter((p) => p.retiredAt);
  const restricted = photos.error instanceof ApiClientError && photos.error.code === 403;

  return (
    <Panel
      title={t("missingBoard.photos.title")}
      description={t("missingBoard.photos.description")}
      actions={
        canUpload && open ? (
          <Button size="sm" onClick={() => setUploading(true)} data-testid="add-photo">
            <ImagePlus className="h-3.5 w-3.5" />
            {t("missingBoard.photos.add")}
          </Button>
        ) : undefined
      }
      menu={[
        act.run("retired", showRetired ? t("missingBoard.photos.hideRetired") : t("missingBoard.photos.showRetired"), () =>
          setShowRetired((v) => !v),
        ),
      ]}
    >
      {restricted ? (
        <div className="flex items-start gap-3 text-sm text-foreground-muted">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex flex-col gap-3">
            <p>{t("missingBoard.photos.restricted")}</p>
            {person.primaryPhotoId && <PersonThumb reportId={person.id} photoId={person.primaryPhotoId} size="lg" name={person.personName} />}
          </div>
        </div>
      ) : photos.isError ? (
        <p className="text-sm text-danger">{errorMessage(photos.error)}</p>
      ) : photos.isLoading ? (
        <div className="flex gap-3">
          <Skeleton className="h-48 w-40" />
          <Skeleton className="h-48 w-40" />
        </div>
      ) : active.length === 0 && retired.length === 0 ? (
        <div className="flex items-center gap-4" data-testid="gallery-empty">
          <div className="h-24 w-24 overflow-hidden rounded-md border border-border text-foreground">
            <Silhouette className="h-full w-full" label={t("missingBoard.photos.noPhoto")} />
          </div>
          <div>
            <p className="text-sm text-foreground">{t("missingBoard.photos.none")}</p>
            <p className="text-xs text-foreground-muted">{t("missingBoard.photos.noneHint")}</p>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7" data-testid="photo-gallery">
          {[...active, ...retired].map((photo) => (
            <li
              key={photo.id}
              data-testid="gallery-photo"
              className={
                photo.retiredAt
                  ? "flex flex-col overflow-hidden rounded-md border border-border opacity-60"
                  : photo.isPrimary
                    ? "flex flex-col overflow-hidden rounded-md border-2 border-accent"
                    : "flex flex-col overflow-hidden rounded-md border border-border"
              }
            >
              <button type="button" onClick={() => setViewing(photo)} className="relative block aspect-[3/4] w-full bg-background-tertiary" aria-label={t("missingBoard.photos.viewFull")}>
                <PhotoImage reportId={person.id} photo={photo} className="h-full w-full object-cover" />
                {photo.isPrimary && (
                  <span className="absolute left-1.5 top-1.5">
                    <StatusPill tone="info">
                      <Star className="h-3 w-3" />
                      {t("missingBoard.photos.primary")}
                    </StatusPill>
                  </span>
                )}
              </button>
              <div className="flex flex-1 flex-col gap-1 p-2 text-xs">
                <span className="font-medium text-foreground">{t(`missingBoard.photos.source.${photo.source}`)}</span>
                <span className="text-foreground-muted">
                  {t("missingBoard.photos.providedBy", { name: photo.providedByName, relationship: photo.relationship })}
                </span>
                <span className="text-foreground-subtle">
                  {t("missingBoard.photos.addedBy", { name: photo.uploadedByName, when: formatWhen(photo.createdAt) })}
                </span>
                {photo.takenOn && <span className="text-foreground-subtle">{t("missingBoard.photos.takenOn", { date: photo.takenOn })}</span>}
                <span className={photo.consentRecorded ? "text-success" : "text-warning"}>
                  {photo.consentRecorded ? t("missingBoard.photos.consentYes") : t("missingBoard.photos.consentNo")}
                </span>
                {photo.qualityNote && <span className="italic text-foreground-muted">{photo.qualityNote}</span>}
                {photo.retiredAt && (
                  <span className="text-danger">
                    {t("missingBoard.photos.retiredBy", { name: photo.retiredByName, when: formatWhen(photo.retiredAt), reason: photo.retireReason ?? "" })}
                  </span>
                )}
                {!photo.retiredAt && (canUpload || canRetire) && (
                  <div className="mt-auto flex flex-wrap gap-1 pt-1">
                    {canUpload && !photo.isPrimary && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={setPrimary.isPending}
                        onClick={() => setPrimary.mutate({ id: person.id, photoId: photo.id })}
                      >
                        {t("missingBoard.photos.setPrimary")}
                      </Button>
                    )}
                    {canRetire && (
                      <Button size="sm" variant="ghost" onClick={() => setRetiring(photo)}>
                        {t("missingBoard.photos.retire")}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {setPrimary.isError && <p className="mt-2 text-sm text-danger">{errorMessage(setPrimary.error)}</p>}

      <UploadPhotoDialog open={uploading} onClose={() => setUploading(false)} person={person} />
      <RetirePhotoDialog photo={retiring} onClose={() => setRetiring(null)} person={person} />
      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[95vh] max-w-3xl overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{t("missingBoard.photos.providedBy", { name: viewing.providedByName, relationship: viewing.relationship })}</DialogTitle>
                <DialogDescription>
                  {t(`missingBoard.photos.source.${viewing.source}`)} · {formatWhen(viewing.createdAt)} ·{" "}
                  {t("missingBoard.photos.dimensions", { w: viewing.width, h: viewing.height })}
                </DialogDescription>
              </DialogHeader>
              <PhotoImage reportId={person.id} photo={viewing} className="max-h-[70vh] w-full rounded-md object-contain" />
              <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                {viewing.locationMetadataRemoved ? (
                  <span className="flex items-center gap-1">
                    <MapPinOff className="h-3.5 w-3.5" />
                    {t("missingBoard.photos.locationRemoved")}
                  </span>
                ) : null}
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="font-mono">SHA-256 {viewing.sha256.slice(0, 16)}…</span>
                </span>
                {viewing.consentNote && <span>{viewing.consentNote}</span>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

function UploadPhotoDialog({ open, onClose, person }: { open: boolean; onClose: () => void; person: MissingPerson }) {
  const { t } = useI18n();
  const upload = useUploadPhoto();
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<PhotoSource>("FAMILY");
  const [providedBy, setProvidedBy] = React.useState("");
  const [relationship, setRelationship] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [consentNote, setConsentNote] = React.useState("");
  const [takenOn, setTakenOn] = React.useState("");
  const [quality, setQuality] = React.useState("");
  const [makePrimary, setMakePrimary] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setFile(null);
      setSource("FAMILY");
      setProvidedBy(person.masked ? "" : person.reporterName);
      setRelationship(person.masked ? "" : person.reporterRelation);
      setConsent(false);
      setConsentNote("");
      setTakenOn("");
      setQuality("");
      setMakePrimary(false);
      setError(null);
      upload.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const choose = (f: File | undefined) => {
    setError(null);
    if (!f) return;
    if (!PHOTO_TYPES.includes(f.type)) {
      setError(t("missingBoard.upload.wrongType"));
      return;
    }
    if (f.size > PHOTO_MAX_BYTES) {
      setError(t("missingBoard.upload.tooLarge"));
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    setError(null);
    if (!file || !providedBy.trim() || !relationship.trim()) {
      setError(t("missingBoard.upload.required"));
      return;
    }
    try {
      await upload.mutateAsync({
        id: person.id,
        input: {
          file,
          source,
          providedByName: providedBy.trim(),
          relationship: relationship.trim(),
          consentRecorded: consent,
          consentNote: consentNote.trim() || undefined,
          takenOn: takenOn || undefined,
          qualityNote: quality.trim() || undefined,
          makePrimary,
        },
      });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("missingBoard.upload.title")}</DialogTitle>
          <DialogDescription>{t("missingBoard.upload.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="flex items-center gap-3">
            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-background-tertiary text-foreground">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <Silhouette className="h-full w-full" label={t("missingBoard.photos.noPhoto")} />
              )}
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="ph-file" className="text-sm font-medium text-foreground">
                {t("missingBoard.upload.file")}
              </label>
              <input
                id="ph-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => choose(e.target.files?.[0])}
                className="text-sm text-foreground-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-background-secondary file:px-3 file:py-1.5 file:text-sm file:text-foreground"
              />
              {file && <span className="text-xs text-foreground-subtle">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</span>}
            </div>
          </div>
          <Field id="ph-source" label={t("missingBoard.upload.source")}>
            <select id="ph-source" className={selectClass} value={source} onChange={(e) => setSource(e.target.value as PhotoSource)}>
              {PHOTO_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {t(`missingBoard.photos.source.${s}`)}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="ph-provider" label={t("missingBoard.upload.providerName")}>
              <Input id="ph-provider" value={providedBy} onChange={(v: string) => setProvidedBy(v)} />
            </Field>
            <Field id="ph-relationship" label={t("missingBoard.upload.relationship")}>
              <Input id="ph-relationship" value={relationship} onChange={(v: string) => setRelationship(v)} />
            </Field>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={consent} onCheckedChange={(c) => setConsent(c === true)} aria-label={t("missingBoard.upload.consent")} />
            <span>{t("missingBoard.upload.consent")}</span>
          </label>
          {consent && (
            <Field id="ph-consent-note" label={t("missingBoard.upload.consentNote")}>
              <Input id="ph-consent-note" value={consentNote} onChange={(v: string) => setConsentNote(v)} />
            </Field>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="ph-taken" label={t("missingBoard.upload.takenOn")}>
              <Input id="ph-taken" type="date" value={takenOn} onChange={(v: string) => setTakenOn(v)} />
            </Field>
            <Field id="ph-quality" label={t("missingBoard.upload.quality")}>
              <Input id="ph-quality" placeholder={t("missingBoard.upload.qualityHint")} value={quality} onChange={(v: string) => setQuality(v)} />
            </Field>
          </div>
          {person.photoCount > 0 && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={makePrimary} onCheckedChange={(c) => setMakePrimary(c === true)} aria-label={t("missingBoard.upload.makePrimary")} />
              {t("missingBoard.upload.makePrimary")}
            </label>
          )}
        </div>
        {error && (
          <Alert variant="danger">
            <AlertTriangle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={upload.isPending} data-testid="upload-photo-submit">
            {upload.isPending ? t("missingBoard.upload.saving") : t("missingBoard.upload.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RetirePhotoDialog({ photo, onClose, person }: { photo: MissingPersonPhoto | null; onClose: () => void; person: MissingPerson }) {
  const { t } = useI18n();
  const retire = useRetirePhoto();
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    setReason("");
    setError(null);
  }, [photo]);
  const submit = async () => {
    if (!photo) return;
    if (!reason.trim()) {
      setError(t("missingBoard.photos.reasonMissing"));
      return;
    }
    try {
      await retire.mutateAsync({ id: person.id, photoId: photo.id, reason: reason.trim() });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    }
  };
  return (
    <Dialog open={photo !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("missingBoard.photos.retireTitle")}</DialogTitle>
          <DialogDescription>{t("missingBoard.photos.retireDesc")}</DialogDescription>
        </DialogHeader>
        <Field id="ph-retire-reason" label={t("missingBoard.photos.reason")}>
          <Textarea id="ph-retire-reason" rows={2} value={reason} onChange={(v: string) => setReason(v)} />
        </Field>
        {error && (
          <Alert variant="danger">
            <AlertTriangle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="destructive" onClick={submit} disabled={retire.isPending}>
            {t("missingBoard.photos.retire")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
