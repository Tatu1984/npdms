"use client";

import * as React from "react";
import Link from "next/link";
import { ListPlus, Loader2, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, Panel, StatusPill } from "@/components/platform/primitives";
import { SharedRegisterNote } from "@/components/platform/force";
import { useAddWatch, useRemoveWatch, useWatchlist } from "@/hooks/use-anpr";
import { WATCH_PRIORITIES, type WatchlistEntry, type WatchPriority } from "@/lib/api/anpr";
import { formatDateTime } from "@/lib/utils";
import { toast } from "@/stores/toastStore";
import { LabeledField, errorText, inputClass, localToISO, textareaClass } from "./shared";

function inDays(days: number) {
  const d = new Date(Date.now() + days * 86400_000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function WatchlistPanel({ canManage }: { canManage: boolean }) {
  const { t } = useI18n();
  const [includeClosed, setIncludeClosed] = React.useState(false);
  const list = useWatchlist(includeClosed);
  const add = useAddWatch();
  const remove = useRemoveWatch();
  const [registration, setRegistration] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [priority, setPriority] = React.useState<WatchPriority>("NORMAL");
  const [expiresAt, setExpiresAt] = React.useState(inDays(30));
  const [removing, setRemoving] = React.useState<WatchlistEntry | null>(null);
  const [removeNote, setRemoveNote] = React.useState("");
  const rows = list.data?.data ?? [];

  const save = async () => {
    try {
      await add.mutateAsync({ registrationNumber: registration, reason: reason.trim(), priority, expiresAt: localToISO(expiresAt) });
      toast.success(t("anprScreen.watchlist.added"), registration.toUpperCase());
      setRegistration("");
      setReason("");
    } catch (e) {
      toast.error(t("anprScreen.watchlist.add"), errorText(e));
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync({ id: removing.id, note: removeNote.trim() });
      toast.success(t("anprScreen.watchlist.removed"), removing.registrationNumber);
      setRemoving(null);
      setRemoveNote("");
    } catch (e) {
      toast.error(removing.registrationNumber, errorText(e));
    }
  };

  const tone = (s: WatchlistEntry["status"]) => (s === "ACTIVE" ? "success" : s === "NO_REGISTRATION" ? "warning" : "neutral");

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Stolen and wanted vehicles are a state-wide register, and this is where
          they are read on this screen. The hits on the other tabs are the
          reading force's own cameras, so the line is scoped to the watchlist. */}
      <SharedRegisterNote variant="watchlist" className="lg:col-span-3" />

      <Panel title={t("anprScreen.watchlist.add")} className="lg:col-span-1">
        {canManage ? (
          <div className="flex flex-col gap-3" data-testid="watchlist-form">
            <LabeledField label={t("anprScreen.watchlist.registration")} htmlFor="wl-reg">
              <input id="wl-reg" className={`${inputClass} font-mono uppercase`} value={registration} onChange={(e) => setRegistration(e.target.value)} />
            </LabeledField>
            <LabeledField label={t("anprScreen.watchlist.reason")} htmlFor="wl-reason">
              <textarea id="wl-reason" className={textareaClass} value={reason} onChange={(e) => setReason(e.target.value)} />
            </LabeledField>
            <LabeledField label={t("anprScreen.watchlist.priority")} htmlFor="wl-priority">
              <select id="wl-priority" className={inputClass} value={priority} onChange={(e) => setPriority(e.target.value as WatchPriority)}>
                {WATCH_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </LabeledField>
            <LabeledField label={t("anprScreen.watchlist.expiresAt")} htmlFor="wl-expires">
              <input id="wl-expires" type="datetime-local" className={inputClass} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </LabeledField>
            <Button onClick={save} disabled={add.isPending || registration.trim().length < 4 || reason.trim().length < 10} data-testid="watchlist-add">
              {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />}
              {t("anprScreen.watchlist.save")}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">{t("anprScreen.watchlist.needsSI")}</p>
        )}
      </Panel>

      <Panel
        title={t("anprScreen.watchlist.title")}
        description={t("anprScreen.watchlist.description")}
        className="lg:col-span-2"
        actions={
          <label className="flex items-center gap-2 text-xs text-foreground-muted">
            <input type="checkbox" checked={includeClosed} onChange={(e) => setIncludeClosed(e.target.checked)} />
            {t("anprScreen.watchlist.showClosed")}
          </label>
        }
        bodyClassName="p-0"
      >
        {list.isLoading ? (
          <div className="p-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : list.isError ? (
          <p className="p-4 text-sm text-danger">{errorText(list.error)}</p>
        ) : rows.length === 0 ? (
          <div className="p-4"><EmptyState title={t("anprScreen.watchlist.empty")} /></div>
        ) : (
          <ul className="divide-y divide-border" data-testid="watchlist">
            {rows.map((e) => (
              <li key={`${e.source}-${e.id}-${e.registrationNumber}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-semibold">{e.registrationNumber || "—"}</span>
                    <StatusPill tone={e.source === "LOOKOUT" ? "info" : "neutral"}>{t(`anprScreen.watchlist.source.${e.source}` as const)}</StatusPill>
                    <StatusPill tone={tone(e.status)}>{t(`anprScreen.watchlist.status.${e.status}` as const)}</StatusPill>
                    <StatusPill tone={e.priority === "HIGH" || e.priority === "CRITICAL" ? "danger" : "neutral"}>{e.priority}</StatusPill>
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {e.source === "LOOKOUT" ? (
                      <Link href={`/lookout/${e.lookoutId}`} className="text-accent hover:underline">{e.lookoutNumber}</Link>
                    ) : null}{" "}
                    {e.reason}
                    {e.expiresAt ? ` · ${t("anprScreen.watchlist.expiresAt")} ${formatDateTime(e.expiresAt)}` : ""} ·{" "}
                    {t("anprScreen.watchlist.addedBy", { name: e.addedByName })}
                  </p>
                  {e.status === "NO_REGISTRATION" && <p className="text-xs text-warning">{t("anprScreen.watchlist.noRegistration")}</p>}
                  {e.removalNote && <p className="text-xs text-foreground-subtle">{e.removedByName}: {e.removalNote}</p>}
                </div>
                {canManage && e.source === "WATCHLIST" && !e.removedAt && (
                  <Button size="sm" variant="outline" onClick={() => setRemoving(e)}>
                    <Trash2 className="h-4 w-4" /> {t("anprScreen.watchlist.remove")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Dialog open={Boolean(removing)} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("anprScreen.watchlist.removeTitle", { plate: removing?.registrationNumber ?? "" })}</DialogTitle>
          </DialogHeader>
          <LabeledField label={t("anprScreen.watchlist.removeNote")} htmlFor="wl-remove-note">
            <textarea id="wl-remove-note" className={textareaClass} value={removeNote} onChange={(e) => setRemoveNote(e.target.value)} />
          </LabeledField>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoving(null)}>{t("anprScreen.common.cancel")}</Button>
            <Button onClick={confirmRemove} disabled={remove.isPending || removeNote.trim() === ""}>{t("anprScreen.watchlist.remove")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
