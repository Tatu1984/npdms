"use client";

import * as React from "react";
import { AlertTriangle, Brain, MessageSquare } from "lucide-react";
import { Field, StatusPill } from "@/components/platform/primitives";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { ApiClientError } from "@/lib/api/client";
import type { AIDecision, AIFeedbackType, ReviewInput } from "@/lib/api/ai-review";
import { useAIDecision, useAIDecisionFeedback, useAIDecisionHistory, useReviewAIDecision } from "@/hooks/use-ai-review";
import { toast } from "@/stores/toastStore";
import {
  ConfidenceMeter,
  DecisionStatusPill,
  DecisionTypePill,
  PriorityPill,
  SourceList,
  isOverdue,
  selectClass,
  stamp,
} from "./shared";

type Verdict = "APPROVED" | "REJECTED" | "OVERRIDDEN";

/** The API sends `[]` or `{}` where a model gave nothing; those are not shown. */
function hasPayload(value?: string) {
  const text = value?.trim();
  return Boolean(text) && text !== "[]" && text !== "{}" && text !== "null";
}

/**
 * One suggestion, opened for review.
 *
 * The sources come first after the suggestion itself: the officer is meant to
 * read the record text the model relied on and decide from that. Approve,
 * reject and override are equal choices; none is preselected, and there is no
 * path here that records a decision without an officer pressing one of them.
 */
