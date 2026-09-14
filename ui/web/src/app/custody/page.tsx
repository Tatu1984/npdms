"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  ClipboardList,
  FileCheck2,
  FileUp,
  Fingerprint,
  HardDrive,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import custodyApi, { type EvidenceRecord, type EvidenceType } from "@/lib/api/custody";
import { useCustodyStats, useEvidenceRegister } from "@/hooks/use-custody";
import { DataTable, type Column } from "@/components/platform/data-table";
import { IntegrityBadge } from "./integrity-badge";
import { act, type Action } from "@/components/platform/actions";
import {
  EmptyState,
  PageHeader,
  PhaseBadge,
  StatTile,
  StatusPill,
} from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";
import { custodyKeys } from "@/hooks/use-custody";
import { RecordLinkPicker, type RecordLink } from "@/components/platform/pickers";
import { casesApi } from "@/lib/api/cases";
import { firsApi } from "@/lib/api/firs";

const EVIDENCE_TYPES: EvidenceType[] = ["DIGITAL", "DOCUMENTARY", "PHYSICAL", "BIOLOGICAL", "TRACE", "TESTIMONIAL"];

function formatBytes(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function CustodyPage() {
  const router = useRouter();
  const { t } = useI18n();
  const qc = useQueryClient();

  const [registerOpen, setRegisterOpen] = React.useState(false);
  const [preset, setPreset] = React.useState<{ caseId?: string; firId?: string }>({});

  // Opened from a case or FIR (/evidence/new?caseId=… forwards here): open the
  // register dialog with that record linked. Read once on mount; useSearchParams
  // would force this statically rendered page behind a Suspense boundary.
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("register") === "1") {
      setPreset({ caseId: params.get("caseId") ?? undefined, firId: params.get("firId") ?? undefined });
      setRegisterOpen(true);
    }
  }, []);
  const { data, isLoading, isError, error, refetch } = useEvidenceRegister({ pageSize: 100 });
  const stats = useCustodyStats();

  const items = data?.data ?? [];
  const broken = stats.data?.broken ?? 0;

  const columns: Column<EvidenceRecord>[] = [
    {
      id: "evidence",
      header: t("custodyScreen.list.evidence"),
      sortValue: (e) => e.evidenceNumber,
      searchValue: (e) => [e.evidenceNumber, e.description, e.sealNumber].filter(Boolean).join(" "),
      cell: (e) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{e.description}</p>
          <p className="mt-0.5 font-mono text-xs text-foreground-subtle">{e.evidenceNumber}</p>
        </div>
      ),
    },
    {
      id: "type",
      header: t("custodyScreen.list.type"),
      hideBelow: "sm",
      sortValue: (e) => e.evidenceType,
      cell: (e) => <StatusPill>{t(`custodyScreen.types.${e.evidenceType}`)}</StatusPill>,
    },
    {
      id: "file",
      header: t("custodyScreen.list.file"),
      hideBelow: "lg",
      sortValue: (e) => e.file.fileSize ?? 0,
      cell: (e) =>
        e.file.objectKey ? (
          <div className="min-w-0">
            <p className="truncate text-xs text-foreground">{e.file.originalFilename}</p>
            <p className="font-mono text-[0.65rem] text-foreground-subtle">
              {formatBytes(e.file.fileSize)}
              {e.file.sha256 ? ` · ${e.file.sha256.slice(0, 12)}…` : ""}
            </p>
          </div>
        ) : (
          <span className="text-xs text-foreground-subtle">{t("custodyScreen.list.noFile")}</span>
        ),
    },
    {
      id: "custody",
      header: t("custodyScreen.list.heldBy"),
      hideBelow: "md",
      sortValue: (e) => e.currentHolder ?? "",
      cell: (e) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{e.currentHolder || "—"}</p>
          <p className="text-xs text-foreground-subtle">
            {e.transferCount}{" "}
            {e.transferCount === 1 ? t("custodyScreen.list.movement") : t("custodyScreen.list.movements")}
          </p>
        </div>
      ),
    },
    {
      id: "integrity",
      header: t("custodyScreen.list.integrity"),
      sortValue: (e) => e.integrityState,
      cell: (e) => (
        <div className="flex flex-col items-start gap-1">
          <IntegrityBadge state={e.integrityState} />
          {e.lastVerifiedAt && (
            <span className="text-[0.65rem] text-foreground-subtle">
              {new Date(e.lastVerifiedAt).toLocaleDateString("en-IN")}
            </span>
          )}
        </div>
      ),
    },
  ];

  const rowActions = (e: EvidenceRecord): Action[] => [
    act.label("h", e.evidenceNumber),
    act.link("open", t("custodyScreen.list.openRecord"), `/custody/${e.id}`, { icon: ShieldCheck }),
    act.link("chain", t("custodyScreen.list.chain"), `/custody/${e.id}?tab=custody`, { icon: ArrowLeftRight }),
    act.link("access", t("custodyScreen.list.accessLog"), `/custody/${e.id}?tab=access`, { icon: Fingerprint }),
    act.sep("s1"),
    act.link("verify", t("custodyScreen.list.verify"), `/custody/${e.id}?verify=1`, { icon: ScanLine }),
    act.link("court", t("custodyScreen.list.court"), `/custody/${e.id}?tab=court`, { icon: FileCheck2 }),
    act.sep("s2"),
    act.link("malkhana", t("custodyScreen.list.seizedProperty"), "/malkhana", { icon: ClipboardList }),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.custody")}
          description={t("modules.custodyDesc")}
          icon={ShieldCheck}
          badge={<PhaseBadge phase={2} />}
          breadcrumb={[{ label: t("nav.evidenceGroup") }, { label: t("modules.custody") }]}
          actions={
            <>
              <Button variant="outline" onClick={() => router.push("/malkhana")}>
                <ClipboardList className="h-4 w-4" />
                {t("custodyScreen.list.malkhana")}
              </Button>
              <Button onClick={() => setRegisterOpen(true)}>
                <FileUp className="h-4 w-4" />
                {t("custodyScreen.register.title")}
              </Button>
            </>
          }
          menu={[
            act.link("investigation", t("custodyScreen.list.workspaces"), "/investigation", {
              icon: ClipboardList,
            }),
            act.link("audit", t("custodyScreen.list.auditTrail"), "/audit", { icon: Fingerprint }),
          ]}
        />

        {broken > 0 && (
          <Alert variant="danger">
            <ShieldAlert />
            <div>
              <AlertTitle>{t("custodyScreen.list.brokenTitle", { n: broken })}</AlertTitle>
              <AlertDescription>{t("custodyScreen.list.brokenBody")}</AlertDescription>
            </div>
          </Alert>
        )}

        {isError && (
          <Alert variant="danger">
            <ShieldAlert />
            <div>
              <AlertTitle>{t("custodyScreen.list.loadFailed")}</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : t("custodyScreen.list.noResponse")}
                <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                  {t("common.retry")}
                </Button>
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label={t("custodyScreen.list.statItems")} value={stats.data?.total ?? 0} icon={ShieldCheck} />
          <StatTile label={t("custodyScreen.list.statWithFile")} value={stats.data?.withFile ?? 0} icon={HardDrive} />
          <StatTile
            label={t("custodyScreen.list.statVerified")}
            value={stats.data?.verified ?? 0}
            icon={ShieldCheck}
            tone="success"
          />
          <StatTile
            label={t("custodyScreen.list.statPending")}
            value={stats.data?.pending ?? 0}
            icon={ShieldQuestion}
            tone="warning"
          />
          <StatTile
            label={t("custodyScreen.list.statBroken")}
            value={stats.data?.broken ?? 0}
            icon={ShieldAlert}
            tone="danger"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : items.length === 0 && !isError ? (
          <EmptyState
            title={t("custodyScreen.list.emptyTitle")}
            description={t("custodyScreen.list.emptyBody")}
            icon={FileUp}
            action={
              <Button onClick={() => setRegisterOpen(true)}>
                <FileUp className="h-4 w-4" />
                {t("custodyScreen.register.title")}
              </Button>
            }
          />
        ) : (
          <DataTable
            rows={items}
            columns={columns}
            rowKey={(e) => e.id}
            rowHref={(e) => `/custody/${e.id}`}
            rowActions={rowActions}
            searchPlaceholder={t("custodyScreen.list.search")}
          />
        )}
      </div>

      <RegisterEvidenceDialog
        preset={preset}
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onRegistered={(id) => {
          qc.invalidateQueries({ queryKey: custodyKeys.all });
          setRegisterOpen(false);
          router.push(`/custody/${id}`);
        }}
      />
    </DashboardLayout>
  );
}

