"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  GraduationCap,
  ListChecks,
  ScanText,
  Scale,
  Search,
  SearchX,
  Send,
  Upload,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { KNOWLEDGE_DOCS, SAMPLE_ANSWERS, type KnowledgeDoc } from "@/lib/platform/mock";
import { BNSS_SECTIONS, BNS_SECTIONS } from "@/lib/platform/wb";
import { DataTable, type Column } from "@/components/platform/data-table";
import { act, type Action } from "@/components/platform/actions";
import {
  EmptyState,
  Field,
  PageHeader,
  Panel,
  PhaseBadge,
  StatTile,
  StatusPill,
} from "@/components/platform/primitives";
import { AIBadge, ConfidenceMeter, SourceCitations } from "@/components/platform/governance";
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
import { FileDropzone } from "@/components/platform/file-dropzone";

const SUGGESTED = [
  { en: "When must search and seizure be video recorded?", bn: "কখন তল্লাশি ও বাজেয়াপ্তকরণের ভিডিও রেকর্ডিং বাধ্যতামূলক?" },
  { en: "What is the time limit for filing a police report after investigation?", bn: "তদন্তের পর পুলিশ রিপোর্ট দাখিলের সময়সীমা কত?" },
  { en: "Which provision replaced IPC 420?", bn: "আইপিসি ৪২০ ধারার পরিবর্তে কোন ধারা এসেছে?" },
  { en: "What must the first 24 hours of a missing person case cover?", bn: "নিখোঁজ ব্যক্তির মামলার প্রথম ২৪ ঘণ্টায় কী কী করতে হবে?" },
];

const PROCEDURE_STEPS = [
  { step: 1, what: "Record the information in writing and read it back to the informant", auth: "Officer-in-charge", doc: "FIR form" },
  { step: 2, what: "Enter the substance in the General Diary", auth: "Duty officer", doc: "GD register" },
  { step: 3, what: "Give a free copy of the FIR to the informant", auth: "Officer-in-charge", doc: "Acknowledgement" },
  { step: 4, what: "Forward a copy to the jurisdictional magistrate", auth: "Officer-in-charge", doc: "Forwarding memo" },
  { step: 5, what: "Take up investigation and record statements", auth: "Investigating officer", doc: "Case diary" },
];

