"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n";
import { StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CLASSIFICATIONS,
  CLASSIFICATION_FLOOR,
  DOC_TYPES,
  type Classification,
  type DocStatus,
  type DocType,
  type DocumentInput,
  type ExtractionStatus,
  type KnowledgeDocument,
} from "@/lib/api/knowledge";
import { useKnowledgeCapabilities } from "@/hooks/use-knowledge";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";

export const selectClass =
  "h-10 w-full rounded-md border border-border bg-background-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

export function ClassificationPill({ value }: { value: Classification }) {
  const { t } = useI18n();
  const tone = value === "PUBLIC" ? "neutral" : value === "RESTRICTED" ? "info" : value === "CONFIDENTIAL" ? "warning" : "danger";
  return <StatusPill tone={tone}>{t(`knowledgeScreen.classifications.${value}`)}</StatusPill>;
}

export function StatusBadge({ value }: { value: DocStatus }) {
  const { t } = useI18n();
  const tone = value === "EFFECTIVE" ? "success" : value === "SUPERSEDED" ? "warning" : "neutral";
  return <StatusPill tone={tone}>{t(`knowledgeScreen.statuses.${value}`)}</StatusPill>;
}

export function ExtractionPill({ value }: { value: ExtractionStatus }) {
  const { t } = useI18n();
  const readable = value === "TEXT_LAYER" || value === "PLAIN_TEXT";
  return (
    <StatusPill tone={readable ? "success" : value === "FAILED" ? "danger" : "warning"}>
      {t(`knowledgeScreen.extraction.${value}`)}
    </StatusPill>
  );
}

