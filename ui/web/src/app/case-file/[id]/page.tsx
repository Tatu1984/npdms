"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  BookOpenCheck,
  CheckCircle2,
  FileDown,
  FilePlus2,
  FileWarning,
  Gavel,
  GitCompareArrows,
  History,
  PenLine,
  ShieldCheck,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import {
  CASE_FILE_DOCS,
  EVIDENCE_MATRIX,
  PERSONS,
  WORKSPACES,
  type CaseFileDoc,
} from "@/lib/platform/mock";
import { act, ActionMenu, type Action } from "@/components/platform/actions";
import {
  Field,
  PageHeader,
  Panel,
  PhaseBadge,
  StatTile,
  StatusPill,
} from "@/components/platform/primitives";
import { AIBadge, AIGovernanceNotice } from "@/components/platform/governance";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileDropzone } from "@/components/platform/file-dropzone";

const VERSIONS = [
  { id: "v1", at: "2024-12-02 16:40", who: "Insp. Arindam Chatterjee", what: "Added CCTV certificate (D-07)" },
  { id: "v2", at: "2024-11-28 11:12", who: "SI Sutapa Mukherjee", what: "Replaced witness statement D-04 with a corrected copy" },
  { id: "v3", at: "2024-11-22 09:55", who: "ASI Rituparna Ghosh", what: "Added crime scene photographs (D-05)" },
  { id: "v4", at: "2024-11-19 14:02", who: "Insp. Arindam Chatterjee", what: "Case file created from FIR 0412/2024" },
];

const CONSISTENCY = [
  { id: "x1", kind: "Name", detail: "“Rafiqul Sk” in D-02 against “Rafikul Sekh” in D-04", severity: "medium" as const },
  { id: "x2", kind: "Date", detail: "Seizure date recorded as 21 Nov in D-02 and 22 Nov in D-09", severity: "high" as const },
  { id: "x3", kind: "Location", detail: "“Harish Mukherjee Road” in D-01 against “H. M. Road” in D-05", severity: "low" as const },
];