export function DecisionDialog({
  decisionId,
  open,
  onOpenChange,
}: {
  decisionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const query = useAIDecision(decisionId ?? "", open);
  const history = useAIDecisionHistory(decisionId ?? "", open);
  const review = useReviewAIDecision();
  const feedback = useAIDecisionFeedback();

  const [verdict, setVerdict] = React.useState<Verdict | null>(null);
  const [humanDecision, setHumanDecision] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [overrideReason, setOverrideReason] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [conflict, setConflict] = React.useState(false);

  const [feedbackType, setFeedbackType] = React.useState<AIFeedbackType>("CORRECT");
  const [correctValue, setCorrectValue] = React.useState("");
  const [comments, setComments] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setVerdict(null);
    setHumanDecision("");
    setNotes("");
    setOverrideReason("");
    setFormError(null);
    setConflict(false);
    setFeedbackType("CORRECT");
    setCorrectValue("");
    setComments("");
  }, [open, decisionId]);

  const decision = query.data;
  // Once another officer has decided it, the controls go, whatever the
  // refreshed copy says — this one is no longer anybody's to decide.
  const pending = decision?.status === "PENDING" && !conflict;

  const submit = () => {
    if (!decision || !verdict) return;
    if (verdict === "OVERRIDDEN" && overrideReason.trim() === "") {
      setFormError(t("aiScreen.review.overrideReasonRequired"));
      return;
    }
    setFormError(null);

    const input: ReviewInput = {
      status: verdict,
      humanDecision: humanDecision.trim() || undefined,
      reviewNotes: notes.trim() || undefined,
      overrideReason: verdict === "OVERRIDDEN" ? overrideReason.trim() : undefined,
    };

    review.mutate(
      { id: decision.id, input },
      {
        onSuccess: () => {
          toast.success(
            t(
              verdict === "APPROVED"
                ? "aiScreen.review.approved"
                : verdict === "REJECTED"
                  ? "aiScreen.review.rejected"
                  : "aiScreen.review.overridden",
            ),
          );
          onOpenChange(false);
        },
        onError: (error) => {
          // Another officer got there first. The queue is already being
          // refetched; the officer is told rather than silently overwriting.
          if (error instanceof ApiClientError && error.code === 409) {
            setConflict(true);
            setVerdict(null);
            void query.refetch();
            return;
          }
          setFormError(error instanceof Error ? error.message : t("aiScreen.review.failed"));
        },
      },
    );
  };

  const sendFeedback = () => {
    if (!decision) return;
    feedback.mutate(
      {
        id: decision.id,
        input: { feedbackType, correctValue: correctValue.trim() || undefined, comments: comments.trim() || undefined },
      },
      {
        onSuccess: () => {
          toast.success(t("aiScreen.feedback.done"));
          setCorrectValue("");
          setComments("");
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : t("aiScreen.common.loadFailed")),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("aiScreen.decision.title")}</DialogTitle>
          <DialogDescription>{t("aiScreen.rule.lead")}</DialogDescription>
        </DialogHeader>

        {query.isLoading && <Skeleton className="h-64 w-full" />}
        {query.isError && (
          <Alert variant="danger">
            <AlertTriangle />
            <AlertDescription>
              {query.error instanceof Error ? query.error.message : t("aiScreen.common.loadFailed")}
            </AlertDescription>
          </Alert>
        )}

        {decision && (
          <div className="flex flex-col gap-4">
            {conflict && (
              <Alert variant="warning">
                <AlertTriangle />
                <div>
                  <AlertTitle>{t("aiScreen.review.alreadyReviewedTitle")}</AlertTitle>
                  <AlertDescription>{t("aiScreen.review.alreadyReviewedBody")}</AlertDescription>
                </div>
              </Alert>
            )}

            <Summary decision={decision} />

            <section>
              <h3 className="text-sm font-semibold text-foreground">{t("aiScreen.decision.sources")}</h3>
              <p className="mb-2 mt-0.5 text-xs text-foreground-muted">{t("aiScreen.decision.sourcesBody")}</p>
              <SourceList sources={decision.sources} />
            </section>

            {hasPayload(decision.alternatives) && (
              <Field
                label={t("aiScreen.decision.alternatives")}
                mono
                value={<pre className="whitespace-pre-wrap break-words text-xs">{decision.alternatives}</pre>}
              />
            )}
            {hasPayload(decision.predictionData) && (
              <Field
                label={t("aiScreen.decision.predictionData")}
                mono
                value={<pre className="whitespace-pre-wrap break-words text-xs">{decision.predictionData}</pre>}
              />
            )}

            {pending ? (
              <section className="rounded-lg border border-border bg-surface-sunken p-4">
                <h3 className="text-sm font-semibold text-foreground">{t("aiScreen.review.title")}</h3>
                <p className="mt-0.5 text-xs text-foreground-muted">{t("aiScreen.review.body")}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={verdict === "APPROVED" ? "success" : "outline"}
                    onClick={() => setVerdict("APPROVED")}
                  >
                    {t("aiScreen.review.approve")}
                  </Button>
                  <Button
                    size="sm"
                    variant={verdict === "REJECTED" ? "destructive" : "outline"}
                    onClick={() => setVerdict("REJECTED")}
                  >
                    {t("aiScreen.review.reject")}
                  </Button>
                  <Button
                    size="sm"
                    variant={verdict === "OVERRIDDEN" ? "warning" : "outline"}
                    onClick={() => setVerdict("OVERRIDDEN")}
                  >
                    {t("aiScreen.review.override")}
                  </Button>
                </div>

                {verdict && (
                  <div className="mt-4 flex flex-col gap-3">
                    <Input
                      label={t("aiScreen.review.humanDecision")}
                      hint={t("aiScreen.review.humanDecisionHint")}
                      value={humanDecision}
                      onChange={setHumanDecision}
                    />
                    {verdict === "OVERRIDDEN" && (
                      <Textarea
                        label={t("aiScreen.review.overrideReason")}
                        value={overrideReason}
                        onChange={setOverrideReason}
                        error={formError ?? undefined}
                      />
                    )}
                    <Textarea label={t("aiScreen.review.notes")} value={notes} onChange={setNotes} />
                    {formError && verdict !== "OVERRIDDEN" && <p className="text-sm text-danger">{formError}</p>}
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setVerdict(null)}>
                        {t("aiScreen.common.cancel")}
                      </Button>
                      <Button onClick={submit} disabled={review.isPending}>
                        {review.isPending ? t("aiScreen.review.submitting") : t("aiScreen.review.submit")}
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <Alert variant="info">
                <Brain />
                <div>
                  <AlertTitle>{t("aiScreen.review.alreadyDecided")}</AlertTitle>
                  <AlertDescription>
                    <dl className="mt-1 grid gap-2 sm:grid-cols-2">
                      <Field label={t("aiScreen.decision.reviewedAt")} value={stamp(decision.reviewedAt)} />
                      <Field label={t("aiScreen.decision.humanDecision")} value={decision.humanDecision || "—"} />
                      {decision.overrideReason && (
                        <Field label={t("aiScreen.decision.overrideReason")} value={decision.overrideReason} className="sm:col-span-2" />
                      )}
                      {decision.reviewNotes && (
                        <Field label={t("aiScreen.decision.reviewNotes")} value={decision.reviewNotes} className="sm:col-span-2" />
                      )}
                    </dl>
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <section className="rounded-lg border border-border p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MessageSquare className="h-4 w-4 text-foreground-subtle" />
                {t("aiScreen.feedback.title")}
              </h3>
              <p className="mt-0.5 text-xs text-foreground-muted">{t("aiScreen.feedback.body")}</p>

              {(history.data?.feedback ?? []).length > 0 && (
                <ul className="mt-3 flex flex-col gap-1">
                  {(history.data?.feedback ?? []).map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                      <StatusPill tone={item.feedbackType === "CORRECT" ? "success" : item.feedbackType === "INCORRECT" ? "danger" : "warning"}>
                        {t(`aiScreen.feedback.${item.feedbackType}`)}
                      </StatusPill>
                      <span>{stamp(item.createdAt)}</span>
                      {item.correctValue && <span className="font-mono">{item.correctValue}</span>}
                      {item.comments && <span>{item.comments}</span>}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 flex flex-col gap-3">
                <div>
                  <Label htmlFor="ai-feedback-type">{t("aiScreen.feedback.type")}</Label>
                  <select
                    id="ai-feedback-type"
                    className={`${selectClass} mt-1 w-full`}
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value as AIFeedbackType)}
                  >
                    {(["CORRECT", "INCORRECT", "PARTIALLY_CORRECT"] as const).map((type) => (
                      <option key={type} value={type}>
                        {t(`aiScreen.feedback.${type}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <Input label={t("aiScreen.feedback.correctValue")} value={correctValue} onChange={setCorrectValue} />
                <Input label={t("aiScreen.feedback.comments")} value={comments} onChange={setComments} />
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={sendFeedback} disabled={feedback.isPending}>
                    {feedback.isPending ? t("aiScreen.feedback.submitting") : t("aiScreen.feedback.submit")}
                  </Button>
                </div>
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Summary({ decision }: { decision: AIDecision }) {
  const { t } = useI18n();
  const overdue = decision.status === "PENDING" && isOverdue(decision.dueBy);

  return (
    <div className="rounded-lg border border-[var(--ai-border)] bg-ai-subtle p-4">
      <div className="flex flex-wrap items-center gap-2">
        <DecisionTypePill value={decision.type} />
        <PriorityPill value={decision.priority} />
        <DecisionStatusPill value={decision.status} />
        {overdue && <StatusPill tone="danger">{t("aiScreen.decision.overdue")}</StatusPill>}
      </div>

      <p className="mt-3 text-xs uppercase tracking-wide text-foreground-subtle">{t("aiScreen.decision.suggests")}</p>
      <p className="mt-0.5 text-lg font-semibold leading-snug text-foreground">{decision.prediction}</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <ConfidenceMeter confidence={decision.confidence} threshold={decision.confidenceThreshold} />
        <dl className="grid gap-2">
          <Field label={t("aiScreen.decision.model")} value={`${decision.modelName} · ${decision.modelVersion}`} mono />
          <Field
            label={t("aiScreen.decision.record")}
            value={`${decision.sourceType}${decision.sourceReference ? ` · ${decision.sourceReference}` : ""}`}
            mono
          />
        </dl>
      </div>

      <dl className="mt-3 grid gap-2 sm:grid-cols-3">
        <Field label={t("aiScreen.decision.raised")} value={stamp(decision.createdAt)} />
        <Field label={t("aiScreen.decision.due")} value={decision.dueBy ? stamp(decision.dueBy) : t("aiScreen.decision.noDue")} />
        <Field
          label={t("aiScreen.decision.processingTime")}
          value={t("aiScreen.decision.ms", { n: decision.processingTimeMs })}
        />
        {decision.module && <Field label={t("aiScreen.decision.module")} value={decision.module} />}
        {decision.language && <Field label={t("aiScreen.decision.language")} value={decision.language} />}
      </dl>
    </div>
  );
}
