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
import type { EvidenceRecord, IntegrityState } from "@/lib/api/custody";
import { useCustodyStats, useEvidenceRegister } from "@/hooks/use-custody";
import { evidenceApi, type EvidenceType } from "@/lib/api/evidence-register";
import { DataTable, type Column } from "@/components/platform/data-table";
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

/**
 * Integrity is shown with three distinct states, never two. "Not yet checked"
 * must never be presented as "intact".
 */
export function IntegrityBadge({ state }: { state: IntegrityState }) {
  if (state === "verified") {
    return (
      <StatusPill tone="success">
        <ShieldCheck className="h-3 w-3" />
        Hash verified
      </StatusPill>
    );
  }
  if (state === "broken") {
    return (
      <StatusPill tone="danger">
        <ShieldAlert className="h-3 w-3" />
        Integrity mismatch
      </StatusPill>
    );
  }
  return (
    <StatusPill tone="warning">
      <ShieldQuestion className="h-3 w-3" />
      Not yet verified
    </StatusPill>
  );
}

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
      header: "Evidence",
      sortValue: (e) => e.evidenceNumber,
      cell: (e) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{e.description}</p>
          <p className="mt-0.5 font-mono text-xs text-foreground-subtle">{e.evidenceNumber}</p>
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      hideBelow: "sm",
      sortValue: (e) => e.evidenceType,
      cell: (e) => <StatusPill>{e.evidenceType}</StatusPill>,
    },
    {
      id: "file",
      header: "File",
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
          <span className="text-xs text-foreground-subtle">No file attached</span>
        ),
    },
    {
      id: "custody",
      header: "Held by",
      hideBelow: "md",
      sortValue: (e) => e.currentHolder ?? "",
      cell: (e) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{e.currentHolder || "—"}</p>
          <p className="text-xs text-foreground-subtle">
            {e.transferCount} {e.transferCount === 1 ? "movement" : "movements"}
          </p>
        </div>
      ),
    },
    {
      id: "integrity",
      header: "Integrity",
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
    act.link("open", "Open evidence record", `/custody/${e.id}`, { icon: ShieldCheck }),
    act.link("chain", "Chain of custody", `/custody/${e.id}?tab=custody`, { icon: ArrowLeftRight }),
    act.link("access", "Access log", `/custody/${e.id}?tab=access`, { icon: Fingerprint }),
    act.sep("s1"),
    act.link("verify", "Verify integrity", `/custody/${e.id}?verify=1`, { icon: ScanLine }),
    act.link("court", "Court verification", `/custody/${e.id}?tab=court`, { icon: FileCheck2 }),
    act.sep("s2"),
    act.link("malkhana", "Seized property register", "/malkhana", { icon: ClipboardList }),
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
                Malkhana
              </Button>
              <Button onClick={() => setRegisterOpen(true)}>
                <FileUp className="h-4 w-4" />
                Register evidence
              </Button>
            </>
          }
          menu={[
            act.link("investigation", "Investigation workspaces", "/investigation", {
              icon: ClipboardList,
            }),
            act.link("audit", "Platform audit trail", "/audit", { icon: Fingerprint }),
          ]}
        />

        {broken > 0 && (
          <Alert variant="danger">
            <ShieldAlert />
            <div>
              <AlertTitle>
                {broken} {broken === 1 ? "item fails" : "items fail"} integrity verification
              </AlertTitle>
              <AlertDescription>
                The stored file no longer matches the digest recorded when it was registered. Open
                the record to see when the mismatch was first detected and who handled the item.
              </AlertDescription>
            </div>
          </Alert>
        )}

        {isError && (
          <Alert variant="danger">
            <ShieldAlert />
            <div>
              <AlertTitle>Could not load the evidence register</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "The API did not respond."}
                <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                  {t("common.retry")}
                </Button>
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label="Evidence items" value={stats.data?.total ?? 0} icon={ShieldCheck} />
          <StatTile label="With a file" value={stats.data?.withFile ?? 0} icon={HardDrive} />
          <StatTile
            label="Hash verified"
            value={stats.data?.verified ?? 0}
            icon={ShieldCheck}
            tone="success"
          />
          <StatTile
            label="Not yet verified"
            value={stats.data?.pending ?? 0}
            icon={ShieldQuestion}
            tone="warning"
          />
          <StatTile
            label="Integrity mismatch"
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
        ) : items.length === 0 ? (
          <EmptyState
            title="The evidence register is empty"
            description="Register an item, then attach its file. The digest is taken as the file is stored, and every later check compares against it."
            icon={FileUp}
            action={
              <Button onClick={() => setRegisterOpen(true)}>
                <FileUp className="h-4 w-4" />
                Register evidence
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
            searchPlaceholder="Search by evidence number, description or seal…"
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
      const created = await evidenceApi.create({
        description: description.trim(),
        evidenceType,
        collectionLocation: collectionLocation.trim() || undefined,
        storageLocation: storageLocation.trim() || undefined,
        sealNumber: sealNumber.trim() || undefined,
        status: "IN_CUSTODY",
        caseId: link?.kind === "case" ? link.id : undefined,
        firId: link?.kind === "case" ? link.firId || undefined : link?.id,
      });
      onRegistered(created.id);
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register evidence</DialogTitle>
          <DialogDescription>
            Creates the register entry. Attach the file on the next screen — its SHA-256 is computed
            as it is stored.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Case or FIR</Label>
            <RecordLinkPicker value={link} onChange={setLink} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ev-desc">Description</Label>
            <Textarea
              id="ev-desc"
              rows={2}
              value={description}
              onChange={(v: string) => setDescription(v)}
              placeholder="What the item is"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ev-type">Type</Label>
            <select
              id="ev-type"
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
              className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="DIGITAL">Digital</option>
              <option value="DOCUMENTARY">Documentary</option>
              <option value="PHYSICAL">Physical</option>
              <option value="BIOLOGICAL">Biological</option>
              <option value="TRACE">Trace</option>
              <option value="TESTIMONIAL">Testimonial</option>
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="ev-where">Place of collection</Label>
              <Input
                id="ev-where"
                value={collectionLocation}
                onChange={(v: string) => setCollectionLocation(v)
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ev-store">Storage location</Label>
              <Input
                id="ev-store"
                value={storageLocation}
                onChange={(v: string) => setStorageLocation(v)
                }
                placeholder="e.g. Malkhana — Bhowanipore PS"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ev-seal">Seal number</Label>
            <Input
              id="ev-seal"
              value={sealNumber}
              onChange={(v: string) => setSealNumber(v)}
            />
          </div>

          {failure && (
            <p className="rounded-md border border-danger/25 bg-danger-subtle px-3 py-2 text-xs text-danger">
              {failure}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button disabled={!description.trim() || !link || pending} isLoading={pending} onClick={submit}>
            Register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
