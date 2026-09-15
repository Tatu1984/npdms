"use client";

import * as React from "react";
import { ExternalLink, Loader2, Pencil, Plus, Scale, Search, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState, PageHeader, Panel } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LegacySelect as Select } from "@/components/ui/select";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/stores/toastStore";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import {
  useActSections,
  useAddSection,
  useCreateAct,
  useDebounced,
  useLegalActs,
  useRetireAct,
  useRetireSection,
  useSectionSearch,
  useUpdateAct,
  useUpdateSection,
} from "@/hooks/use-legal";
import type { ActInput, LegalAct, LegalSection, SectionInput } from "@/lib/api/legal";
import { formatDate } from "@/lib/utils";

type Dialog =
  | { kind: "addAct" }
  | { kind: "correctAct"; act: LegalAct }
  | { kind: "retireAct"; act: LegalAct }
  | { kind: "addSection"; act: LegalAct }
  | { kind: "correctSection"; section: LegalSection }
  | { kind: "retireSection"; section: LegalSection }
  | null;

export default function LegalSectionsPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const canManage = Boolean(user && hasMinimumRole(user.role, "SP"));
  const [showRetired, setShowRetired] = React.useState(false);
  const acts = useLegalActs(showRetired);
  const [actId, setActId] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [filter, setFilter] = React.useState("");
  const [dialog, setDialog] = React.useState<Dialog>(null);

  const act = (acts.data ?? []).find((a) => a.id === actId) ?? acts.data?.[0] ?? null;
  const sections = useActSections(act?.id ?? "", page, showRetired);
  const debouncedFilter = useDebounced(filter, 250);
  const filtered = useSectionSearch(debouncedFilter, act?.code ?? "");
  const rows = debouncedFilter.trim() ? (filtered.data ?? []) : (sections.data?.data ?? []);
  const totalPages = sections.data?.totalPages ?? 1;

  const selectAct = (id: string) => {
    setActId(id);
    setPage(1);
    setFilter("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={t("legalScreen.library.title")}
          description={t("legalScreen.library.description")}
          icon={Scale}
          breadcrumb={[{ label: t("legalScreen.library.back"), href: "/settings" }, { label: t("legalScreen.library.title") }]}
          actions={
            canManage ? (
              <Button onClick={() => setDialog({ kind: "addAct" })}>
                <Plus className="mr-2 h-4 w-4" />
                {t("legalScreen.library.addAct")}
              </Button>
            ) : undefined
          }
        />
        {!canManage && <p className="text-sm text-foreground-muted">{t("legalScreen.library.readOnlyNote")}</p>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Panel
            title={t("legalScreen.library.acts")}
            actions={
              <label className="flex items-center gap-2 text-xs text-foreground-muted">
                <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} />
                {t("legalScreen.library.showRetired")}
              </label>
            }
            bodyClassName="p-0"
          >
            {acts.isPending && (
              <div className="flex items-center gap-2 p-4 text-sm text-foreground-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {acts.isError && <p className="p-4 text-sm text-error">{t("legalScreen.library.loadFailed")}</p>}
            <ul className="divide-y divide-border" data-testid="acts">
              {(acts.data ?? []).map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => selectAct(a.id)}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-background-tertiary ${
                      act?.id === a.id ? "bg-background-tertiary" : ""
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">{a.shortName}</span>
                      <span className="block text-xs text-foreground-muted">
                        {t("legalScreen.library.sectionCount", { n: a.sectionCount })} ·{" "}
                        {a.completeness === "complete" ? t("legalScreen.library.complete") : t("legalScreen.library.selected")}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {a.isBuiltin ? (
                        <Badge variant="secondary">{t("legalScreen.library.builtin")}</Badge>
                      ) : (
                        <Badge variant="outline">{t("legalScreen.library.custom")}</Badge>
                      )}
                      {a.status === "retired" && <Badge variant="warning">{t("legalScreen.library.retired")}</Badge>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="space-y-6 lg:col-span-2">
            {act && (
              <Panel
                title={act.name}
                description={
                  act.repealedFrom
                    ? `${t("legalScreen.library.repealedFrom", { date: formatDate(act.repealedFrom) })} · ${t(
                        "legalScreen.library.appliesBefore",
                        { date: formatDate(act.repealedFrom) },
                      )}`
                    : t("legalScreen.library.inForce")
                }
                actions={
                  canManage && act.status === "active" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => setDialog({ kind: "addSection", act })}>
                        <Plus className="mr-1 h-4 w-4" />
                        {t("legalScreen.library.addSection")}
                      </Button>
                      {!act.isBuiltin && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => setDialog({ kind: "correctAct", act })}>
                            <Pencil className="mr-1 h-4 w-4" />
                            {t("legalScreen.library.correct")}
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => setDialog({ kind: "retireAct", act })}>
                            <Trash2 className="mr-1 h-4 w-4" />
                            {t("legalScreen.library.retire")}
                          </Button>
                        </>
                      )}
                    </div>
                  ) : undefined
                }
              >
                <dl className="space-y-1 text-sm">
                  <div>
                    <dt className="inline text-foreground-muted">{t("legalScreen.library.source")}: </dt>
                    <dd className="inline text-foreground">{act.source}</dd>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-muted">
                    {act.sourceUrl && (
                      <a href={act.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
                        <ExternalLink className="h-3 w-3" />
                        {new URL(act.sourceUrl).host}
                      </a>
                    )}
                    {act.retrievedOn && <span>{t("legalScreen.library.retrieved", { date: formatDate(act.retrievedOn) })}</span>}
                    {act.actNumber && <span>Act {act.actNumber}</span>}
                    {act.retiredReason && <span>{t("legalScreen.library.retiredReason", { reason: act.retiredReason })}</span>}
                  </div>
                </dl>
              </Panel>
            )}

            {act && (
              <Panel title={t("legalScreen.library.sections")} bodyClassName="p-0">
                <div className="border-b border-border p-3">
                  <Input
                    placeholder={t("legalScreen.library.searchPlaceholder")}
                    value={filter}
                    onChange={setFilter}
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>
                {(sections.isPending || filtered.isFetching) && rows.length === 0 && (
                  <div className="flex items-center gap-2 p-4 text-sm text-foreground-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
                {!sections.isPending && rows.length === 0 && !filtered.isFetching && (
                  <div className="p-4">
                    <EmptyState title={t("legalScreen.library.noSections")} />
                  </div>
                )}
                <ul className="divide-y divide-border" data-testid="sections">
                  {rows.map((s) => (
                    <li key={s.id} className="flex items-start justify-between gap-3 px-4 py-2">
                      <div className="min-w-0">
                        <span className="font-mono text-sm text-foreground">{s.cite}</span>
                        <span className="ml-2 text-sm text-foreground-muted">{s.heading}</span>
                        <div className="text-xs text-foreground-subtle">
                          {!s.isBuiltin && `${t("legalScreen.library.custom")} · ${s.createdByName}`}
                          {s.status === "retired" && s.retiredReason && ` · ${t("legalScreen.library.retiredReason", { reason: s.retiredReason })}`}
                          {s.description && ` · ${s.description}`}
                        </div>
                      </div>
                      {canManage && !s.isBuiltin && s.status !== "retired" && (
                        <div className="flex shrink-0 gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "correctSection", section: s })}>
                            {t("legalScreen.library.correct")}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "retireSection", section: s })}>
                            {t("legalScreen.library.retire")}
                          </Button>
                        </div>
                      )}
                      {s.status === "retired" && <Badge variant="warning">{t("legalScreen.library.retired")}</Badge>}
                    </li>
                  ))}
                </ul>
                {!debouncedFilter.trim() && totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border px-4 py-2 text-sm">
                    <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      {t("legalScreen.library.previous")}
                    </Button>
                    <span className="text-foreground-muted">{t("legalScreen.library.page", { page, pages: totalPages })}</span>
                    <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      {t("legalScreen.library.next")}
                    </Button>
                  </div>
                )}
              </Panel>
            )}
          </div>
        </div>
      </div>

      {dialog?.kind === "addAct" && <ActDialog onClose={() => setDialog(null)} onSaved={(a) => selectAct(a.id)} />}
      {dialog?.kind === "correctAct" && <ActDialog act={dialog.act} onClose={() => setDialog(null)} />}
      {dialog?.kind === "addSection" && <SectionDialog act={dialog.act} onClose={() => setDialog(null)} />}
      {dialog?.kind === "correctSection" && <SectionDialog section={dialog.section} onClose={() => setDialog(null)} />}
      {dialog?.kind === "retireAct" && (
        <RetireDialog title={t("legalScreen.library.dialogs.retireAct", { code: dialog.act.code })} target={{ act: dialog.act }} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "retireSection" && (
        <RetireDialog
          title={t("legalScreen.library.dialogs.retireSection", { cite: dialog.section.cite })}
          target={{ section: dialog.section }}
          onClose={() => setDialog(null)}
        />
      )}
    </DashboardLayout>
  );
}