/** Renders a search snippet; the API marks matched terms between « and ». */
export function Snippet({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(«[^»]*»)/g);
  return (
    <p className="mt-1 line-clamp-2 text-xs text-foreground-muted">
      {parts.map((part, i) =>
        part.startsWith("«") && part.endsWith("»") ? (
          <mark key={i} className="rounded bg-warning/20 px-0.5 text-foreground">
            {part.slice(1, -1)}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </p>
  );
}

export function docTitle(doc: Pick<KnowledgeDocument, "title" | "titleBn">, locale: string) {
  return locale === "bn" && doc.titleBn ? doc.titleBn : doc.title;
}

/** Rank levels as used by the API's RoleHierarchy. */
const RANK_LEVEL: Record<string, number> = {
  CONSTABLE: 1, HEAD_CONSTABLE: 2, ASI: 3, SI: 4, INSPECTOR: 5, SHO: 6, DSP: 7, SP: 8, DIG: 9, IG: 10, SECRETARY: 11, DGP: 12,
};

export function useOfficer() {
  const { user } = useAuthStore();
  const role = user?.role ?? "";
  return {
    user,
    level: RANK_LEVEL[role] ?? 0,
    canFile: Boolean(user && hasMinimumRole(user.role, "SI")),
    canFollow: Boolean(user && hasMinimumRole(user.role, "ASI")),
    canGovern: Boolean(user && hasMinimumRole(user.role, "SP")),
  };
}

/**
 * Filing dialog, used for a new document and for a new version of one. The
 * API is the authority on every rule; its message is shown as written.
 */
export function DocumentDialog({
  open,
  onOpenChange,
  current,
  submitting,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog files a new version of this document. */
  current?: KnowledgeDocument;
  submitting: boolean;
  error: string | null;
  onSubmit: (input: DocumentInput, file: File) => void;
}) {
  const { t } = useI18n();
  const caps = useKnowledgeCapabilities();
  const { level } = useOfficer();
  const [file, setFile] = React.useState<File | null>(null);
  const [form, setForm] = React.useState({
    docType: "STANDING_ORDER" as DocType,
    title: "",
    titleBn: "",
    issuingAuthority: "",
    referenceNumber: "",
    issuedOn: "",
    classification: "PUBLIC" as Classification,
    applicableTo: "",
    description: "",
  });
  const [localError, setLocalError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setFile(null);
    setLocalError(null);
    setForm({
      docType: current?.docType ?? "STANDING_ORDER",
      title: current?.title ?? "",
      titleBn: current?.titleBn ?? "",
      issuingAuthority: current?.issuingAuthority ?? "",
      referenceNumber: "",
      issuedOn: "",
      classification: current?.classification ?? "PUBLIC",
      applicableTo: current?.applicableTo.join(", ") ?? "",
      description: current?.description ?? "",
    });
  }, [open, current]);

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));
  const maxMb = Math.round((caps.data?.maxUploadBytes ?? 50 * 1024 * 1024) / (1024 * 1024));

  const submit = () => {
    if (!file || !form.title.trim() || !form.issuingAuthority.trim() || !form.issuedOn) {
      setLocalError(t("knowledgeScreen.upload.required"));
      return;
    }
    setLocalError(null);
    onSubmit(
      {
        docType: form.docType,
        title: form.title,
        titleBn: form.titleBn,
        issuingAuthority: form.issuingAuthority,
        referenceNumber: form.referenceNumber,
        issuedOn: form.issuedOn,
        classification: form.classification,
        applicableTo: form.applicableTo.split(",").map((s) => s.trim()).filter(Boolean),
        description: form.description,
      },
      file,
    );
  };

  const shownError = localError ?? error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t(current ? "knowledgeScreen.upload.supersedeTitle" : "knowledgeScreen.upload.title")}</DialogTitle>
          <DialogDescription>
            {t(current ? "knowledgeScreen.upload.supersedeDescription" : "knowledgeScreen.upload.description")}
          </DialogDescription>
        </DialogHeader>

        {caps.data && !caps.data.ocrAvailable && (
          <Alert>
            <AlertDescription>{t("knowledgeScreen.upload.ocrOff")}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="kd-file">{t("knowledgeScreen.upload.file")}</Label>
            <input
              id="kd-file"
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain,image/*"
              className="mt-1 block w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-background-tertiary file:px-3 file:py-2 file:text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="mt-1 text-xs text-foreground-subtle">{t("knowledgeScreen.upload.fileHint", { size: maxMb })}</p>
          </div>
          <div>
            <Label htmlFor="kd-type">{t("knowledgeScreen.upload.docType")}</Label>
            <select id="kd-type" className={selectClass} value={form.docType} onChange={(e) => set("docType")(e.target.value)}>
              {DOC_TYPES.map((d) => (
                <option key={d} value={d}>
                  {t(`knowledgeScreen.types.${d}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="kd-class">{t("knowledgeScreen.upload.classification")}</Label>
            <select
              id="kd-class"
              className={selectClass}
              value={form.classification}
              onChange={(e) => set("classification")(e.target.value)}
            >
              {CLASSIFICATIONS.filter((c) => CLASSIFICATION_FLOOR[c].level <= level).map((c) => (
                <option key={c} value={c}>
                  {t(`knowledgeScreen.classifications.${c}`)} —{" "}
                  {t("knowledgeScreen.classifications.floor", { rank: CLASSIFICATION_FLOOR[c].rank })}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Input id="kd-title" label={t("knowledgeScreen.upload.titleEn")} value={form.title} onChange={set("title")} />
          </div>
          <div className="sm:col-span-2">
            <Input id="kd-title-bn" label={t("knowledgeScreen.upload.titleBn")} value={form.titleBn} onChange={set("titleBn")} />
          </div>
          <Input
            id="kd-authority"
            label={t("knowledgeScreen.upload.authority")}
            value={form.issuingAuthority}
            onChange={set("issuingAuthority")}
          />
          <Input
            id="kd-reference"
            label={t("knowledgeScreen.upload.reference")}
            value={form.referenceNumber}
            onChange={set("referenceNumber")}
          />
          <Input id="kd-issued" type="date" label={t("knowledgeScreen.upload.issuedOn")} value={form.issuedOn} onChange={set("issuedOn")} />
          <Input
            id="kd-applicable"
            label={t("knowledgeScreen.upload.applicableTo")}
            hint={t("knowledgeScreen.upload.applicableHint")}
            value={form.applicableTo}
            onChange={set("applicableTo")}
          />
          <div className="sm:col-span-2">
            <Textarea
              id="kd-description"
              label={t("knowledgeScreen.upload.descriptionLabel")}
              value={form.description}
              onChange={set("description")}
              rows={3}
            />
          </div>
        </div>

        {shownError && (
          <Alert variant="danger">
            <AlertDescription>{shownError}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {t(current ? "knowledgeScreen.upload.submitSupersede" : "knowledgeScreen.upload.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