export default function KnowledgePage() {
  const router = useRouter();
  const { t, pick, locale } = useI18n();

  const [tab, setTab] = React.useState("ask");
  const [query, setQuery] = React.useState("");
  const [answered, setAnswered] = React.useState(false);
  const [noSource, setNoSource] = React.useState(false);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [docSheet, setDocSheet] = React.useState<KnowledgeDoc | null>(null);
  const [quizOpen, setQuizOpen] = React.useState(false);

  const answer = SAMPLE_ANSWERS[0];

  const ask = (q: string) => {
    setQuery(q);
    // Anything outside the indexed corpus must refuse rather than improvise.
    const known = SUGGESTED.some((s) => q.toLowerCase().includes(s.en.slice(0, 18).toLowerCase()));
    setNoSource(!known);
    setAnswered(true);
  };

  const docColumns: Column<KnowledgeDoc>[] = [
    {
      id: "title",
      header: "Document",
      sortValue: (d) => d.title.en,
      cell: (d) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground">{pick(d.title)}</p>
          <p className="mt-0.5 font-mono text-xs text-foreground-subtle">{d.reference}</p>
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      hideBelow: "sm",
      sortValue: (d) => d.type,
      cell: (d) => <StatusPill>{d.type}</StatusPill>,
    },
    {
      id: "issuer",
      header: "Issued by",
      hideBelow: "lg",
      sortValue: (d) => d.issuedBy.en,
      cell: (d) => (
        <div>
          <p className="truncate text-sm">{pick(d.issuedBy)}</p>
          <p className="text-xs text-foreground-subtle">{d.issuedOn}</p>
        </div>
      ),
    },
    {
      id: "pages",
      header: "Pages",
      align: "right",
      hideBelow: "md",
      sortValue: (d) => d.pages,
      cell: (d) => <span className="tabular text-sm">{d.pages}</span>,
    },
    {
      id: "indexed",
      header: "Indexed",
      sortValue: (d) => String(d.indexed),
      cell: (d) => (
        <StatusPill tone={d.indexed ? "success" : "warning"}>
          {d.indexed ? "Searchable" : "Pending OCR"}
        </StatusPill>
      ),
    },
  ];

  const docActions = (d: KnowledgeDoc): Action[] => [
    act.label("h", d.reference),
    act.run("open", "Open document", () => setDocSheet(d), { icon: FileText }),
    act.run("ask", "Ask about this document", () => { setTab("ask"); ask(pick(d.title)); }, {
      icon: Search,
    }),
    act.sep("s"),
    ...(d.indexed
      ? []
      : [act.run("ocr", "Queue for OCR", () => setUploadOpen(true), { icon: ScanText })]),
    act.link("audit", "Access history", "/audit", { icon: FileText }),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.knowledge")}
          description={t("modules.knowledgeDesc")}
          icon={Search}
          badge={<PhaseBadge phase={11} />}
          breadcrumb={[{ label: t("nav.knowledgeGroup") }, { label: t("modules.knowledge") }]}
          actions={
            <>
              <Button variant="outline" onClick={() => setQuizOpen(true)}>
                <GraduationCap className="h-4 w-4" />
                Training mode
              </Button>
              <Button onClick={() => setUploadOpen(true)}>
                <Upload className="h-4 w-4" />
                Add document
              </Button>
            </>
          }
          menu={[
            act.link("sops", "SOP library", "/knowledge?tab=library", { icon: BookOpen }),
            act.link("law", "BNS / BNSS / BSA reference", "/knowledge?tab=law", { icon: Scale }),
            act.link("audit", "Question log", "/audit", { icon: FileText }),
          ]}
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Documents indexed" value={KNOWLEDGE_DOCS.filter((d) => d.indexed).length} icon={BookOpen} tone="success" />
          <StatTile label="Pending OCR" value={KNOWLEDGE_DOCS.filter((d) => !d.indexed).length} icon={ScanText} tone="warning" />
          <StatTile label="BNS provisions" value={BNS_SECTIONS.length} icon={Scale} />
          <StatTile label="BNSS provisions" value={BNSS_SECTIONS.length} icon={Scale} />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="ask">Ask</TabsTrigger>
            <TabsTrigger value="library">Library ({KNOWLEDGE_DOCS.length})</TabsTrigger>
            <TabsTrigger value="law">Legal reference</TabsTrigger>
            <TabsTrigger value="procedures">Procedure generator</TabsTrigger>
          </TabsList>

          <TabsContent value="ask">
            <div className="flex flex-col gap-4">
              <Panel>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Input
                      value={query}
                      onChange={(v: string) => setQuery(v)}
                      onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && ask(query)}
                      placeholder={
                        locale === "bn"
                          ? "স্বাভাবিক ভাষায় প্রশ্ন করুন…"
                          : "Ask in plain language — English or বাংলা"
                      }
                      className={locale === "bn" ? "font-bengali" : ""}
                    />
                    <Button onClick={() => ask(query)}>
                      <Send className="h-4 w-4" />
                      Ask
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED.map((s) => (
                      <button
                        key={s.en}
                        type="button"
                        onClick={() => ask(pick(s))}
                        className={`rounded-full border border-border bg-surface-sunken px-2.5 py-1 text-xs text-foreground-muted transition-colors hover:border-accent hover:text-accent ${
                          locale === "bn" ? "font-bengali" : ""
                        }`}
                      >
                        {pick(s)}
                      </button>
                    ))}
                  </div>
                </div>
              </Panel>

              {!answered ? (
                <EmptyState
                  title="Ask a question about procedure or law"
                  description="Answers come only from indexed SOPs, circulars and the statute text. If no authoritative source covers the question, the assistant says so."
                  icon={Search}
                />
              ) : noSource ? (
                <Alert variant="warning">
                  <SearchX />
                  <div>
                    <AlertTitle>{t("ai.noSource")}</AlertTitle>
                    <AlertDescription>
                      {t("ai.noSourceBody")}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
                          <Upload className="h-3.5 w-3.5" />
                          Add the governing document
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setTab("library")}>
                          Browse the library
                        </Button>
                      </div>
                    </AlertDescription>
                  </div>
                </Alert>
              ) : (
                <Panel
                  title="Answer"
                  actions={<AIBadge confidence={answer.confidence} model="knowledge-rag" />}
                >
                  <div className="flex flex-col gap-3">
                    <p className={`text-sm leading-relaxed text-foreground ${locale === "bn" ? "font-bengali" : ""}`}>
                      {pick(answer.answer)}
                    </p>
                    <SourceCitations sources={answer.sources} onOpen={() => setTab("library")} />
                    <ConfidenceMeter value={answer.confidence} />
                    <div className="rounded-md border border-border bg-surface-sunken px-3 py-2 text-xs text-foreground-muted">
                      The statute text is quoted as issued. Anything beyond the quoted text is the
                      assistant&apos;s summary and must be checked against the source before it is
                      relied on.
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setTab("procedures")}>
                        <ListChecks className="h-3.5 w-3.5" />
                        Generate a checklist from this
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setTab("library")}>
                        <BookOpen className="h-3.5 w-3.5" />
                        Open the sources
                      </Button>
                    </div>
                  </div>
                </Panel>
              )}
            </div>
          </TabsContent>

          <TabsContent value="library">
            <DataTable
              rows={KNOWLEDGE_DOCS}
              columns={docColumns}
              rowKey={(d) => d.id}
              onRowSelect={(d) => setDocSheet(d)}
              rowActions={docActions}
              searchPlaceholder="Search SOPs, circulars, manuals and orders…"
            />
          </TabsContent>

          <TabsContent value="law">
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Bharatiya Nyaya Sanhita, 2023" description="Substantive offences" bodyClassName="p-0">
                <ul className="divide-y divide-border">
                  {BNS_SECTIONS.slice(0, 12).map((s) => (
                    <li key={`${s.act}-${s.code}`} className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">{pick(s.title)}</p>
                        <p className="mt-0.5 text-xs text-foreground-subtle">
                          <span className="font-mono">{s.act} {s.code}</span>
                          {s.legacyIpc && <span> · replaces {s.legacyIpc}</span>}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <StatusPill tone={s.cognizable ? "warning" : "neutral"}>
                          {s.cognizable ? "Cognizable" : "Non-cognizable"}
                        </StatusPill>
                        <StatusPill tone={s.bailable ? "neutral" : "danger"}>
                          {s.bailable ? "Bailable" : "Non-bailable"}
                        </StatusPill>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title="Bharatiya Nagarik Suraksha Sanhita, 2023" description="Procedure" bodyClassName="p-0">
                <ul className="divide-y divide-border">
                  {BNSS_SECTIONS.map((s) => (
                    <li key={`${s.act}-${s.code}`} className="flex items-start justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">{pick(s.title)}</p>
                        <p className="mt-0.5 text-xs text-foreground-subtle">
                          <span className="font-mono">{s.act} {s.code}</span>
                          {s.legacyIpc && <span> · replaces {s.legacyIpc}</span>}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="procedures">
            <Panel
              title="Registration of a cognizable case"
              description="Generated from BNSS 173 and the Kolkata Police standing orders"
              actions={<AIBadge confidence={0.9} model="procedure-generator" />}
              bodyClassName="p-0"
            >
              <ol className="divide-y divide-border">
                {PROCEDURE_STEPS.map((s) => (
                  <li key={s.step} className="flex gap-4 p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-xs font-semibold text-accent">
                      {s.step}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{s.what}</p>
                      <p className="mt-1 text-xs text-foreground-subtle">
                        Approving authority: {s.auth} · Required document: {s.doc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-2 border-t border-border p-4">
                <Button variant="outline" onClick={() => router.push("/fir/new")}>
                  Start an FIR with this checklist
                </Button>
                <Button variant="outline" onClick={() => setTab("law")}>
                  <Scale className="h-4 w-4" />
                  Open the governing provisions
                </Button>
              </div>
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a document to the knowledge base</DialogTitle>
            <DialogDescription>
              Scanned documents are OCR&apos;d before they become searchable. Only indexed documents
              can be cited in an answer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="kd-title">Title</Label>
              <Input id="kd-title" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="kd-ref">Reference number</Label>
                <Input id="kd-ref" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="kd-type">Type</Label>
                <Input id="kd-type" placeholder="SOP, circular, order, manual" />
              </div>
            </div>
            <FileDropzone multiple={false} accept=".pdf,.doc,.docx,.txt" hint="Scanned documents are OCR'd before they become searchable" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => { setUploadOpen(false); setTab("library"); }}>
              Add and index
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Training mode</DialogTitle>
            <DialogDescription>
              Practice questions drawn from the indexed SOPs and statute text.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-foreground">
              Which provision governs the recording of statements by a police officer?
            </p>
            {["BNSS 173", "BNSS 180", "BNSS 183", "BNS 103"].map((option, i) => (
              <label
                key={option}
                className="flex items-center gap-2 rounded-md border border-border p-3 text-sm transition-colors hover:bg-surface-hover"
              >
                <input type="radio" name="quiz" defaultChecked={i === 1} className="accent-[var(--accent)]" />
                <span className="font-mono">{option}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuizOpen(false)}>
              {t("common.close")}
            </Button>
            <Button onClick={() => setQuizOpen(false)}>Check answer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={docSheet !== null} onOpenChange={(o) => !o && setDocSheet(null)}>
        <SheetContent className="w-[32rem]">
          {docSheet && (
            <>
              <SheetHeader>
                <SheetTitle>{pick(docSheet.title)}</SheetTitle>
                <SheetDescription>{docSheet.reference}</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Type" value={docSheet.type} />
                  <Field label="Pages" value={docSheet.pages} />
                  <Field label="Issued by" value={pick(docSheet.issuedBy)} />
                  <Field label="Issued on" value={docSheet.issuedOn} />
                  <Field
                    label="Index status"
                    value={
                      <StatusPill tone={docSheet.indexed ? "success" : "warning"}>
                        {docSheet.indexed ? "Searchable" : "Pending OCR"}
                      </StatusPill>
                    }
                    className="col-span-2"
                  />
                </dl>
                <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border bg-surface-sunken text-sm text-foreground-subtle">
                  Document preview
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => { setDocSheet(null); setTab("ask"); ask(pick(docSheet.title)); }}>
                    <Search className="h-4 w-4" />
                    Ask about this document
                  </Button>
                  {!docSheet.indexed && (
                    <Button variant="outline" onClick={() => { setDocSheet(null); setUploadOpen(true); }}>
                      <ScanText className="h-4 w-4" />
                      Queue for OCR
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
