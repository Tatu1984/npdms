"use client";

import * as React from "react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ExternalLink,
  Gauge,
  Info,
  Lock,
  PlugZap,
  ShieldCheck,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState, Field, PageHeader, Panel, StatTile, StatusPill } from "@/components/platform/primitives";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { ApiClientError } from "@/lib/api/client";
import type {
  AcceptanceGroupBy,
  AIAcceptance,
  AIGatewayStatus,
  AIModuleSwitch,
  RecordEvaluationInput,
  RegisterModelInput,
} from "@/lib/api/ai-review";
import {
  useAIAcceptance,
  useAIEvaluations,
  useAIGateway,
  useAIModels,
  useAIModuleSwitches,
  useRecordAIEvaluation,
  useRegisterAIModel,
  useRetireAIModel,
  useSetAIModuleSwitch,
  useUpdateAIModel,
} from "@/hooks/use-ai-review";
import { toast } from "@/stores/toastStore";
import { cn } from "@/lib/utils";
import { pct, selectClass, stamp, useAIOfficer } from "@/components/ai/shared";
import { RegisterModelDialog } from "@/components/ai/RegisterModelDialog";
import { RecordEvaluationDialog } from "@/components/ai/RecordEvaluationDialog";
import { ReasonDialog } from "@/components/ai/ReasonDialog";

/**
 * AI oversight — the governance screen for DSP rank and above.
 *
 * It answers four questions about the AI layer, in the order someone
 * accountable for it would ask them: what is registered and can it be reached,
 * what has it been measured at, is its module on, and what have officers
 * actually done with its suggestions.
 */