function RegisterEvidenceDialog({
  preset,
  open,
  onOpenChange,
  onRegistered,
}: {
  preset: { caseId?: string; firId?: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered: (id: string) => void;
}) {
  const { t } = useI18n();
  const [description, setDescription] = React.useState("");
  const [evidenceType, setEvidenceType] = React.useState<EvidenceType>("DIGITAL");
  const [collectionLocation, setCollectionLocation] = React.useState("");
  const [storageLocation, setStorageLocation] = React.useState("");
  const [sealNumber, setSealNumber] = React.useState("");
  const [link, setLink] = React.useState<RecordLink | null>(null);
  const [pending, setPending] = React.useState(false);
  const [failure, setFailure] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setDescription("");
      setEvidenceType("DIGITAL");
      setCollectionLocation("");
      setStorageLocation("");
      setSealNumber("");
      setFailure(null);
      setLink(null);
    }
  }, [open]);

  // Resolve a preset case or FIR to a labelled link.
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        if (preset.caseId) {
          const c = await casesApi.get(preset.caseId);
          if (!cancelled)
            setLink({
              kind: "case",
              id: c.id,
              firId: c.firId,
              label: [c.caseNumber, c.firNumber && `FIR ${c.firNumber}`, c.title].filter(Boolean).join(" · "),
            });
        } else if (preset.firId) {
          const f = await firsApi.get(preset.firId);
          if (!cancelled) setLink({ kind: "fir", id: f.id, label: `FIR ${f.firNumber} · ${f.complainantName}` });
        }
      } catch {
        // An unknown preset leaves the picker open for the officer to choose.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, preset.caseId, preset.firId]);

  const submit = async () => {
    setPending(true);
    setFailure(null);
    try {
      const created = await custodyApi.register({
        description: description.trim(),
        evidenceType,
        collectionLocation: collectionLocation.trim() || undefined,
        storageLocation: storageLocation.trim() || undefined,
        sealNumber: sealNumber.trim() || undefined,
        caseId: link?.kind === "case" ? link.id : undefined,
        firId: link?.kind === "case" ? link.firId || undefined : link?.id,
      });
      onRegistered(created.id);
    } catch (e) {
      setFailure(e instanceof Error ? e.message : t("custodyScreen.register.failed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("custodyScreen.register.title")}</DialogTitle>
          <DialogDescription>{t("custodyScreen.register.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>{t("custodyScreen.register.link")}</Label>
            <RecordLinkPicker value={link} onChange={setLink} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ev-desc">{t("custodyScreen.register.itemDescription")}</Label>
            <Textarea
              id="ev-desc"
              rows={2}
              value={description}
              onChange={(v: string) => setDescription(v)}
              placeholder={t("custodyScreen.register.itemDescriptionPlaceholder")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ev-type">{t("custodyScreen.register.type")}</Label>
            <select
              id="ev-type"
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {EVIDENCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`custodyScreen.types.${type}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="ev-where">{t("custodyScreen.register.collectedAt")}</Label>
              <Input id="ev-where" value={collectionLocation} onChange={(v: string) => setCollectionLocation(v)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ev-store">{t("custodyScreen.register.storage")}</Label>
              <Input
                id="ev-store"
                value={storageLocation}
                onChange={(v: string) => setStorageLocation(v)}
                placeholder={t("custodyScreen.register.storagePlaceholder")}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ev-seal">{t("custodyScreen.register.seal")}</Label>
            <Input id="ev-seal" value={sealNumber} onChange={(v: string) => setSealNumber(v)} />
          </div>

          {failure && (
            <p
              role="alert"
              className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-xs text-danger"
            >
              {failure}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!description.trim() || !link || pending} isLoading={pending} onClick={submit}>
            {t("custodyScreen.register.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