export default function CaseFilePage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { t, pick } = useI18n();

  const workspace = WORKSPACES.find((w) => w.id === params.id) ?? WORKSPACES[0];
  const [tab, setTab] = React.useState(search.get("tab") ?? "documents");
  const [packOpen, setPackOpen] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [signOpen, setSignOpen] = React.useState(false);

  const issues = CASE_FILE_DOCS.filter((d) => d.issues.length > 0);
  const unsigned = CASE_FILE_DOCS.filter((d) => !d.signed);

  const docActions = (d: CaseFileDoc): Action[] => [
    act.label("h", d.serial),
    act.link("open", "Open document", "/reports", { icon: BookOpenCheck }),
    act.run("sign", "Request signature", () => setSignOpen(true), { icon: PenLine }),
    act.sep("s"),
    act.link("evidence", "Linked evidence record", "/custody", { icon: ShieldCheck }),
    act.link("investigation", "Investigation workspace", `/investigation/${workspace.id}`, {
      icon: BookOpenCheck,
    }),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={pick(workspace.title)}
          description={`${workspace.caseNumber} · court readiness ${workspace.progress}%`}
          icon={BookOpenCheck}
          badge={<PhaseBadge phase={12} />}
          breadcrumb={[
            { label: t("modules.caseFile"), href: "/case-file" },
            { label: workspace.caseNumber },
          ]}
          actions={
            <>
              <Button variant="outline" onClick={() => setAddOpen(true)}>
                <FilePlus2 className="h-4 w-4" />
                Add document
              </Button>
              <Button onClick={() => setPackOpen(true)}>
                <FileDown className="h-4 w-4" />
                Submission pack
              </Button>
            </>
          }
          menu={[
            act.link("investigation", "Investigation workspace", `/investigation/${workspace.id}`, {
              icon: BookOpenCheck,
            }),
            act.link("court", "Court diary", "/court", { icon: Gavel }),
            act.link("custody", "Evidence ledger", "/custody", { icon: ShieldCheck }),
            act.sep("s"),
            act.link("audit", "Audit trail", "/audit", { icon: History }),
          ]}
        />

        {issues.length > 0 && (
          <Alert variant="warning">
            <FileWarning />
            <div>
              <AlertTitle>
                {issues.length} document{issues.length === 1 ? "" : "s"} would be objected to
              </AlertTitle>
              <AlertDescription>
                Missing signatures, absent annexures or documents not yet received. Resolve these
                before the submission pack is prepared.
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Documents" value={CASE_FILE_DOCS.length} icon={BookOpenCheck} />
          <StatTile label="With issues" value={issues.length} icon={FileWarning} tone="danger" />
          <StatTile label="Unsigned" value={unsigned.length} icon={PenLine} tone="warning" />
          <StatTile
            label="Court readiness"
            value={workspace.progress}
            unit="%"
            icon={Gavel}
            tone={workspace.progress > 85 ? "success" : "warning"}
          />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="documents">Documents ({CASE_FILE_DOCS.length})</TabsTrigger>
            <TabsTrigger value="evidence">Evidence matrix</TabsTrigger>
            <TabsTrigger value="witnesses">Witness matrix</TabsTrigger>
            <TabsTrigger value="completeness">Completeness</TabsTrigger>
            <TabsTrigger value="consistency">Consistency</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <Panel
              title="Case file index"
              description="Serially numbered as it will be submitted"
              actions={
                <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
                  <FilePlus2 className="h-3.5 w-3.5" />
                  Add
                </Button>
              }
              bodyClassName="p-0"
            >
              <ul className="divide-y divide-border">
                {CASE_FILE_DOCS.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="shrink-0 rounded border border-border bg-surface-sunken px-1.5 py-0.5 font-mono text-xs text-foreground-muted">
                        {d.serial}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">{pick(d.title)}</p>
                        <p className="mt-0.5 text-xs text-foreground-subtle">
                          {d.type} · {d.pages > 0 ? `${d.pages} pages` : "not received"} · added{" "}
                          {d.addedOn}
                        </p>
                        {d.issues.map((issue, i) => (
                          <p key={i} className="mt-1 text-xs text-warning">
                            {pick(issue)}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill tone={d.signed ? "success" : "warning"}>
                        {d.signed ? "Signed" : "Unsigned"}
                      </StatusPill>
                      <ActionMenu size="sm" actions={docActions(d)} />
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </TabsContent>

          <TabsContent value="evidence">
            <Panel
              title="Evidence matrix"
              description="What each item establishes, and through which witness"
              bodyClassName="p-0"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[46rem] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-sunken">
                      {["Evidence", "What it establishes", "Source", "Witness", "Reference", "Strength"].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-foreground-subtle"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {EVIDENCE_MATRIX.map((row) => (
                      <tr key={row.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-foreground">{pick(row.evidence)}</td>
                        <td className="px-4 py-3 text-foreground-muted">{pick(row.establishes)}</td>
                        <td className="px-4 py-3 text-foreground-muted">{pick(row.source)}</td>
                        <td className="px-4 py-3 text-foreground-muted">{pick(row.witness)}</td>
                        <td className="px-4 py-3 font-mono text-xs">{row.documentRef}</td>
                        <td className="px-4 py-3">
                          <StatusPill
                            tone={
                              row.strength === "strong"
                                ? "success"
                                : row.strength === "supporting"
                                  ? "info"
                                  : "warning"
                            }
                          >
                            {row.strength}
                          </StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="witnesses">
            <Panel title="Witness matrix" description="Statements recorded and pending" bodyClassName="p-0">
              <ul className="divide-y divide-border">
                {PERSONS.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{pick(p.name)}</p>
                      <p className="mt-0.5 text-xs text-foreground-subtle">
                        {p.role} · {p.statements} statement{p.statements === 1 ? "" : "s"} recorded
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill tone={p.statements > 0 ? "success" : "warning"}>
                        {p.statements > 0 ? "Recorded" : "Pending"}
                      </StatusPill>
                      <ActionMenu
                        size="sm"
                        actions={[
                          act.link("person", "Open person record", `/investigation/${workspace.id}?tab=persons`, {
                            icon: Users,
                          }),
                          act.link("statement", "Open statement", "/reports", { icon: BookOpenCheck }),
                        ]}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </TabsContent>

          <TabsContent value="completeness">
            <div className="flex flex-col gap-3">
              <AIGovernanceNotice />
              <Panel
                title="Document completeness"
                description="What a court would object to on the current file"
                actions={<AIBadge confidence={0.88} model="completeness-check" />}
                bodyClassName="flex flex-col gap-2"
              >
                {CASE_FILE_DOCS.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {d.issues.length === 0 ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                      ) : (
                        <FileWarning className="h-4 w-4 shrink-0 text-warning" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">
                          <span className="font-mono text-xs text-foreground-subtle">{d.serial}</span>{" "}
                          {pick(d.title)}
                        </p>
                        {d.issues.map((issue, i) => (
                          <p key={i} className="text-xs text-warning">
                            {pick(issue)}
                          </p>
                        ))}
                      </div>
                    </div>
                    {d.issues.length > 0 && (
                      <Button size="sm" variant="outline" onClick={() => setSignOpen(true)}>
                        Resolve
                      </Button>
                    )}
                  </div>
                ))}
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="consistency">
            <Panel
              title="Cross-document consistency"
              description="Differences in names, dates and locations across the file"
              actions={<AIBadge confidence={0.79} model="consistency-check" />}
              bodyClassName="flex flex-col gap-2"
            >
              {CONSISTENCY.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <GitCompareArrows className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{c.kind} discrepancy</p>
                      <p className="mt-0.5 text-sm text-foreground-muted">{c.detail}</p>
                    </div>
                  </div>
                  <StatusPill tone={c.severity === "high" ? "danger" : c.severity === "medium" ? "warning" : "neutral"}>
                    {c.severity}
                  </StatusPill>
                </div>
              ))}
            </Panel>
          </TabsContent>

          <TabsContent value="versions">
            <Panel title="Version history" description="Every change to the case file is recorded" bodyClassName="p-0">
              <ol className="divide-y divide-border">
                {VERSIONS.map((v) => (
                  <li key={v.id} className="flex gap-4 p-4">
                    <History className="mt-0.5 h-4 w-4 shrink-0 text-foreground-subtle" />
                    <div>
                      <p className="text-sm text-foreground">{v.what}</p>
                      <p className="mt-0.5 text-xs text-foreground-subtle">
                        {v.who} · {v.at}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={packOpen} onOpenChange={setPackOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Prepare court submission pack</DialogTitle>
            <DialogDescription>
              The pack is a draft. The investigating officer and the supervisory officer approve it
              before it leaves the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {issues.length > 0 && (
              <Alert variant="warning">
                <FileWarning />
                <div>
                  <AlertTitle>{issues.length} unresolved issue(s)</AlertTitle>
                  <AlertDescription>
                    The pack can still be generated, but the outstanding items will be listed on the
                    covering index.
                  </AlertDescription>
                </div>
              </Alert>
            )}
            <div className="flex flex-col gap-2 text-sm text-foreground-muted">
              {[
                "Covering index with serial numbers",
                "Chronology of the case",
                "Evidence matrix",
                "Witness matrix",
                "List of documents not yet received",
                "Integrity certificates for digital evidence",
              ].map((line) => (
                <label key={line} className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="accent-[var(--accent)]" />
                  {line}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPackOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => { setPackOpen(false); router.push("/court"); }}>
              Generate and route for approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a document</DialogTitle>
            <DialogDescription>{workspace.caseNumber}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="cf-title">Title</Label>
              <Input id="cf-title" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cf-type">Type</Label>
              <Input id="cf-type" placeholder="Statement, seizure list, forensic report…" />
            </div>
            <FileDropzone multiple={false} hint="The document is added to the file index with the next serial number" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => { setAddOpen(false); setTab("documents"); }}>Add and index</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={signOpen} onOpenChange={setSignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request signature</DialogTitle>
            <DialogDescription>
              The request appears in the signatory&apos;s worklist and is recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="sg-who">Signatory</Label>
              <Input id="sg-who" placeholder="Officer name or badge number" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sg-by">Required by</Label>
              <Input id="sg-by" type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => { setSignOpen(false); setTab("completeness"); }}>
              <PenLine className="h-4 w-4" />
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
