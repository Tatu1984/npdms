"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Circle, ClipboardCheck, Play } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { EmptyState, PageHeader, Panel, PhaseBadge, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecordLinkPicker, type RecordLink } from "@/components/platform/pickers";
import { toast } from "@/stores/toastStore";
import { ApiClientError } from "@/lib/api/client";
import knowledgeApi, { type ChecklistRun } from "@/lib/api/knowledge";
import { knowledgeKeys, useChecklist, useChecklistRuns, useStartRun, useTickStep } from "@/hooks/use-knowledge";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge, useOfficer } from "../../shared";

export default function ChecklistPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { t, locale } = useI18n();
  const officer = useOfficer();

  const checklist = useChecklist(id);
  const runs = useChecklistRuns(id);
  const startRun = useStartRun(id);

  const [selectedRun, setSelectedRun] = React.useState<string | null>(null);
  const [startOpen, setStartOpen] = React.useState(false);
  const [subject, setSubject] = React.useState<RecordLink | null>(null);
  const [startError, setStartError] = React.useState<string | null>(null);

  const runList = runs.data ?? [];
  const activeRunId = selectedRun ?? runList[0]?.id ?? null;

  if (checklist.isLoading) {
    return (
      <DashboardLayout>
        <Skeleton className="h-96 w-full" />
      </DashboardLayout>
    );
  }
  if (checklist.isError || !checklist.data) {
    const notFound = checklist.error instanceof ApiClientError && checklist.error.code === 404;
    return (
      <DashboardLayout>
        <EmptyState
          icon={ClipboardCheck}
          title={notFound ? t("knowledgeScreen.detail.notFound") : t("knowledgeScreen.errors.load")}
          description={notFound ? t("knowledgeScreen.detail.notFoundHint") : (checklist.error as Error)?.message}
          action={
            <Button variant="outline" onClick={() => router.push("/knowledge")}>
              {t("knowledgeScreen.detail.back")}
            </Button>
          }
        />
      </DashboardLayout>
    );
  }

  const c = checklist.data;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <div>
          <Link href="/knowledge" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {t("knowledgeScreen.detail.back")}
          </Link>
        </div>
        <PageHeader
          title={locale === "bn" && c.titleBn ? c.titleBn : c.title}
          description={t("knowledgeScreen.checklists.follows", { number: c.documentNumber, section: c.sectionRef })}
          icon={ClipboardCheck}
          badge={<PhaseBadge phase={11} />}
          breadcrumb={[{ label: t("modules.knowledge"), href: "/knowledge" }, { label: c.documentNumber, href: `/knowledge/${c.documentId}` }]}
          actions={
            officer.canFollow ? (
              <Button
                onClick={() => {
                  setSubject(null);
                  setStartError(null);
                  setStartOpen(true);
                }}
              >
                <Play className="h-4 w-4" />
                {t("knowledgeScreen.run.start")}
              </Button>
            ) : undefined
          }
        />

        {c.documentStatus !== "EFFECTIVE" && (
          <Alert variant="warning">
            <AlertDescription className="flex flex-wrap items-center gap-2">
              <StatusBadge value={c.documentStatus} />
              {t("knowledgeScreen.run.sourceSuperseded")}{" "}
              <Link className="underline" href={`/knowledge/${c.documentId}`}>
                {c.documentNumber}
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title={t("knowledgeScreen.run.runs")}>
            {runs.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : runList.length === 0 ? (
              <p className="text-sm text-foreground-muted">{t("knowledgeScreen.run.noRuns")}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {runList.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedRun(r.id)}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                        r.id === activeRunId ? "bg-background-tertiary text-foreground" : "text-foreground-muted hover:bg-background-tertiary"
                      }`}
                    >
                      <span className="font-mono">{r.caseNumber || r.firNumber}</span>
                      <span className="block text-xs">
                        {t("knowledgeScreen.run.progress", { done: r.ticks.length, total: r.totalSteps })} · {r.startedByName}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="lg:col-span-2">
            {activeRunId ? (
              <RunPanel runId={activeRunId} checklistId={c.id} steps={c.steps} canTick={officer.canFollow} />
            ) : (
              <Panel title={t("knowledgeScreen.checklists.steps")}>
                <ol className="flex flex-col gap-2">
                  {c.steps.map((s) => (
                    <li key={s.id} className="flex gap-3 text-sm">
                      <span className="tabular text-foreground-subtle">{s.position}.</span>
                      <span>{locale === "bn" && s.textBn ? s.textBn : s.text}</span>
                    </li>
                  ))}
                </ol>
              </Panel>
            )}
          </div>
        </div>
      </div>

      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("knowledgeScreen.run.startTitle")}</DialogTitle>
            <DialogDescription>{t("knowledgeScreen.run.startDescription")}</DialogDescription>
          </DialogHeader>
          <div>
            <Label>{t("knowledgeScreen.run.subject")}</Label>
            <div className="mt-1">
              <RecordLinkPicker value={subject} onChange={setSubject} />
            </div>
          </div>
          {startError && (
            <Alert variant="danger">
              <AlertDescription>{startError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStartOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={startRun.isPending}
              onClick={() => {
                if (!subject) {
                  setStartError(t("knowledgeScreen.run.startDescription"));
                  return;
                }
                startRun.mutate(subject.kind === "case" ? { caseId: subject.id } : { firId: subject.id }, {
                  onSuccess: (run) => {
                    setStartOpen(false);
                    setSelectedRun(run.id);
                  },
                  onError: (e) => setStartError((e as Error).message),
                });
              }}
            >
              {t("knowledgeScreen.run.confirmStart")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function RunPanel({
  runId,
  checklistId,
  steps,
  canTick,
}: {
  runId: string;
  checklistId: string;
  steps: { id: string; position: number; text: string; textBn: string | null }[];
  canTick: boolean;
}) {
  const { t, locale } = useI18n();
  const run = useQuery<ChecklistRun>({ queryKey: knowledgeKeys.run(runId), queryFn: () => knowledgeApi.run(runId) });
  const tick = useTickStep(runId, checklistId);
  const [notes, setNotes] = React.useState<Record<string, string>>({});

  if (run.isLoading || !run.data) return <Skeleton className="h-48 w-full" />;
  const ticks = new Map(run.data.ticks.map((tk) => [tk.stepId, tk]));

  return (
    <Panel
      title={run.data.caseNumber || run.data.firNumber}
      description={t("knowledgeScreen.run.progress", { done: run.data.ticks.length, total: run.data.totalSteps })}
    >
      <ol className="flex flex-col gap-3">
        {steps.map((s) => {
          const done = ticks.get(s.id);
          return (
            <li key={s.id} className="flex gap-3 rounded-md border border-border p-3" data-testid={`step-${s.position}`}>
              {done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-foreground-subtle" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">
                  <span className="tabular text-foreground-subtle">{s.position}. </span>
                  {locale === "bn" && s.textBn ? s.textBn : s.text}
                </p>
                {done ? (
                  <p className="mt-1 text-xs text-foreground-muted">
                    {t("knowledgeScreen.run.ticked", { name: done.tickedByName, when: formatDateTime(done.tickedAt) })}
                    {done.note ? ` — ${done.note}` : ""}
                  </p>
                ) : (
                  canTick && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <div className="min-w-[14rem] flex-1">
                        <Input
                          id={`note-${s.position}`}
                          placeholder={t("knowledgeScreen.run.note")}
                          value={notes[s.id] ?? ""}
                          onChange={(v) => setNotes((n) => ({ ...n, [s.id]: v }))}
                        />
                      </div>
                      <Button
                        size="sm"
                        disabled={tick.isPending}
                        onClick={() =>
                          tick.mutate(
                            { stepId: s.id, note: notes[s.id] },
                            { onError: (e) => toast.error(t("knowledgeScreen.errors.load"), (e as Error).message) },
                          )
                        }
                      >
                        {t("knowledgeScreen.run.tick")}
                      </Button>
                    </div>
                  )
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-foreground-subtle">{t("knowledgeScreen.run.append")}</p>
      {!canTick && <StatusPill className="mt-2">{t("knowledgeScreen.run.progress", { done: run.data.ticks.length, total: run.data.totalSteps })}</StatusPill>}
    </Panel>
  );
}