const failure = (err: unknown) => (err instanceof Error ? err.message : "The server rejected the request");

function ActDialog({ act, onClose, onSaved }: { act?: LegalAct; onClose: () => void; onSaved?: (a: LegalAct) => void }) {
  const { t } = useI18n();
  const create = useCreateAct();
  const update = useUpdateAct();
  const [form, setForm] = React.useState({
    code: act?.code ?? "",
    citation: act?.citation ?? "",
    shortName: act?.shortName ?? "",
    name: act?.name ?? "",
    year: act?.year ? String(act.year) : "",
    actNumber: act?.actNumber ?? "",
    source: act?.source ?? "",
    sourceUrl: act?.sourceUrl ?? "",
    completeness: act?.completeness ?? "selected",
    reason: "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const pending = create.isPending || update.isPending;

  const save = async () => {
    const input: ActInput = {
      citation: form.citation,
      shortName: form.shortName,
      name: form.name,
      year: form.year ? Number(form.year) : null,
      actNumber: form.actNumber || null,
      source: form.source,
      sourceUrl: form.sourceUrl || null,
      completeness: form.completeness as ActInput["completeness"],
      reason: form.reason,
    };
    try {
      const saved = act ? await update.mutateAsync({ id: act.id, input }) : await create.mutateAsync({ ...input, code: form.code });
      toast.success(t("legalScreen.library.toasts.saved"), saved.shortName);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      toast.error(t("legalScreen.library.toasts.failed"), failure(err));
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title={act ? t("legalScreen.library.dialogs.correctAct", { code: act.code }) : t("legalScreen.library.dialogs.addAct")}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {!act && (
          <Input label={t("legalScreen.library.fields.code")} hint={t("legalScreen.library.fields.codeHint")} value={form.code} onChange={(v) => set("code")(v.toUpperCase())} />
        )}
        <Input label={t("legalScreen.library.fields.citation")} hint={t("legalScreen.library.fields.citationHint")} value={form.citation} onChange={set("citation")} />
        <Input label={t("legalScreen.library.fields.shortName")} value={form.shortName} onChange={set("shortName")} />
        <Input label={t("legalScreen.library.fields.name")} value={form.name} onChange={set("name")} />
        <Input label={t("legalScreen.library.fields.year")} type="number" value={form.year} onChange={set("year")} />
        <Input label={t("legalScreen.library.fields.actNumber")} value={form.actNumber} onChange={set("actNumber")} />
        <Input label={t("legalScreen.library.fields.source")} hint={t("legalScreen.library.fields.sourceHint")} value={form.source} onChange={set("source")} />
        <Input label={t("legalScreen.library.fields.sourceUrl")} value={form.sourceUrl} onChange={set("sourceUrl")} />
        <Select
          label={t("legalScreen.library.fields.completeness")}
          value={form.completeness}
          onChange={(v: string) => set("completeness")(v)}
          options={[
            { value: "selected", label: t("legalScreen.library.selected") },
            { value: "complete", label: t("legalScreen.library.complete") },
          ]}
        />
      </div>
      <div className="mt-4">
        <Textarea label={t("legalScreen.library.fields.reason")} hint={t("legalScreen.library.fields.reasonHint")} rows={2} value={form.reason} onChange={set("reason")} />
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {t("legalScreen.library.dialogs.cancel")}
        </Button>
        <Button onClick={save} disabled={pending}>
          {pending ? t("legalScreen.library.dialogs.saving") : t("legalScreen.library.dialogs.save")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function SectionDialog({ act, section, onClose }: { act?: LegalAct; section?: LegalSection; onClose: () => void }) {
  const { t } = useI18n();
  const add = useAddSection();
  const update = useUpdateSection();
  const [form, setForm] = React.useState({
    number: section?.number ?? "",
    heading: section?.heading ?? "",
    description: section?.description ?? "",
    reason: "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const pending = add.isPending || update.isPending;

  const save = async () => {
    const input: SectionInput = {
      number: form.number,
      heading: form.heading,
      description: form.description || null,
      reason: form.reason,
    };
    try {
      const saved = section
        ? await update.mutateAsync({ id: section.id, input })
        : await add.mutateAsync({ actId: (act as LegalAct).id, input });
      toast.success(t("legalScreen.library.toasts.saved"), `${saved.cite} — ${saved.heading}`);
      onClose();
    } catch (err) {
      toast.error(t("legalScreen.library.toasts.failed"), failure(err));
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={
        section
          ? t("legalScreen.library.dialogs.correctSection", { cite: section.cite })
          : t("legalScreen.library.dialogs.addSection", { act: act?.shortName ?? "" })
      }
    >
      <div className="space-y-4">
        <Input label={t("legalScreen.library.fields.number")} hint={t("legalScreen.library.fields.numberHint")} value={form.number} onChange={set("number")} />
        <Input label={t("legalScreen.library.fields.heading")} value={form.heading} onChange={set("heading")} />
        <Textarea label={t("legalScreen.library.fields.description")} rows={2} value={form.description} onChange={set("description")} />
        <Textarea label={t("legalScreen.library.fields.reason")} hint={t("legalScreen.library.fields.reasonHint")} rows={2} value={form.reason} onChange={set("reason")} />
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {t("legalScreen.library.dialogs.cancel")}
        </Button>
        <Button onClick={save} disabled={pending}>
          {pending ? t("legalScreen.library.dialogs.saving") : t("legalScreen.library.dialogs.save")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function RetireDialog({
  title,
  target,
  onClose,
}: {
  title: string;
  target: { act?: LegalAct; section?: LegalSection };
  onClose: () => void;
}) {
  const { t } = useI18n();
  const retireAct = useRetireAct();
  const retireSection = useRetireSection();
  const [reason, setReason] = React.useState("");
  const pending = retireAct.isPending || retireSection.isPending;

  const save = async () => {
    try {
      if (target.act) await retireAct.mutateAsync({ id: target.act.id, reason });
      if (target.section) await retireSection.mutateAsync({ id: target.section.id, reason });
      toast.success(t("legalScreen.library.toasts.saved"), title);
      onClose();
    } catch (err) {
      toast.error(t("legalScreen.library.toasts.failed"), failure(err));
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={title} description={t("legalScreen.library.dialogs.retireBody")}>
      <Textarea label={t("legalScreen.library.fields.reason")} hint={t("legalScreen.library.fields.reasonHint")} rows={3} value={reason} onChange={setReason} />
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {t("legalScreen.library.dialogs.cancel")}
        </Button>
        <Button onClick={save} disabled={pending}>
          {pending ? t("legalScreen.library.dialogs.saving") : t("legalScreen.library.retire")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
