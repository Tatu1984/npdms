"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BatteryLow,
  Camera,
  CloudUpload,
  FileAudio,
  HardDrive,
  Link2,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { BODYCAMS, BODYCAM_CLIPS, type BodycamClip, type BodycamDevice } from "@/lib/platform/mock";
import { DataTable, type Column } from "@/components/platform/data-table";
import { act, type Action } from "@/components/platform/actions";
import {
  Field,
  PageHeader,
  PhaseBadge,
  StatTile,
  StatusPill,
} from "@/components/platform/primitives";
import { ChainAnchorChip, IntegrityBadge, AIBadge } from "@/components/platform/governance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const TRANSCRIPT = [
  { at: "00:14", speaker: "Officer", text: "I am recording this interaction. Please state your name." },
  { at: "00:19", speaker: "Citizen", text: "Rafiqul Sk." },
  { at: "00:41", speaker: "Officer", text: "I am seizing this handset in connection with case 0412 of 2024." },
  { at: "01:02", speaker: "Witness", text: "I saw the officer take the phone from the table." },
  { at: "02:37", speaker: "Officer", text: "Seizure list prepared and signed by the witness." },
];

export default function BodycamPage() {
  const router = useRouter();
  const { t, pick } = useI18n();

  const [tab, setTab] = React.useState("clips");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [clipSheet, setClipSheet] = React.useState<BodycamClip | null>(null);
  const [assignFor, setAssignFor] = React.useState<BodycamDevice | null>(null);
  const [linkFor, setLinkFor] = React.useState<BodycamClip | null>(null);
  const [queuedForTranscription, setQueuedForTranscription] = React.useState<string[]>([]);

  const faults = BODYCAMS.filter((d) => d.status === "fault");
  const pendingClips = BODYCAMS.reduce((s, d) => s + d.pendingClips, 0);
  const inField = BODYCAMS.filter((d) => d.status === "in-field").length;

  const clipColumns: Column<BodycamClip>[] = [
    {
      id: "clip",
      header: "Recording",
      sortValue: (c) => c.clipId,
      cell: (c) => (
        <div className="min-w-0">
          <p className="font-mono text-sm text-foreground">{c.clipId}</p>
          <p className="mt-0.5 truncate text-xs text-foreground-subtle">
            {pick(c.officer)} · {c.device}
          </p>
        </div>
      ),
    },
    {
      id: "when",
      header: "Recorded",
      hideBelow: "sm",
      sortValue: (c) => c.recordedAt,
      cell: (c) => (
        <div>
          <p className="text-sm">
            {new Date(c.recordedAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          <p className="text-xs text-foreground-subtle">{c.durationMin} min</p>
        </div>
      ),
    },
    {
      id: "case",
      header: "Case",
      hideBelow: "lg",
      sortValue: (c) => c.caseRef ?? "",
      cell: (c) =>
        c.caseRef ? (
          <span className="font-mono text-xs">{c.caseRef}</span>
        ) : (
          <StatusPill tone="warning">Unlinked</StatusPill>
        ),
    },
    {
      id: "events",
      header: "Detected events",
      hideBelow: "md",
      sortValue: (c) => c.events.length,
      cell: (c) =>
        c.events.length === 0 ? (
          <span className="text-xs text-foreground-subtle">—</span>
        ) : (
          <div className="flex flex-wrap items-center gap-1">
            {c.events.map((e, i) => (
              <StatusPill key={i} tone="ai">
                {pick(e)}
              </StatusPill>
            ))}
            <AIBadge compact />
          </div>
        ),
    },
    {
      id: "integrity",
      header: "Integrity",
      sortValue: (c) => c.integrity,
      cell: (c) => (
        <div className="flex flex-col items-start gap-1">
          <IntegrityBadge state={c.integrity} hash={c.hash} block={c.block} />
          {c.block && <ChainAnchorChip block={c.block} />}
        </div>
      ),
    },
    {
      id: "retention",
      header: "Retention",
      hideBelow: "lg",
      sortValue: (c) => c.retention,
      cell: (c) => (
        <StatusPill tone={c.retention === "court-hold" ? "danger" : c.retention === "evidence" ? "info" : "neutral"}>
          {c.retention}
        </StatusPill>
      ),
    },
  ];

  const clipActions = (c: BodycamClip): Action[] => [
    act.label("h", c.clipId),
    act.run("play", "Open recording", () => setClipSheet(c), { icon: Camera }),
    act.run("link", c.caseRef ? "Change case association" : "Associate with a case", () => setLinkFor(c), {
      icon: Link2,
    }),
    act.sep("s1"),
    act.link("custody", "Evidence custody record", "/custody", { icon: ShieldCheck }),
    act.link("audit", "Access log", "/audit", { icon: Lock }),
  ];

  const deviceColumns: Column<BodycamDevice>[] = [
    {
      id: "device",
      header: "Device",
      sortValue: (d) => d.deviceId,
      cell: (d) => (
        <div className="min-w-0">
          <p className="font-mono text-sm text-foreground">{d.deviceId}</p>
          <p className="mt-0.5 truncate text-xs text-foreground-subtle">
            {pick(d.assignedTo)} · {d.station} PS
          </p>
        </div>
      ),
    },
    {
      id: "battery",
      header: "Battery",
      hideBelow: "sm",
      sortValue: (d) => d.battery,
      cell: (d) => (
        <span
          className={`tabular text-sm ${d.battery < 20 ? "text-danger" : "text-foreground"}`}
        >
          {d.battery}%
        </span>
      ),
    },
    {
      id: "storage",
      header: "Storage used",
      hideBelow: "md",
      sortValue: (d) => d.storageUsedPct,
      cell: (d) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full"
              style={{
                width: `${d.storageUsedPct}%`,
                background: d.storageUsedPct > 80 ? "var(--danger)" : "var(--accent)",
              }}
            />
          </div>
          <span className="tabular text-xs text-foreground-muted">{d.storageUsedPct}%</span>
        </div>
      ),
    },
    {
      id: "firmware",
      header: "Firmware",
      hideBelow: "lg",
      sortValue: (d) => d.firmware,
      cell: (d) => <span className="font-mono text-xs">{d.firmware}</span>,
    },
    {
      id: "pending",
      header: "Pending upload",
      align: "right",
      sortValue: (d) => d.pendingClips,
      cell: (d) =>
        d.pendingClips > 0 ? (
          <StatusPill tone="warning">
            <CloudUpload className="h-3 w-3" />
            {d.pendingClips}
          </StatusPill>
        ) : (
          <span className="text-xs text-foreground-subtle">—</span>
        ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (d) => d.status,
      cell: (d) => (
        <StatusPill
          tone={
            d.status === "fault"
              ? "danger"
              : d.status === "in-field"
                ? "info"
                : d.status === "docked"
                  ? "success"
                  : "neutral"
          }
        >
          {d.status}
        </StatusPill>
      ),
    },
  ];

  const deviceActions = (d: BodycamDevice): Action[] => [
    act.label("h", d.deviceId),
    act.run("assign", "Assign to officer", () => setAssignFor(d), { icon: Camera }),
    act.link("clips", "Recordings from this device", "/bodycam", { icon: FileAudio }),
    act.sep("s"),
    act.link("maintenance", "Raise maintenance request", "/armoury", { icon: Wrench }),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.bodycam")}
          description={t("modules.bodycamDesc")}
          icon={Camera}
          badge={<PhaseBadge phase={13} />}
          breadcrumb={[{ label: t("nav.surveillanceGroup") }, { label: t("modules.bodycam") }]}
          actions={
            <Button onClick={() => setSearchOpen(true)}>
              <Sparkles className="h-4 w-4" />
              Search recordings
            </Button>
          }
          menu={[
            act.link("custody", "Evidence custody ledger", "/custody", { icon: ShieldCheck }),
            act.link("retention", "Retention policy", "/settings", { icon: HardDrive }),
            act.link("audit", "Access audit", "/audit", { icon: Lock }),
          ]}
        />

        {faults.length > 0 && (
          <Alert variant="warning">
            <TriangleAlert />
            <div>
              <AlertTitle>
                {faults.length} device{faults.length === 1 ? "" : "s"} reporting a fault
              </AlertTitle>
              <AlertDescription>
                {faults.map((d) => d.deviceId).join(", ")} — recordings on a faulty device are not
                uploaded until it is serviced.
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Devices" value={BODYCAMS.length} icon={Camera} />
          <StatTile label="In field" value={inField} icon={Camera} tone="info" />
          <StatTile label="Pending upload" value={pendingClips} icon={CloudUpload} tone="warning" />
          <StatTile label="Faults" value={faults.length} icon={BatteryLow} tone="danger" />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="clips">Recordings ({BODYCAM_CLIPS.length})</TabsTrigger>
            <TabsTrigger value="devices">Devices ({BODYCAMS.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="clips">
            <DataTable
              rows={BODYCAM_CLIPS}
              columns={clipColumns}
              rowKey={(c) => c.id}
              onRowSelect={(c) => setClipSheet(c)}
              rowActions={clipActions}
              searchPlaceholder="Search by clip ID, officer, device or case…"
            />
          </TabsContent>

          <TabsContent value="devices">
            <DataTable
              rows={BODYCAMS}
              columns={deviceColumns}
              rowKey={(d) => d.id}
              onRowSelect={(d) => setAssignFor(d)}
              rowActions={deviceActions}
              searchPlaceholder="Search by device ID, officer or station…"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* search */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search recordings</DialogTitle>
            <DialogDescription>
              Searches transcripts and detected events, not raw video.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="bc-q">Query</Label>
              <Input id="bc-q" defaultValue="mention of vehicle number WB-02-AK-4471" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="bc-from">From</Label>
                <Input id="bc-from" type="date" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bc-to">To</Label>
                <Input id="bc-to" type="date" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bc-purpose">Purpose</Label>
              <Input id="bc-purpose" placeholder="Case number or authorisation reference" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSearchOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => { setSearchOpen(false); setClipSheet(BODYCAM_CLIPS[0]); }}>
              <Search className="h-4 w-4" />
              Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* assign device */}
      <Dialog open={assignFor !== null} onOpenChange={(o) => !o && setAssignFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign device</DialogTitle>
            <DialogDescription>{assignFor?.deviceId}</DialogDescription>
          </DialogHeader>
          {assignFor && (
            <div className="grid gap-3">
              <dl className="grid grid-cols-2 gap-3">
                <Field label="Currently assigned" value={pick(assignFor.assignedTo)} />
                <Field label="Station" value={`${assignFor.station} PS`} />
                <Field label="Battery" value={`${assignFor.battery}%`} />
                <Field label="Storage used" value={`${assignFor.storageUsedPct}%`} />
              </dl>
              <div className="grid gap-1.5">
                <Label htmlFor="bd-officer">Assign to</Label>
                <Input id="bd-officer" placeholder="Officer name or badge number" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bd-shift">Shift</Label>
                <Input id="bd-shift" placeholder="e.g. 14:00–22:00" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => setAssignFor(null)}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* associate clip with case */}
      <Dialog open={linkFor !== null} onOpenChange={(o) => !o && setLinkFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Associate recording with a case</DialogTitle>
            <DialogDescription>{linkFor?.clipId}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="bl-case">Case or FIR number</Label>
              <Input id="bl-case" defaultValue={linkFor?.caseRef ?? ""} placeholder="e.g. PS-BHW/2024/0412" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bl-retention">Retention class</Label>
              <Input id="bl-retention" defaultValue={linkFor?.retention ?? "standard"} />
            </div>
            <p className="text-xs text-foreground-muted">
              Associating a recording with a case moves it to evidence retention and anchors its hash
              in the custody ledger.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => { setLinkFor(null); router.push("/custody"); }}>
              Associate and anchor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* clip sheet */}
      <Sheet open={clipSheet !== null} onOpenChange={(o) => !o && setClipSheet(null)}>
        <SheetContent className="w-[34rem]">
          {clipSheet && (
            <>
              <SheetHeader>
                <SheetTitle>{clipSheet.clipId}</SheetTitle>
                <SheetDescription>
                  {pick(clipSheet.officer)} · {clipSheet.durationMin} min
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
                <div className="flex aspect-video items-center justify-center rounded-lg border border-border ops-grid">
                  <Camera className="h-8 w-8 text-foreground-subtle" />
                </div>

                <div className="flex items-center justify-between">
                  <IntegrityBadge state={clipSheet.integrity} hash={clipSheet.hash} block={clipSheet.block} showHash />
                  <StatusPill tone={clipSheet.retention === "evidence" ? "info" : "neutral"}>
                    {clipSheet.retention}
                  </StatusPill>
                </div>

                {clipSheet.transcribed ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-foreground-subtle">
                        Transcript
                      </p>
                      <AIBadge confidence={0.88} model="speech-to-text" compact />
                    </div>
                    <ol className="mt-2 flex flex-col gap-2">
                      {TRANSCRIPT.map((line) => (
                        <li key={line.at} className="flex gap-3 text-sm">
                          <span className="w-12 shrink-0 font-mono text-xs text-foreground-subtle">
                            {line.at}
                          </span>
                          <span>
                            <span className="font-medium text-foreground">{line.speaker}: </span>
                            <span className="text-foreground-muted">{line.text}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-border p-4 text-center text-sm text-foreground-muted">
                    {queuedForTranscription.includes(clipSheet.id) ? (
                      <span className="flex items-center justify-center gap-2 text-info">
                        <FileAudio className="h-4 w-4" />
                        Queued for transcription
                      </span>
                    ) : (
                      <>
                        Not yet transcribed.
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() =>
                            setQueuedForTranscription((prev) => [...prev, clipSheet.id])
                          }
                        >
                          <FileAudio className="h-3.5 w-3.5" />
                          Queue for transcription
                        </Button>
                      </>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => { setLinkFor(clipSheet); setClipSheet(null); }}>
                    <Link2 className="h-4 w-4" />
                    {clipSheet.caseRef ? "Change case association" : "Associate with a case"}
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/custody")}>
                    <ShieldCheck className="h-4 w-4" />
                    Open evidence record
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
