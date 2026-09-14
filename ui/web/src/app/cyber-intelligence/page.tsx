"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Building2,
  FileUp,
  Globe,
  IndianRupee,
  Landmark,
  Link2,
  Network,
  Phone,
  Snowflake,
  Users,
  Wallet,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { FRAUD_CASES, MULE_ACCOUNTS, type FraudCase, type MuleAccount } from "@/lib/platform/mock";
import { DataTable, type Column } from "@/components/platform/data-table";
import { act, ActionMenu, type Action } from "@/components/platform/actions";
import {
  Field,
  PageHeader,
  Panel,
  PhaseBadge,
  StatTile,
  StatusPill,
} from "@/components/platform/primitives";
import { AIBadge, AIGovernanceNotice, ConfidenceMeter } from "@/components/platform/governance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const inr = (n: number) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function CyberIntelligencePage() {
  const router = useRouter();
  const { t, pick } = useI18n();

  const [tab, setTab] = React.useState("cases");
  const [intakeOpen, setIntakeOpen] = React.useState(false);
  const [freezeFor, setFreezeFor] = React.useState<MuleAccount | null>(null);
  const [caseSheet, setCaseSheet] = React.useState<FraudCase | null>(null);

  const totalLoss = FRAUD_CASES.reduce((s, c) => s + c.lossAmount, 0);
  const totalRecovered = FRAUD_CASES.reduce((s, c) => s + c.recovered, 0);
  const totalFrozen = FRAUD_CASES.reduce((s, c) => s + c.frozen, 0);
  const victims = FRAUD_CASES.reduce((s, c) => s + c.linkedVictims, 0);

  const caseColumns: Column<FraudCase>[] = [
    {
      id: "ref",
      header: "Complaint",
      sortValue: (c) => c.refNumber,
      cell: (c) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{pick(c.modus)}</p>
          <p className="mt-0.5 font-mono text-xs text-foreground-subtle">
            {c.refNumber} · {pick(c.complainant)}
          </p>
        </div>
      ),
    },
    {
      id: "loss",
      header: "Loss",
      align: "right",
      sortValue: (c) => c.lossAmount,
      cell: (c) => <span className="tabular text-sm font-medium">{inr(c.lossAmount)}</span>,
    },
    {
      id: "recovered",
      header: "Recovered / frozen",
      align: "right",
      hideBelow: "md",
      sortValue: (c) => c.recovered + c.frozen,
      cell: (c) => (
        <div className="text-right">
          <p className="tabular text-sm text-success">{inr(c.recovered)}</p>
          <p className="tabular text-xs text-info">{inr(c.frozen)} frozen</p>
        </div>
      ),
    },
    {
      id: "entities",
      header: "Entities",
      hideBelow: "lg",
      sortValue: (c) => Object.values(c.entities).reduce((a, b) => a + b, 0),
      cell: (c) => (
        <div className="flex flex-wrap gap-1">
          <StatusPill><Phone className="h-3 w-3" />{c.entities.phones}</StatusPill>
          <StatusPill><Wallet className="h-3 w-3" />{c.entities.upi}</StatusPill>
          <StatusPill><Landmark className="h-3 w-3" />{c.entities.accounts}</StatusPill>
        </div>
      ),
    },
    {
      id: "victims",
      header: "Linked victims",
      align: "right",
      sortValue: (c) => c.linkedVictims,
      cell: (c) => (
        <StatusPill tone={c.linkedVictims > 8 ? "warning" : "neutral"}>
          <Users className="h-3 w-3" />
          {c.linkedVictims}
        </StatusPill>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (c) => c.status,
      cell: (c) => (
        <StatusPill
          tone={
            c.status === "chargesheet"
              ? "success"
              : c.status === "frozen"
                ? "info"
                : c.status === "tracing"
                  ? "warning"
                  : "neutral"
          }
        >
          {c.status}
        </StatusPill>
      ),
    },
  ];

  const caseActions = (c: FraudCase): Action[] => [
    act.label("h", c.refNumber),
    act.run("open", "Case summary", () => setCaseSheet(c), { icon: Globe }),
    act.link("graph", "Fraud network graph", `/cyber-intelligence?tab=graph`, { icon: Network }),
    act.link("money", "Money trail", `/cyber-intelligence?tab=accounts`, { icon: IndianRupee }),
    act.sep("s1"),
    act.link("investigation", "Investigation workspace", "/investigation", { icon: Link2 }),
    act.link("evidence", "Attached evidence", "/custody", { icon: FileUp }),
  ];

  const accountColumns: Column<MuleAccount>[] = [
    {
      id: "account",
      header: "Account",
      sortValue: (a) => a.account,
      cell: (a) => (
        <div className="min-w-0">
          <p className="font-mono text-sm text-foreground">{a.account}</p>
          <p className="mt-0.5 truncate text-xs text-foreground-subtle">
            {pick(a.holder)} · {a.bank}
          </p>
        </div>
      ),
    },
    {
      id: "flow",
      header: "In / out",
      align: "right",
      hideBelow: "sm",
      sortValue: (a) => a.inflow,
      cell: (a) => (
        <div className="text-right">
          <p className="tabular text-sm">{inr(a.inflow)}</p>
          <p className="tabular text-xs text-foreground-subtle">{inr(a.outflow)} out</p>
        </div>
      ),
    },
    {
      id: "victims",
      header: "Victims",
      align: "right",
      sortValue: (a) => a.victims,
      cell: (a) => <span className="tabular text-sm">{a.victims}</span>,
    },
    {
      id: "velocity",
      header: "Velocity",
      hideBelow: "md",
      sortValue: (a) => a.velocityScore,
      cell: (a) => <ConfidenceMeter value={a.velocityScore} showLabel={false} />,
    },
    {
      id: "flag",
      header: "Assessment",
      sortValue: (a) => a.flag,
      cell: (a) => (
        <div className="flex items-center gap-1.5">
          <StatusPill
            tone={a.flag === "confirmed" ? "danger" : a.flag === "probable" ? "warning" : "neutral"}
          >
            {a.flag} mule
          </StatusPill>
          <AIBadge compact />
        </div>
      ),
    },
  ];

  const accountActions = (a: MuleAccount): Action[] => [
    act.label("h", a.account),
    act.run("freeze", "Request account freeze", () => setFreezeFor(a), { icon: Snowflake }),
    act.link("graph", "Show in network graph", "/cyber-intelligence?tab=graph", { icon: Network }),
    act.sep("s"),
    act.link("bank", "Bank nodal contacts", "/inter-agency", { icon: Building2 }),
    act.link("case", "Link to investigation", "/investigation", { icon: Link2 }),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.cyberIntelligence")}
          description={t("modules.cyberIntelligenceDesc")}
          icon={Link2}
          badge={<PhaseBadge phase={5} />}
          breadcrumb={[
            { label: t("nav.investigationGroup") },
            { label: t("modules.cyberIntelligence") },
          ]}
          actions={
            <Button onClick={() => setIntakeOpen(true)}>
              <FileUp className="h-4 w-4" />
              Intake complaint
            </Button>
          }
          menu={[
            act.link("graph", "Network graph workspace", "/networks", { icon: Network }),
            act.link("agencies", "Inter-agency requests", "/inter-agency", { icon: Building2 }),
            act.link("ip", "IP and domain tracker", "/ip-tracker", { icon: Globe }),
          ]}
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Total reported loss" value={totalLoss / 100000} decimals={1} unit="lakh" icon={IndianRupee} tone="danger" />
          <StatTile label="Recovered" value={totalRecovered / 100000} decimals={1} unit="lakh" icon={Banknote} tone="success" />
          <StatTile label="Frozen" value={totalFrozen / 100000} decimals={1} unit="lakh" icon={Snowflake} tone="info" />
          <StatTile label="Linked victims" value={victims} icon={Users} tone="warning" />
        </div>

        <AIGovernanceNotice />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="cases">Complaints ({FRAUD_CASES.length})</TabsTrigger>
            <TabsTrigger value="graph">Fraud network</TabsTrigger>
            <TabsTrigger value="accounts">Mule accounts ({MULE_ACCOUNTS.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="cases">
            <DataTable
              rows={FRAUD_CASES}
              columns={caseColumns}
              rowKey={(c) => c.id}
              onRowSelect={(c) => setCaseSheet(c)}
              rowActions={caseActions}
              searchPlaceholder="Search by complaint number, complainant or modus…"
            />
          </TabsContent>

          <TabsContent value="graph">
            <Panel
              title="Fraud network"
              description="Victims, phones, UPI handles, accounts and infrastructure connected across complaints"
              menu={[
                act.link("full", "Open full graph workspace", "/networks", { icon: Network }),
                act.link("export", "Export for inter-agency request", "/inter-agency", {
                  icon: Building2,
                }),
              ]}
            >
              <FraudGraph />
              <p className="mt-3 text-xs text-foreground-muted">
                17 complaints across three police stations resolve to the same receiving
                infrastructure. Clustering is a lead for the investigating officer, not a finding.
              </p>
            </Panel>
          </TabsContent>

          <TabsContent value="accounts">
            <DataTable
              rows={MULE_ACCOUNTS}
              columns={accountColumns}
              rowKey={(a) => a.id}
              onRowSelect={(a) => setFreezeFor(a)}
              rowActions={accountActions}
              searchPlaceholder="Search by account number, holder or bank…"
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* intake */}
      <Dialog open={intakeOpen} onOpenChange={setIntakeOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Intake a cyber complaint</DialogTitle>
            <DialogDescription>
              Entities are extracted automatically from the complaint and any attachments. The
              officer confirms them before they enter the graph.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="cy-complaint">Complaint narrative</Label>
              <Textarea id="cy-complaint" rows={4} placeholder="In the complainant's words" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="cy-loss">Amount lost</Label>
                <Input id="cy-loss" type="number" placeholder="₹" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cy-date">Date of transaction</Label>
                <Input id="cy-date" type="date" />
              </div>
            </div>
            <div className="rounded-md border border-[var(--ai-border)] bg-ai-subtle px-3 py-2">
              <div className="flex items-center justify-between">
                <AIBadge model="entity-extractor" />
                <ConfidenceMeter value={0.86} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["9831-XXXX-42", "upi@okaxis", "XXXXXXXX4419", "secure-verify.in", "103.21.xx.xx"].map(
                  (e) => (
                    <span
                      key={e}
                      className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[0.65rem] text-foreground-muted"
                    >
                      {e}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIntakeOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => { setIntakeOpen(false); setTab("graph"); }}>
              Create and extract entities
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* freeze */}
      <Dialog open={freezeFor !== null} onOpenChange={(o) => !o && setFreezeFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request account freeze</DialogTitle>
            <DialogDescription>
              {freezeFor ? `${freezeFor.account} · ${freezeFor.bank}` : ""}
            </DialogDescription>
          </DialogHeader>
          {freezeFor && (
            <div className="grid gap-3">
              <dl className="grid grid-cols-2 gap-3">
                <Field label="Holder" value={pick(freezeFor.holder)} />
                <Field label="Linked victims" value={freezeFor.victims} />
                <Field label="Inflow" value={inr(freezeFor.inflow)} />
                <Field label="Outflow" value={inr(freezeFor.outflow)} />
              </dl>
              <div className="grid gap-1.5">
                <Label htmlFor="fz-amount">Amount to freeze</Label>
                <Input id="fz-amount" type="number" defaultValue={freezeFor.inflow - freezeFor.outflow} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="fz-ground">Grounds</Label>
                <Textarea id="fz-ground" rows={3} placeholder="Basis for the request, with case references" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreezeFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => { setFreezeFor(null); router.push("/inter-agency"); }}>
              <Snowflake className="h-4 w-4" />
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* case sheet */}
      <Sheet open={caseSheet !== null} onOpenChange={(o) => !o && setCaseSheet(null)}>
        <SheetContent className="w-[32rem]">
          {caseSheet && (
            <>
              <SheetHeader>
                <SheetTitle>{pick(caseSheet.modus)}</SheetTitle>
                <SheetDescription>
                  {caseSheet.refNumber} · {pick(caseSheet.complainant)}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Reported on" value={caseSheet.reportedOn} />
                  <Field label="Status" value={<StatusPill tone="warning">{caseSheet.status}</StatusPill>} />
                  <Field label="Loss" value={inr(caseSheet.lossAmount)} />
                  <Field label="Recovered" value={inr(caseSheet.recovered)} />
                  <Field label="Frozen" value={inr(caseSheet.frozen)} />
                  <Field label="Linked victims" value={caseSheet.linkedVictims} />
                </dl>

                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground-subtle">
                    Extracted entities
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[
                      { label: "Phones", value: caseSheet.entities.phones, icon: Phone },
                      { label: "UPI handles", value: caseSheet.entities.upi, icon: Wallet },
                      { label: "Accounts", value: caseSheet.entities.accounts, icon: Landmark },
                      { label: "Domains", value: caseSheet.entities.domains, icon: Globe },
                      { label: "Devices", value: caseSheet.entities.devices, icon: Network },
                    ].map((e) => (
                      <div
                        key={e.label}
                        className="flex items-center gap-2 rounded-md border border-border p-2.5"
                      >
                        <e.icon className="h-4 w-4 text-foreground-subtle" />
                        <span className="text-sm text-foreground">{e.value}</span>
                        <span className="text-xs text-foreground-subtle">{e.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => { setCaseSheet(null); setTab("graph"); }}>
                    <Network className="h-4 w-4" />
                    Open fraud network
                  </Button>
                  <Button variant="outline" onClick={() => { setCaseSheet(null); setTab("accounts"); }}>
                    <IndianRupee className="h-4 w-4" />
                    Follow the money trail
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/investigation")}>
                    <Link2 className="h-4 w-4" />
                    Open investigation workspace
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

/** Layered money-flow diagram: victims → collection → mule layer → exit. */
function FraudGraph() {
  const layers = [
    { title: "Victims", nodes: ["17 complainants"], color: "var(--info)" },
    { title: "Collection", nodes: ["upi@okaxis", "9831-XXXX-42"], color: "var(--warning)" },
    { title: "Mule layer", nodes: ["XXXX4419", "XXXX8872", "XXXX2210"], color: "var(--danger)" },
    { title: "Exit", nodes: ["Cash withdrawal", "Crypto exchange"], color: "var(--foreground-muted)" },
  ];

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[40rem] items-stretch gap-3">
        {layers.map((layer, li) => (
          <React.Fragment key={layer.title}>
            <div className="flex flex-1 flex-col gap-2">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                {layer.title}
              </p>
              {layer.nodes.map((n) => (
                <div
                  key={n}
                  className="rounded-md border px-3 py-2.5 text-center font-mono text-xs"
                  style={{
                    borderColor: `color-mix(in oklab, ${layer.color} 35%, transparent)`,
                    background: `color-mix(in oklab, ${layer.color} 8%, transparent)`,
                    color: "var(--foreground)",
                  }}
                >
                  {n}
                </div>
              ))}
            </div>
            {li < layers.length - 1 && (
              <div className="flex items-center">
                <svg width="24" height="16" viewBox="0 0 24 16" aria-hidden>
                  <path
                    d="M0 8 H18 M14 4 L18 8 L14 12"
                    stroke="var(--border-strong)"
                    strokeWidth="1.5"
                    fill="none"
                  />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
