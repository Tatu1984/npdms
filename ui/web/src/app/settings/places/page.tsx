"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Loader2, MapPinned, Plus } from "lucide-react";
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
import { useAddPlace, useOfficerPlaces, useRetirePlace } from "@/hooks/use-legal";
import { PLACE_KINDS, type GazetteerPlace, type PlaceKind } from "@/lib/api/legal";
import { KOLKATA_CENTER } from "@/lib/platform/wb";
import { formatDateTime } from "@/lib/utils";

const InteractiveMap = dynamic(() => import("@/components/ui/Map").then((m) => m.InteractiveMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-background-tertiary" />,
});

const kindKey = (kind: PlaceKind) => `legalScreen.location.kinds.${kind}` as "legalScreen.location.kinds.locality";
const failure = (err: unknown) => (err instanceof Error ? err.message : "The server rejected the request");

export default function MapPlacesPage() {
  const { t } = useI18n();
  const { user } = useAuthStore();
  const canManage = Boolean(user && hasMinimumRole(user.role, "SP"));
  const [page, setPage] = React.useState(1);
  const places = useOfficerPlaces(page);
  const [adding, setAdding] = React.useState(false);
  const [retiring, setRetiring] = React.useState<GazetteerPlace | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={t("legalScreen.places.title")}
          description={t("legalScreen.places.description")}
          icon={MapPinned}
          breadcrumb={[{ label: t("legalScreen.library.back"), href: "/settings" }, { label: t("legalScreen.places.title") }]}
          actions={
            canManage ? (
              <Button onClick={() => setAdding(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("legalScreen.places.add")}
              </Button>
            ) : undefined
          }
        />
        {!canManage && <p className="text-sm text-foreground-muted">{t("legalScreen.library.readOnlyNote")}</p>}

        <Panel bodyClassName="p-0" footer={<span className="text-xs text-foreground-subtle">{t("legalScreen.location.attribution")}</span>}>
          {places.isPending && (
            <div className="flex items-center gap-2 p-4 text-sm text-foreground-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {places.data && places.data.data.length === 0 && (
            <div className="p-4">
              <EmptyState title={t("legalScreen.places.empty")} icon={MapPinned} />
            </div>
          )}
          <ul className="divide-y divide-border" data-testid="officer-places">
            {(places.data?.data ?? []).map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">
                    {p.name}
                    {p.nameBn && <span className="ml-2 text-foreground-muted">{p.nameBn}</span>}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    {t(kindKey(p.kind))}
                    {p.pin && ` · ${p.pin}`} · {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)} ·{" "}
                    {t("legalScreen.places.addedBy", { name: p.createdByName })} · {formatDateTime(p.createdAt)}
                  </div>
                  {p.note && <div className="text-xs text-foreground-subtle">{p.note}</div>}
                  {p.status === "retired" && p.decisionReason && (
                    <div className="text-xs text-foreground-subtle">{t("legalScreen.library.retiredReason", { reason: p.decisionReason })}</div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={p.status === "active" ? "success" : "warning"}>
                    {p.status === "active" ? t("legalScreen.places.active") : t("legalScreen.places.retired")}
                  </Badge>
                  {canManage && p.status === "active" && (
                    <Button size="sm" variant="ghost" onClick={() => setRetiring(p)}>
                      {t("legalScreen.places.retire")}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {(places.data?.totalPages ?? 1) > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-2 text-sm">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>
                {t("legalScreen.library.previous")}
              </Button>
              <span className="text-foreground-muted">
                {t("legalScreen.library.page", { page, pages: places.data?.totalPages ?? 1 })}
              </span>
              <Button size="sm" variant="secondary" disabled={page >= (places.data?.totalPages ?? 1)} onClick={() => setPage((n) => n + 1)}>
                {t("legalScreen.library.next")}
              </Button>
            </div>
          )}
        </Panel>
      </div>

      {adding && <AddPlaceDialog onClose={() => setAdding(false)} />}
      {retiring && <RetirePlaceDialog place={retiring} onClose={() => setRetiring(null)} />}
    </DashboardLayout>
  );
}

function AddPlaceDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const add = useAddPlace();
  const [form, setForm] = React.useState({ kind: "locality" as PlaceKind, name: "", nameBn: "", pin: "", reason: "" });
  const [point, setPoint] = React.useState<{ lat: number; lng: number } | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const onPin = React.useCallback((lat: number, lng: number) => setPoint({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) }), []);

  const save = async () => {
    if (!point) {
      toast.error(t("legalScreen.library.toasts.failed"), t("legalScreen.places.pinRequired"));
      return;
    }
    try {
      const saved = await add.mutateAsync({
        kind: form.kind,
        name: form.name,
        nameBn: form.nameBn || null,
        pin: form.pin || null,
        latitude: point.lat,
        longitude: point.lng,
        reason: form.reason,
      });
      toast.success(t("legalScreen.library.toasts.saved"), saved.name);
      onClose();
    } catch (err) {
      toast.error(t("legalScreen.library.toasts.failed"), failure(err));
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="lg" title={t("legalScreen.places.add")}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select
          label={t("legalScreen.places.kind")}
          value={form.kind}
          onChange={(v: string) => set("kind")(v)}
          options={PLACE_KINDS.map((k) => ({ value: k, label: t(kindKey(k)) }))}
        />
        <Input label={t("legalScreen.places.name")} value={form.name} onChange={set("name")} />
        <Input label={t("legalScreen.places.nameBn")} value={form.nameBn} onChange={set("nameBn")} />
        <Input label={t("legalScreen.places.pin")} value={form.pin} onChange={(v) => set("pin")(v.replace(/\D/g, "").slice(0, 6))} />
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-sm font-medium text-foreground">{t("legalScreen.places.location")}</p>
        <p className="text-xs text-foreground-muted">{t("legalScreen.places.locationHint")}</p>
        <div className="relative isolate z-0 h-64 overflow-hidden rounded-lg border border-border" data-testid="place-map">
          <InteractiveMap center={[KOLKATA_CENTER.lat, KOLKATA_CENTER.lng]} zoom={12} height="16rem" pin={point} onPinChange={onPin} />
        </div>
        <p className="font-mono text-xs text-foreground-muted">
          {point ? `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : t("legalScreen.location.noPin")}
        </p>
      </div>
      <div className="mt-4">
        <Textarea label={t("legalScreen.places.reason")} hint={t("legalScreen.library.fields.reasonHint")} rows={2} value={form.reason} onChange={set("reason")} />
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {t("legalScreen.library.dialogs.cancel")}
        </Button>
        <Button onClick={save} disabled={add.isPending}>
          {add.isPending ? t("legalScreen.library.dialogs.saving") : t("legalScreen.library.dialogs.save")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function RetirePlaceDialog({ place, onClose }: { place: GazetteerPlace; onClose: () => void }) {
  const { t } = useI18n();
  const retire = useRetirePlace();
  const [reason, setReason] = React.useState("");
  const save = async () => {
    try {
      await retire.mutateAsync({ id: place.id, reason });
      toast.success(t("legalScreen.library.toasts.saved"), place.name);
      onClose();
    } catch (err) {
      toast.error(t("legalScreen.library.toasts.failed"), failure(err));
    }
  };
  return (
    <Modal isOpen onClose={onClose} title={`${t("legalScreen.places.retire")}: ${place.name}`} description={t("legalScreen.library.dialogs.retireBody")}>
      <Textarea label={t("legalScreen.places.reason")} rows={3} value={reason} onChange={setReason} />
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {t("legalScreen.library.dialogs.cancel")}
        </Button>
        <Button onClick={save} disabled={retire.isPending}>
          {t("legalScreen.places.retire")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
