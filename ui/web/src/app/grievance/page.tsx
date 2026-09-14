"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Copy,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Mic,
  Phone,
  Send,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { GRIEVANCES, type Grievance } from "@/lib/platform/mock";
import { DataTable, type Column } from "@/components/platform/data-table";
import { act, type Action } from "@/components/platform/actions";
import {
  Field,
  PageHeader,
  Panel,
  PhaseBadge,
  SeverityBadge,
  StatTile,
  StatusPill,
} from "@/components/platform/primitives";
import { AIBadge, AIGovernanceNotice, ConfidenceMeter } from "@/components/platform/governance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { RecordButton } from "@/components/platform/file-dropzone";

const CHANNEL_ICON = {
  web: Building2,
  mobile: Smartphone,
  whatsapp: MessageSquare,
  email: Mail,
  "call-centre": Phone,
  counter: Building2,
} as const;

const STATUS_TONE = {
  received: "neutral",
  assigned: "info",
  "under-review": "warning",
  "action-taken": "success",
  closed: "neutral",
} as const;

export default function GrievancePage() {
  const router = useRouter();
  const { t, pick } = useI18n();

  const [intakeOpen, setIntakeOpen] = React.useState(false);
  const [replyFor, setReplyFor] = React.useState<Grievance | null>(null);
  const [routeFor, setRouteFor] = React.useState<Grievance | null>(null);
  const [sheetFor, setSheetFor] = React.useState<Grievance | null>(null);

  const open = GRIEVANCES.filter((g) => g.status !== "closed").length;
  const bengali = GRIEVANCES.filter((g) => g.language !== "en").length;
  const duplicates = GRIEVANCES.filter((g) => g.duplicateOf).length;
  const urgent = GRIEVANCES.filter((g) => g.priority === "critical" || g.priority === "high").length;

  const columns: Column<Grievance>[] = [
    {
      id: "grievance",
      header: "Complaint",
      sortValue: (g) => g.ref,
      cell: (g) => {
        const Icon = CHANNEL_ICON[g.channel];
        return (
          <div className="flex min-w-0 items-start gap-2.5">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground-subtle" />
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground">{pick(g.summary)}</p>
              <p className="mt-0.5 font-mono text-xs text-foreground-subtle">
                {g.ref} · {pick(g.citizen)}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "category",
      header: "Category",
      hideBelow: "md",
      sortValue: (g) => g.category.en,
      cell: (g) => (
        <div className="flex items-center gap-1.5">
          <StatusPill>{pick(g.category)}</StatusPill>
          <AIBadge confidence={g.aiConfidence} compact />
        </div>
      ),
    },
    {
      id: "locality",
      header: "Locality",
      hideBelow: "lg",
      sortValue: (g) => g.locality.en,
      cell: (g) => (
        <div>
          <p className="text-sm">{pick(g.locality)}</p>
          <p className="text-xs text-foreground-subtle">{g.routedTo}</p>
        </div>
      ),
    },
    {
      id: "priority",
      header: "Priority",
      sortValue: (g) => g.priority,
      cell: (g) => <SeverityBadge level={g.priority} />,
    },
    {
      id: "status",
      header: "Status",
      sortValue: (g) => g.status,
      cell: (g) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill tone={STATUS_TONE[g.status]}>{g.status}</StatusPill>
          {g.duplicateOf && (
            <StatusPill tone="warning">
              <Copy className="h-3 w-3" />
              Duplicate
            </StatusPill>
          )}
        </div>
      ),
    },
  ];

  const rowActions = (g: Grievance): Action[] => [
    act.label("h", g.ref),
    act.run("open", "Open complaint", () => setSheetFor(g), { icon: Megaphone }),
    act.run("reply", "Draft response", () => setReplyFor(g), { icon: Send }),
    act.run("route", "Change jurisdiction", () => setRouteFor(g), { icon: MapPin }),
    act.sep("s1"),
    act.link("fir", "Register an FIR from this", "/fir/new", { icon: Building2 }),
    act.link("hotspot", "View locality hotspot", "/risk-intelligence", { icon: TrendingUp }),
    ...(g.duplicateOf
      ? [act.link("orig", `Open original ${g.duplicateOf}`, "/grievance", { icon: Copy })]
      : []),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.grievance")}
          description={t("modules.grievanceDesc")}
          icon={Megaphone}
          badge={<PhaseBadge phase={9} />}
          breadcrumb={[{ label: t("nav.citizenGroup") }, { label: t("modules.grievance") }]}
          actions={
            <Button onClick={() => setIntakeOpen(true)}>
              <Mic className="h-4 w-4" />
              Record complaint
            </Button>
          }
          menu={[
            act.link("portal", "Citizen portal", "/citizen", { icon: Building2 }),
            act.link("hotspots", "Complaint hotspots", "/risk-intelligence", { icon: TrendingUp }),
            act.link("rti", "RTI requests", "/rti", { icon: Mail }),
          ]}
        />

        {duplicates > 0 && (
          <Alert variant="info">
            <Copy />
            <div>
              <AlertTitle>{duplicates} probable duplicate complaint(s) detected</AlertTitle>
              <AlertDescription>
                Multiple complaints appear to describe the same incident. Merging keeps the citizen
                updated on one thread instead of several.
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Open complaints" value={open} icon={Megaphone} tone="warning" />
          <StatTile label="Urgent or high" value={urgent} icon={TrendingUp} tone="danger" />
          <StatTile label="In Bengali or mixed" value={bengali} icon={MessageSquare} tone="info" />
          <StatTile label="Probable duplicates" value={duplicates} icon={Copy} />
        </div>

        <AIGovernanceNotice />

        <DataTable
          rows={GRIEVANCES}
          columns={columns}
          rowKey={(g) => g.id}
          onRowSelect={(g) => setSheetFor(g)}
          rowActions={rowActions}
          searchPlaceholder="Search by reference, citizen, category or locality…"
        />
      </div>

      {/* intake */}
      <Dialog open={intakeOpen} onOpenChange={setIntakeOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Record a complaint</DialogTitle>
            <DialogDescription>
              Speak or type in Bengali, English or a mix. Category, locality and jurisdiction are
              suggested and confirmed by the officer at the counter.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="flex items-center gap-2 rounded-md border border-border bg-surface-sunken px-3 py-2.5">
              <RecordButton />
              <span className="text-xs text-foreground-muted">
                বাংলা / English / mixed speech supported
              </span>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="gr-text">Complaint</Label>
              <Textarea
                id="gr-text"
                rows={4}
                defaultValue="প্রতি সন্ধ্যায় বেআইনি পার্ক করা লরি রাস্তা আটকে রাখছে।"
                className="font-bengali"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="gr-cat">Suggested category</Label>
                <Input id="gr-cat" defaultValue="Traffic obstruction" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="gr-ps">Suggested jurisdiction</Label>
                <Input id="gr-ps" defaultValue="Ultadanga PS" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-[var(--ai-border)] bg-ai-subtle px-3 py-2">
              <AIBadge model="complaint-triage" />
              <ConfidenceMeter value={0.89} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIntakeOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => setIntakeOpen(false)}>Create complaint</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* reply */}
      <Dialog open={replyFor !== null} onOpenChange={(o) => !o && setReplyFor(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Draft response to citizen</DialogTitle>
            <DialogDescription>
              {replyFor ? `${replyFor.ref} · ${pick(replyFor.citizen)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="flex items-center justify-between rounded-md border border-[var(--ai-border)] bg-ai-subtle px-3 py-2">
              <AIBadge model="response-drafter" />
              <span className="text-xs text-foreground-muted">
                Draft only — an officer approves before sending
              </span>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="gr-reply">Response</Label>
              <Textarea
                id="gr-reply"
                rows={5}
                className="font-bengali"
                defaultValue={
                  "আপনার অভিযোগটি সংশ্লিষ্ট থানায় পাঠানো হয়েছে। একজন আধিকারিক সাত দিনের মধ্যে এলাকা পরিদর্শন করবেন এবং প্রয়োজনীয় ব্যবস্থা নেবেন। অভিযোগ নম্বরটি সংরক্ষণ করুন।"
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => setReplyFor(null)}>
              <Send className="h-4 w-4" />
              Approve and send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* route */}
      <Dialog open={routeFor !== null} onOpenChange={(o) => !o && setRouteFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change jurisdiction</DialogTitle>
            <DialogDescription>
              {routeFor ? `${routeFor.ref} · currently ${routeFor.routedTo}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="gr-newps">Route to</Label>
              <Input id="gr-newps" placeholder="Police station or specialised unit" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="gr-why">Reason</Label>
              <Textarea id="gr-why" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRouteFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => setRouteFor(null)}>Reroute</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* detail sheet */}
      <Sheet open={sheetFor !== null} onOpenChange={(o) => !o && setSheetFor(null)}>
        <SheetContent className="w-[32rem]">
          {sheetFor && (
            <>
              <SheetHeader>
                <SheetTitle>{pick(sheetFor.category)}</SheetTitle>
                <SheetDescription>
                  {sheetFor.ref} · {pick(sheetFor.citizen)}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
                <p className={`text-sm text-foreground ${sheetFor.language !== "en" ? "font-bengali" : ""}`}>
                  {pick(sheetFor.summary)}
                </p>

                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Channel" value={sheetFor.channel} />
                  <Field label="Language" value={sheetFor.language} />
                  <Field label="Locality" value={pick(sheetFor.locality)} />
                  <Field label="Routed to" value={sheetFor.routedTo} />
                  <Field label="Priority" value={<SeverityBadge level={sheetFor.priority} />} />
                  <Field
                    label="Status"
                    value={<StatusPill tone={STATUS_TONE[sheetFor.status]}>{sheetFor.status}</StatusPill>}
                  />
                  <Field
                    label="Received"
                    value={new Date(sheetFor.receivedAt).toLocaleString("en-IN")}
                    className="col-span-2"
                  />
                </dl>

                <div className="rounded-md border border-[var(--ai-border)] bg-ai-subtle p-3">
                  <div className="flex items-center justify-between">
                    <AIBadge model="complaint-triage" />
                    <ConfidenceMeter value={sheetFor.aiConfidence} />
                  </div>
                  <p className="mt-2 text-xs text-foreground-muted">
                    Category and jurisdiction were suggested from the complaint text and the
                    extracted locality. An officer confirmed the routing.
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground-subtle">
                    Citizen-visible status
                  </p>
                  <ol className="mt-2 flex flex-col gap-2">
                    {["received", "assigned", "under-review", "action-taken", "closed"].map((s) => {
                      const order = ["received", "assigned", "under-review", "action-taken", "closed"];
                      const reached = order.indexOf(s) <= order.indexOf(sheetFor.status);
                      return (
                        <li key={s} className="flex items-center gap-2 text-sm">
                          <CheckCircle2
                            className={`h-4 w-4 ${reached ? "text-success" : "text-foreground-subtle"}`}
                          />
                          <span className={reached ? "text-foreground" : "text-foreground-subtle"}>
                            {s}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={() => { setReplyFor(sheetFor); setSheetFor(null); }}>
                    <Send className="h-4 w-4" />
                    Draft response
                  </Button>
                  <Button variant="outline" onClick={() => { setRouteFor(sheetFor); setSheetFor(null); }}>
                    <MapPin className="h-4 w-4" />
                    Change jurisdiction
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/fir/new")}>
                    <Building2 className="h-4 w-4" />
                    Register an FIR from this
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