export default function AIOversightPage() {
  const { t } = useI18n();
  const { canOversee, canGovern } = useAIOfficer();

  const [tab, setTab] = React.useState("registry");
  const gateway = useAIGateway();
  const models = useAIModels();

  // A 403 from the API is the authority; the role floor mirrored here only
  // decides what to show before the first request answers.
  const forbidden =
    (gateway.error instanceof ApiClientError && gateway.error.code === 403) ||
    (models.error instanceof ApiClientError && models.error.code === 403) ||
    !canOversee;

  if (forbidden) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-4">
          <PageHeader title={t("aiScreen.nav.oversight")} description={t("aiScreen.nav.oversightDesc")} icon={ShieldCheck} />
          <Alert variant="warning">
            <Lock />
            <div>
              <AlertTitle>{t("aiScreen.access.deniedTitle")}</AlertTitle>
              <AlertDescription>{t("aiScreen.access.deniedBody")}</AlertDescription>
            </div>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader title={t("aiScreen.nav.oversight")} description={t("aiScreen.nav.oversightDesc")} icon={ShieldCheck} />

        <Alert variant="ai">
          <Brain />
          <AlertDescription>{t("aiScreen.rule.lead")}</AlertDescription>
        </Alert>

        {!canGovern && (
          <Alert variant="info">
            <Info />
            <div>
              <AlertTitle>{t("aiScreen.access.governTitle")}</AlertTitle>
              <AlertDescription>{t("aiScreen.access.governBody")}</AlertDescription>
            </div>
          </Alert>
        )}

        <GatewayState />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="registry">{t("aiScreen.registry.title")}</TabsTrigger>
            <TabsTrigger value="evaluations">{t("aiScreen.evaluations.title")}</TabsTrigger>
            <TabsTrigger value="modules">{t("aiScreen.modules.title")}</TabsTrigger>
            <TabsTrigger value="acceptance">{t("aiScreen.acceptance.title")}</TabsTrigger>
          </TabsList>

          <TabsContent value="registry">
            <Registry canGovern={canGovern} />
          </TabsContent>
          <TabsContent value="evaluations">
            <Evaluations canGovern={canGovern} />
          </TabsContent>
          <TabsContent value="modules">
            <ModuleSwitches canGovern={canGovern} />
          </TabsContent>
          <TabsContent value="acceptance">
            <Acceptance />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

/* ---------------------------------------------------------------- gateway */

function GatewayState() {
  const { t } = useI18n();
  const gateway = useAIGateway();

  if (gateway.isLoading) return <Skeleton className="h-28 w-full" />;
  if (gateway.isError) {
    return (
      <Alert variant="danger">
        <AlertTriangle />
        <AlertDescription>{gateway.error instanceof Error ? gateway.error.message : ""}</AlertDescription>
      </Alert>
    );
  }
  if (!gateway.data) return null;

  const { models, enabled, connected, note } = gateway.data;

  return (
    <Panel title={t("aiScreen.gateway.title")} description={t("aiScreen.gateway.description")}>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label={t("aiScreen.gateway.registered")} value={models} icon={Brain} tone="ai" />
        <StatTile label={t("aiScreen.gateway.enabled")} value={enabled} icon={CheckCircle2} tone={enabled > 0 ? "success" : "default"} />
        <StatTile
          label={t("aiScreen.gateway.connected")}
          value={connected}
          icon={PlugZap}
          tone={connected > 0 ? "success" : "warning"}
        />
      </div>

      {note && (
        <Alert variant="warning" className="mt-3">
          <PlugZap />
          <div>
            <AlertTitle>{t("aiScreen.gateway.notConnected")}</AlertTitle>
            <AlertDescription>{note}</AlertDescription>
          </div>
        </Alert>
      )}
    </Panel>
  );
}

/* --------------------------------------------------------------- registry */

function Registry({ canGovern }: { canGovern: boolean }) {
  const { t } = useI18n();
  const gateway = useAIGateway();
  const update = useUpdateAIModel();
  const register = useRegisterAIModel();

  const retire = useRetireAIModel();

  const [registerOpen, setRegisterOpen] = React.useState(false);
  const [registerError, setRegisterError] = React.useState<string | null>(null);
  /** A refusal is a stated rule, not a fault; it is shown against the model. */
  const [refusal, setRefusal] = React.useState<{ modelName: string; message: string } | null>(null);
  const [retiring, setRetiring] = React.useState<AIGatewayStatus | null>(null);
  const [retireError, setRetireError] = React.useState<string | null>(null);

  const rows = gateway.data?.data ?? [];

  const toggle = (status: AIGatewayStatus) => {
    setRefusal(null);
    update.mutate(
      { modelName: status.modelName, input: { isEnabled: !status.isEnabled } },
      {
        onSuccess: () => toast.success(t(status.isEnabled ? "aiScreen.registry.switchedOff" : "aiScreen.registry.switchedOn")),
        onError: (error) => {
          if (error instanceof ApiClientError && error.code === 409) {
            setRefusal({ modelName: status.modelName, message: error.message });
            return;
          }
          toast.error(error instanceof Error ? error.message : t("aiScreen.common.loadFailed"));
        },
      },
    );
  };

  const submitRetirement = (reason: string) => {
    if (!retiring) return;
    setRetireError(null);
    retire.mutate(
      { modelName: retiring.modelName, reason },
      {
        onSuccess: () => {
          toast.success(t("aiScreen.registry.retireDone"));
          setRetiring(null);
        },
        onError: (error) => setRetireError(error instanceof Error ? error.message : t("aiScreen.common.loadFailed")),
      },
    );
  };

  const submitRegistration = (input: RegisterModelInput) => {
    setRegisterError(null);
    register.mutate(input, {
      onSuccess: () => {
        toast.success(t("aiScreen.register.done"));
        setRegisterOpen(false);
      },
      onError: (error) => setRegisterError(error instanceof Error ? error.message : t("aiScreen.common.loadFailed")),
    });
  };

  return (
    <Panel
      title={t("aiScreen.registry.title")}
      description={t("aiScreen.registry.description")}
      actions={
        canGovern ? (
          <Button size="sm" onClick={() => setRegisterOpen(true)}>
            {t("aiScreen.register.open")}
          </Button>
        ) : undefined
      }
    >
      <Alert variant="info" className="mb-3">
        <Info />
        <AlertDescription>{t("aiScreen.rule.measured")}</AlertDescription>
      </Alert>

      {gateway.isLoading && <Skeleton className="h-40 w-full" />}
      {gateway.isError && (
        <Alert variant="danger">
          <AlertTriangle />
          <div>
            <AlertTitle>{t("aiScreen.registry.loadFailed")}</AlertTitle>
            <AlertDescription>{gateway.error instanceof Error ? gateway.error.message : ""}</AlertDescription>
          </div>
        </Alert>
      )}
      {gateway.data && rows.length === 0 && (
        <EmptyState icon={Brain} title={t("aiScreen.registry.empty")} description={t("aiScreen.registry.emptyBody")} />
      )}

      <div className="flex flex-col gap-3">
        {rows.map((status) => (
          <ModelRow
            key={status.modelName}
            status={status}
            canGovern={canGovern}
            busy={update.isPending}
            refusal={refusal?.modelName === status.modelName ? refusal.message : null}
            onToggle={() => toggle(status)}
            onRetire={() => {
              setRetireError(null);
              setRetiring(status);
            }}
          />
        ))}
      </div>

      <RegisterModelDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onSubmit={submitRegistration}
        submitting={register.isPending}
        error={registerError}
      />

      <ReasonDialog
        open={retiring !== null}
        onOpenChange={(open) => !open && setRetiring(null)}
        title={`${t("aiScreen.registry.retireTitle")} — ${retiring?.modelName ?? ""}`}
        body={t("aiScreen.registry.retireBody")}
        warning={t("aiScreen.registry.retireIrreversible")}
        reasonLabel={t("aiScreen.registry.retireReason")}
        reasonRequiredMessage={t("aiScreen.registry.retireReasonRequired")}
        confirmLabel={t("aiScreen.registry.retireConfirm")}
        confirmingLabel={t("aiScreen.registry.retiring")}
        destructive
        submitting={retire.isPending}
        error={retireError}
        onConfirm={submitRetirement}
      />
    </Panel>
  );
}

function ModelRow({
  status,
  canGovern,
  busy,
  refusal,
  onToggle,
  onRetire,
}: {
  status: AIGatewayStatus;
  canGovern: boolean;
  busy: boolean;
  refusal: string | null;
  onToggle: () => void;
  onRetire: () => void;
}) {
  const { t } = useI18n();
  const mismatch =
    status.reports?.modelVersion && status.modelVersion && status.reports.modelVersion !== status.modelVersion;
  const retired = Boolean(status.retiredAt);

  return (
    <article className={cn("rounded-lg border border-border bg-surface-sunken p-4", retired && "opacity-75")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-mono text-sm font-semibold text-foreground">{status.modelName}</h3>
            <StatusPill>{status.modelVersion}</StatusPill>
            <StatusPill tone="ai">{t(`aiScreen.types.${status.decisionType}`)}</StatusPill>
            {retired && <StatusPill tone="danger">{t("aiScreen.registry.retired")}</StatusPill>}
          </div>
          {status.description && <p className="mt-1 max-w-xl text-sm text-foreground-muted">{status.description}</p>}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <StatusPill tone={status.isEnabled ? "success" : "neutral"}>
            {status.isEnabled ? t("aiScreen.registry.on") : t("aiScreen.registry.off")}
          </StatusPill>
          {/* A retired model is off for good; it is not offered a switch. */}
          {canGovern && !retired && (
            <>
              <Button size="sm" variant={status.isEnabled ? "outline" : "default"} disabled={busy} onClick={onToggle}>
                {status.isEnabled ? t("aiScreen.registry.switchOff") : t("aiScreen.registry.switchOn")}
              </Button>
              <Button size="sm" variant="ghost" onClick={onRetire}>
                {t("aiScreen.registry.retire")}
              </Button>
            </>
          )}
        </div>
      </div>

      {retired && (
        <dl className="mt-3 grid gap-3 rounded-md border border-danger/25 bg-danger-subtle p-3 sm:grid-cols-2">
          <Field label={t("aiScreen.registry.retiredOn")} value={stamp(status.retiredAt)} />
          <Field label={t("aiScreen.registry.retiredReason")} value={status.retiredReason || t("aiScreen.common.unknown")} />
        </dl>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <StatusPill tone={status.measured ? "success" : "warning"}>
          {status.measured ? t("aiScreen.registry.measuredYes") : t("aiScreen.registry.measuredNo")}
        </StatusPill>
        {/* A model with no module is not governed by a module switch, so no
            switch state is claimed for it. */}
        {status.module && (
          <StatusPill tone={status.moduleOn ? "success" : "neutral"}>
            {status.moduleOn ? t("aiScreen.registry.moduleOn") : t("aiScreen.registry.moduleOff")}
          </StatusPill>
        )}
        <StatusPill tone={status.connected ? (status.reachable ? "success" : "danger") : "warning"}>
          {status.connected
            ? status.reachable
              ? t("aiScreen.gateway.reachable")
              : t("aiScreen.gateway.unreachable")
            : t("aiScreen.gateway.notConnected")}
        </StatusPill>
        {!status.hasClient && <StatusPill tone="neutral">{t("aiScreen.gateway.noClient")}</StatusPill>}
      </div>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t("aiScreen.registry.threshold")} value={pct(status.confidenceThreshold, 0)} />
        <Field label={t("aiScreen.registry.task")} value={status.task || status.module || t("aiScreen.common.unknown")} />
        <Field label={t("aiScreen.registry.licence")} value={status.licence || t("aiScreen.registry.noLicence")} />
        <Field
          label={t("aiScreen.registry.source")}
          value={
            status.sourceUrl ? (
              <a
                href={status.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:underline"
              >
                <span className="truncate">{status.sourceUrl}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              t("aiScreen.registry.noSource")
            )
          }
        />
        <Field
          label={t("aiScreen.registry.endpointEnv")}
          value={status.endpointEnv || t("aiScreen.registry.noEndpoint")}
          mono
        />
        <Field label={t("aiScreen.registry.reviewTimeout")} value={t("aiScreen.registry.hours", { n: status.reviewTimeout })} />
        <Field label={t("aiScreen.registry.maxQueue")} value={String(status.maxQueueSize)} />
        <Field label={t("aiScreen.registry.registeredBy")} value={stamp(status.createdAt)} />
      </dl>

      {status.reports && (
        <div className="mt-3 rounded-md border border-border bg-surface p-3">
          <p className="text-xs uppercase tracking-wide text-foreground-subtle">{t("aiScreen.gateway.reports")}</p>
          <dl className="mt-1 grid gap-2 sm:grid-cols-4">
            <Field label={t("aiScreen.gateway.service")} value={status.reports.service} mono />
            <Field label={t("aiScreen.registry.model")} value={status.reports.modelName} mono />
            <Field label={t("aiScreen.registry.version")} value={status.reports.modelVersion} mono />
            <Field
              label={t("aiScreen.gateway.ready")}
              value={status.reports.ready ? t("aiScreen.gateway.ready") : t("aiScreen.gateway.notReady")}
            />
          </dl>
        </div>
      )}

      {mismatch && (
        <Alert variant="warning" className="mt-3">
          <AlertTriangle />
          <div>
            <AlertTitle>{t("aiScreen.gateway.versionMismatch")}</AlertTitle>
            <AlertDescription>
              {t("aiScreen.gateway.versionMismatchBody", {
                running: status.reports?.modelVersion ?? "",
                registered: status.modelVersion,
              })}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {status.note && !mismatch && (
        <p className="mt-3 text-sm text-foreground-muted">{status.note}</p>
      )}

      {refusal && (
        <Alert variant="info" className="mt-3">
          <ShieldCheck />
          <div>
            <AlertTitle>{t("aiScreen.registry.refusedTitle")}</AlertTitle>
            <AlertDescription>{refusal}</AlertDescription>
          </div>
        </Alert>
      )}
    </article>
  );
}

/* ------------------------------------------------------------ evaluations */

function Evaluations({ canGovern }: { canGovern: boolean }) {
  const { t } = useI18n();
  const models = useAIModels();
  const [modelName, setModelName] = React.useState("");
  const evaluations = useAIEvaluations(modelName || undefined);
  const record = useRecordAIEvaluation();

  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = (input: RecordEvaluationInput) => {
    setError(null);
    record.mutate(input, {
      onSuccess: (evaluation) => {
        toast.success(t("aiScreen.evaluations.done"), evaluation.passed ? t("aiScreen.evaluations.passed") : t("aiScreen.evaluations.failed"));
        setOpen(false);
      },
      onError: (err) => setError(err instanceof Error ? err.message : t("aiScreen.common.loadFailed")),
    });
  };

  const rows = evaluations.data ?? [];

  return (
    <Panel
      title={t("aiScreen.evaluations.title")}
      description={t("aiScreen.evaluations.description")}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={t("aiScreen.evaluations.filterModel")}
            className={selectClass}
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
          >
            <option value="">{t("aiScreen.evaluations.allModels")}</option>
            {(models.data ?? []).map((model) => (
              <option key={model.modelName} value={model.modelName}>
                {model.modelName}
              </option>
            ))}
          </select>
          {canGovern && (models.data ?? []).length > 0 && (
            <Button size="sm" onClick={() => setOpen(true)}>
              {t("aiScreen.evaluations.record")}
            </Button>
          )}
        </div>
      }
    >
      <Alert variant="info" className="mb-3">
        <Info />
        <div>
          <AlertDescription>{t("aiScreen.rule.appendOnly")}</AlertDescription>
          <AlertDescription className="mt-1">{t("aiScreen.evaluations.registrationNote")}</AlertDescription>
        </div>
      </Alert>

      {evaluations.isLoading && <Skeleton className="h-32 w-full" />}
      {evaluations.data && rows.length === 0 && (
        <EmptyState
          icon={Gauge}
          title={modelName ? t("aiScreen.evaluations.empty") : t("aiScreen.evaluations.emptyAll")}
          description={t("aiScreen.evaluations.emptyBody")}
        />
      )}

      <ul className="flex flex-col gap-3">
        {rows.map((evaluation) => (
          <li key={evaluation.id} className="rounded-lg border border-border bg-surface-sunken p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-medium text-foreground">{evaluation.modelName}</span>
                <StatusPill>{evaluation.modelVersion}</StatusPill>
                <StatusPill tone={evaluation.passed ? "success" : "danger"}>
                  {evaluation.passed ? t("aiScreen.evaluations.passed") : t("aiScreen.evaluations.failed")}
                </StatusPill>
              </div>
              <span className="text-xs text-foreground-muted">
                {t("aiScreen.evaluations.runBy")} {evaluation.runByName || t("aiScreen.common.unknown")} · {stamp(evaluation.runAt)}
              </span>
            </div>

            <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Field label={t("aiScreen.evaluations.dataset")} value={evaluation.dataset} />
              <Field label={t("aiScreen.evaluations.size")} value={evaluation.datasetSize.toLocaleString("en-IN")} />
              <Field label={t("aiScreen.evaluations.metric")} value={evaluation.metric} />
              <Field label={t("aiScreen.evaluations.threshold")} value={pct(evaluation.threshold, 1)} />
              <Field label={t("aiScreen.evaluations.measured")} value={pct(evaluation.measured, 1)} />
            </dl>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field
                label={t("aiScreen.evaluations.limitations")}
                value={evaluation.limitations || t("aiScreen.evaluations.noLimitations")}
              />
              {evaluation.notes && <Field label={t("aiScreen.evaluations.notes")} value={evaluation.notes} />}
            </div>

            {evaluation.datasetSha256 && (
              <p className="mt-2 break-all font-mono text-xs text-foreground-subtle">{evaluation.datasetSha256}</p>
            )}
          </li>
        ))}
      </ul>

      <RecordEvaluationDialog
        open={open}
        onOpenChange={setOpen}
        models={models.data ?? []}
        preselected={modelName || undefined}
        onSubmit={submit}
        submitting={record.isPending}
        error={error}
      />
    </Panel>
  );
}

/* --------------------------------------------------------- module switches */

function ModuleSwitches({ canGovern }: { canGovern: boolean }) {
  const { t } = useI18n();
  const switches = useAIModuleSwitches();
  const setSwitch = useSetAIModuleSwitch();
  const rows = switches.data ?? [];

  const [changing, setChanging] = React.useState<AIModuleSwitch | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  /** A refusal is the rule that stopped it, shown against that module. */
  const [refusal, setRefusal] = React.useState<{ module: string; message: string } | null>(null);

  const submit = (reason: string) => {
    if (!changing) return;
    const turningOn = !changing.enabled;
    setError(null);
    setRefusal(null);
    setSwitch.mutate(
      { module: changing.module, input: { enabled: turningOn, reason } },
      {
        onSuccess: () => {
          toast.success(t(turningOn ? "aiScreen.modules.switchedOn" : "aiScreen.modules.switchedOff"));
          setChanging(null);
        },
        onError: (err) => {
          // 409 is a rule the database enforces — face recognition without an
          // authorisation — so it is stated against the module, not thrown away.
          if (err instanceof ApiClientError && err.code === 409) {
            setRefusal({ module: changing.module, message: err.message });
            setChanging(null);
            return;
          }
          setError(err instanceof Error ? err.message : t("aiScreen.common.loadFailed"));
        },
      },
    );
  };

  return (
    <Panel title={t("aiScreen.modules.title")} description={t("aiScreen.modules.description")}>
      {switches.isLoading && <Skeleton className="h-32 w-full" />}
      {switches.data && rows.length === 0 && <EmptyState icon={ShieldCheck} title={t("aiScreen.modules.empty")} />}

      <ul className="flex flex-col gap-3">
        {rows.map((entry) => (
          <li key={entry.module} className="rounded-lg border border-border bg-surface-sunken p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium text-foreground">{entry.module}</span>
                <StatusPill tone={entry.enabled ? "success" : "neutral"}>
                  {entry.enabled ? t("aiScreen.registry.on") : t("aiScreen.registry.off")}
                </StatusPill>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-foreground-muted">
                  {t("aiScreen.modules.changedBy")} {entry.updatedByName || t("aiScreen.common.unknown")} · {stamp(entry.updatedAt)}
                </span>
                {canGovern && (
                  <Button
                    size="sm"
                    variant={entry.enabled ? "outline" : "default"}
                    disabled={setSwitch.isPending}
                    onClick={() => {
                      setError(null);
                      setRefusal(null);
                      setChanging(entry);
                    }}
                  >
                    {entry.enabled ? t("aiScreen.modules.switchOff") : t("aiScreen.modules.switchOn")}
                  </Button>
                )}
              </div>
            </div>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label={t("aiScreen.modules.reason")} value={entry.reason || t("aiScreen.modules.noReason")} />
              {entry.note && <Field label={t("aiScreen.modules.note")} value={entry.note} />}
            </dl>

            {refusal?.module === entry.module && (
              <Alert variant="info" className="mt-3">
                <ShieldCheck />
                <div>
                  <AlertTitle>{t("aiScreen.modules.refusedTitle")}</AlertTitle>
                  <AlertDescription>{refusal.message}</AlertDescription>
                </div>
              </Alert>
            )}
          </li>
        ))}
      </ul>

      <ReasonDialog
        open={changing !== null}
        onOpenChange={(open) => !open && setChanging(null)}
        title={`${t("aiScreen.modules.changeTitle")} — ${changing?.module ?? ""}`}
        body={t(changing?.enabled ? "aiScreen.modules.changeOff" : "aiScreen.modules.changeOn")}
        reasonLabel={t("aiScreen.modules.changeReason")}
        reasonRequiredMessage={t("aiScreen.modules.changeReasonRequired")}
        confirmLabel={t("aiScreen.modules.confirm")}
        confirmingLabel={t("aiScreen.modules.changing")}
        submitting={setSwitch.isPending}
        error={error}
        onConfirm={submit}
      />
    </Panel>
  );
}

/* --------------------------------------------------------------- acceptance */

function isoDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function Acceptance() {
  const { t } = useI18n();
  const models = useAIModels();
  const [groupBy, setGroupBy] = React.useState<AcceptanceGroupBy>("station");
  const [modelName, setModelName] = React.useState("");
  const [startDate, setStartDate] = React.useState(isoDaysAgo(30));
  const [endDate, setEndDate] = React.useState(new Date().toISOString().slice(0, 10));

  const acceptance = useAIAcceptance({ groupBy, modelName: modelName || undefined, startDate, endDate });
  const rows = acceptance.data?.data ?? [];

  const groupLabel = (row: AIAcceptance) => {
    switch (groupBy) {
      case "station":
        return row.stationName || row.stationId || t("aiScreen.acceptance.unattributed");
      case "language":
        return row.language || t("aiScreen.acceptance.unattributed");
      case "type":
        // The grouping key is whatever the decisions carry; an unknown type
        // falls back to its own name rather than a blank cell.
        return row.type
          ? t(`aiScreen.types.${row.type}` as TranslationKey, {}) || row.type
          : t("aiScreen.acceptance.unattributed");
      case "model":
      default:
        return row.modelName || t("aiScreen.acceptance.unattributed");
    }
  };

  return (
    <Panel
      title={t("aiScreen.acceptance.title")}
      description={t("aiScreen.acceptance.description")}
      actions={
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label htmlFor="ai-group-by" className="text-xs">
              {t("aiScreen.acceptance.groupBy")}
            </Label>
            <select
              id="ai-group-by"
              className={`${selectClass} mt-1`}
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as AcceptanceGroupBy)}
            >
              <option value="station">{t("aiScreen.acceptance.byStation")}</option>
              <option value="language">{t("aiScreen.acceptance.byLanguage")}</option>
              <option value="type">{t("aiScreen.acceptance.byType")}</option>
              <option value="model">{t("aiScreen.acceptance.byModel")}</option>
            </select>
          </div>
          <div>
            <Label htmlFor="ai-acceptance-model" className="text-xs">
              {t("aiScreen.acceptance.filterModel")}
            </Label>
            <select
              id="ai-acceptance-model"
              className={`${selectClass} mt-1`}
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
            >
              <option value="">{t("aiScreen.acceptance.allModels")}</option>
              {(models.data ?? []).map((model) => (
                <option key={model.modelName} value={model.modelName}>
                  {model.modelName}
                </option>
              ))}
            </select>
          </div>
          <Input label={t("aiScreen.acceptance.from")} type="date" value={startDate} onChange={setStartDate} />
          <Input label={t("aiScreen.acceptance.to")} type="date" value={endDate} onChange={setEndDate} />
        </div>
      }
    >
      {acceptance.isLoading && <Skeleton className="h-32 w-full" />}
      {acceptance.isError && (
        <Alert variant="danger">
          <AlertTriangle />
          <AlertDescription>{acceptance.error instanceof Error ? acceptance.error.message : ""}</AlertDescription>
        </Alert>
      )}
      {acceptance.data && rows.length === 0 && (
        <EmptyState icon={Gauge} title={t("aiScreen.acceptance.empty")} description={t("aiScreen.acceptance.emptyBody")} />
      )}

      {rows.length > 0 && (
        <>
          <p className="mb-2 text-xs text-foreground-muted">
            {t("aiScreen.acceptance.period", { start: acceptance.data?.start ?? startDate, end: acceptance.data?.end ?? endDate })}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
                  <th className="px-2 py-2">{t("aiScreen.acceptance.group")}</th>
                  <th className="px-2 py-2">{t("aiScreen.registry.model")}</th>
                  <th className="px-2 py-2 text-right">{t("aiScreen.acceptance.total")}</th>
                  <th className="px-2 py-2 text-right">{t("aiScreen.acceptance.pending")}</th>
                  <th className="px-2 py-2 text-right">{t("aiScreen.acceptance.approved")}</th>
                  <th className="px-2 py-2 text-right">{t("aiScreen.acceptance.rejected")}</th>
                  <th className="px-2 py-2 text-right">{t("aiScreen.acceptance.overridden")}</th>
                  <th className="px-2 py-2 text-right">{t("aiScreen.acceptance.acceptedRate")}</th>
                  <th className="px-2 py-2 text-right">{t("aiScreen.acceptance.overrideRate")}</th>
                  <th className="px-2 py-2 text-right">{t("aiScreen.acceptance.avgConfidence")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`${row.modelName}-${groupLabel(row)}-${i}`} className="border-b border-border/60">
                    <td className="px-2 py-2 text-foreground">{groupLabel(row)}</td>
                    <td className="px-2 py-2 font-mono text-xs text-foreground-muted">{row.modelName}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{row.total}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{row.pending}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{row.approved}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{row.rejected}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{row.overridden}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {row.reviewed > 0 ? pct(row.acceptedRate, 0) : t("aiScreen.acceptance.noRate")}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {row.reviewed > 0 ? pct(row.overrideRate, 0) : t("aiScreen.acceptance.noRate")}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">{pct(row.avgConfidence, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Panel>
  );
}
