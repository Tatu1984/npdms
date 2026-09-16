"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileSearch,
  ImagePlus,
  Inbox,
  Radio,
  Search,
  ShieldAlert,
  UserPlus,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import {
  GENDERS,
  PHOTO_MAX_BYTES,
  PHOTO_SOURCES,
  PHOTO_TYPES,
  VULNERABILITIES,
  type PhotoSource,
  type Gender,
  type MissingPerson,
  type MissingPersonStatus,
  type Vulnerability,
} from "@/lib/api/missing-persons";
import {
  useMissingPersons,
  useMissingPersonStats,
  useRegisterMissingPerson,
  useUploadPhoto,
} from "@/hooks/use-missing-persons";
import { LocationPicker, type LocationValue } from "@/components/ui/LocationPicker";
import { DataTable, type Column } from "@/components/platform/data-table";
import { act, type Action } from "@/components/platform/actions";
import { EmptyState, PageHeader, PhaseBadge, StatTile, StatusPill } from "@/components/platform/primitives";
import { SharedRegisterNote } from "@/components/platform/force";
import { OfficerPicker, RecordLinkPicker, type RecordLink } from "@/components/platform/pickers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import { GENDER, L, PRIORITY, STATUS, VULNERABILITY } from "./labels";
import { errorMessage, Field, selectClass, toApiTime } from "./shared";
import { PersonThumb } from "./photos";

const PAGE_SIZE = 20;

export default function MissingPersonsPage() {
  const router = useRouter();
  const { t, pick } = useI18n();
  const { user } = useAuthStore();
  const uploadPhoto = useUploadPhoto();
  const [photoFailure, setPhotoFailure] = React.useState<{ id: string; message: string } | null>(null);
  const canRegister = Boolean(user && hasMinimumRole(user.role, "ASI"));

  const [search, setSearch] = React.useState("");
  const deferredSearch = React.useDeferredValue(search.trim());
  const [status, setStatus] = React.useState<MissingPersonStatus | "">("");
  const [vulnerable, setVulnerable] = React.useState(false);
  const [overdue, setOverdue] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [registerOpen, setRegisterOpen] = React.useState(false);

  React.useEffect(() => setPage(1), [deferredSearch, status, vulnerable, overdue]);

  const list = useMissingPersons({
    page,
    pageSize: PAGE_SIZE,
    search: deferredSearch || undefined,
    status: status || undefined,
    vulnerable,
    overdue,
  });
  const stats = useMissingPersonStats();
  const register = useRegisterMissingPerson();

  const rows = list.data?.data ?? [];
  const totalPages = list.data?.totalPages ?? 0;
  const s = stats.data;

  const columns: Column<MissingPerson>[] = [
    {
      id: "person",
      header: pick(L.person),
      cell: (p) => (
        <div className="flex min-w-0 items-center gap-3">
          <PersonThumb reportId={p.id} photoId={p.primaryPhotoId} name={p.personName} />
          <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {p.personName}
            {p.masked && <span className="ml-2 text-xs font-normal text-foreground-subtle">({pick(L.masked)})</span>}
          </p>
          <p className="mt-0.5 font-mono text-xs text-foreground-subtle">{p.reportNumber}</p>
          </div>
        </div>
      ),
    },
    {
      id: "profile",
      header: pick(L.ageSex),
      hideBelow: "sm",
      cell: (p) => (
        <span className="text-sm">
          {p.age} · {GENDER[p.gender] ? pick(GENDER[p.gender]) : p.gender}
        </span>
      ),
    },
    {
      id: "lastSeen",
      header: pick(L.lastSeen),
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{p.lastSeenLocation}</p>
          <p className="text-xs text-foreground-subtle">
            {new Date(p.lastSeenAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
      ),
    },
    {
      id: "station",
      header: pick(L.station),
      hideBelow: "lg",
      cell: (p) => <span className="text-sm">{p.stationName || "—"}</span>,
    },
    {
      id: "progress",
      header: pick(L.progress),
      hideBelow: "md",
      cell: (p) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {p.checklistTotal > 0 && (
            <StatusPill tone={p.checklistOverdue > 0 ? "danger" : "neutral"}>
              {p.checklistDone}/{p.checklistTotal} {pick(L.checklistShort)}
              {p.checklistOverdue > 0 && ` · ${p.checklistOverdue} ${pick(L.overdueSteps)}`}
            </StatusPill>
          )}
          {p.verifiedSightings > 0 && (
            <StatusPill tone="success">
              <CheckCircle2 className="h-3 w-3" />
              {p.verifiedSightings} {pick(L.sightingsShort)}
            </StatusPill>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: pick(L.status),
      cell: (p) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill tone={STATUS[p.status].tone}>{pick(STATUS[p.status])}</StatusPill>
          <div className="flex flex-wrap gap-1">
            {p.priority !== "NORMAL" && <StatusPill tone={PRIORITY[p.priority].tone}>{pick(PRIORITY[p.priority])}</StatusPill>}
            {p.vulnerabilities.map((v) => (
              <StatusPill key={v} tone="warning">
                {pick(VULNERABILITY[v])}
              </StatusPill>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const rowActions = (p: MissingPerson): Action[] => [
    act.label("h", p.reportNumber),
    act.link("open", pick(L.overview), `/missing-persons/${p.id}`, { icon: FileSearch }),
    act.link("checklist", pick(L.checklist), `/missing-persons/${p.id}?tab=checklist`, { icon: ClipboardList }),
    act.link("sightings", pick(L.sightings), `/missing-persons/${p.id}?tab=sightings`, { icon: Users }),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.missingPersons")}
          description={t("modules.missingPersonsDesc")}
          icon={FileSearch}
          badge={<PhaseBadge phase={4} />}
          breadcrumb={[{ label: t("nav.surveillanceGroup") }, { label: t("modules.missingPersons") }]}
          actions={
            <>
              <Button variant="outline" onClick={() => router.push("/missing-persons/board")} data-testid="open-board">
                <Radio className="h-4 w-4" />
                {t("missingBoard.board.open")}
              </Button>
              {canRegister && (
                <Button onClick={() => setRegisterOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                  {pick(L.register)}
                </Button>
              )}
            </>
          }
          menu={[
            act.link("lookout", pick(L.lookoutRegister), "/lookout", { icon: Users }),
            act.link("audit", pick(L.audit), "/audit", { icon: ClipboardList }),
          ]}
        />

        {/* A missing child does not stop being missing at a jurisdiction
            boundary, so this register is one of the four every force sees. */}
        <SharedRegisterNote />

        {photoFailure && (
          <Alert variant="danger">
            <AlertTriangle />
            <div>
              <AlertTitle>{pick(L.photoNotAdded)}</AlertTitle>
              <AlertDescription>
                {photoFailure.message}
                <Button size="sm" variant="outline" className="mt-2" onClick={() => router.push(`/missing-persons/${photoFailure.id}`)}>
                  {pick(L.overview)}
                </Button>
              </AlertDescription>
            </div>
          </Alert>
        )}

        <Alert variant="info">
          <ShieldAlert />
          <div>
            <AlertTitle>{pick(L.nationalTitle)}</AlertTitle>
            <AlertDescription>{pick(L.nationalDesc)}</AlertDescription>
          </div>
        </Alert>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <StatTile label={pick(L.awaiting)} value={s?.reported ?? 0} icon={Inbox} tone="warning" onClick={() => setStatus("REPORTED")} />
          <StatTile label={pick(L.searching)} value={s?.searching ?? 0} icon={FileSearch} tone="info" onClick={() => setStatus("SEARCHING")} />
          <StatTile label={pick(L.critical)} value={s?.critical ?? 0} icon={AlertTriangle} tone="danger" />
          <StatTile label={pick(L.overdue)} value={s?.overdueChecklist ?? 0} icon={Clock} tone="danger" onClick={() => setOverdue(true)} />
          <StatTile label={pick(L.unverified)} value={s?.unverifiedSightings ?? 0} icon={Users} tone="warning" />
          <StatTile label={pick(L.foundRecent)} value={s?.foundLast30Days ?? 0} icon={CheckCircle2} tone="success" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[16rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
            <Input
              aria-label={pick(L.searchPlaceholder)}
              value={search}
              onChange={(v: string) => setSearch(v)}
              placeholder={pick(L.searchPlaceholder)}
              className="pl-9"
            />
          </div>
          <select
            aria-label={pick(L.status)}
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as MissingPersonStatus | "")}
          >
            <option value="">{pick(L.allStatuses)}</option>
            {(Object.keys(STATUS) as MissingPersonStatus[]).map((k) => (
              <option key={k} value={k}>
                {pick(STATUS[k])}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={vulnerable} onCheckedChange={(c) => setVulnerable(c === true)} />
            {pick(L.vulnerableOnly)}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={overdue} onCheckedChange={(c) => setOverdue(c === true)} />
            {pick(L.overdueOnly)}
          </label>
        </div>

        {list.isError ? (
          <Alert variant="danger">
            <AlertTriangle />
            <div>
              <AlertTitle>{pick(L.loadFailed)}</AlertTitle>
              <AlertDescription>
                {errorMessage(list.error) ?? t("common.error")}
                <Button variant="outline" size="sm" className="mt-2" onClick={() => list.refetch()}>
                  {pick(L.retry)}
                </Button>
              </AlertDescription>
            </div>
          </Alert>
        ) : list.isLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title={pick(L.noReports)} description={pick(L.noReportsDesc)} icon={FileSearch} />
        ) : (
          <>
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(p) => p.id}
              rowHref={(p) => `/missing-persons/${p.id}`}
              rowActions={rowActions}
              searchable={false}
            />
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-foreground-muted">
                <span>
                  {pick(L.page)} {page} / {totalPages} · {list.data?.total}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    {pick(L.previous)}
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    {pick(L.next)}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <RegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        pending={register.isPending}
        error={register.error}
        onSubmit={async (input, photo) => {
          const created = await register.mutateAsync(input);
          if (photo) {
            try {
              await uploadPhoto.mutateAsync({ id: created.id, input: photo });
            } catch (err) {
              // The report stands; say plainly that the photograph did not.
              setRegisterOpen(false);
              setPhotoFailure({ id: created.id, message: `${created.reportNumber}: ${errorMessage(err) ?? ""}` });
              return;
            }
          }
          setRegisterOpen(false);
          router.push(`/missing-persons/${created.id}`);
        }}
      />
    </DashboardLayout>
  );
}

function RegisterDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    input: Parameters<ReturnType<typeof useRegisterMissingPerson>["mutateAsync"]>[0],
    photo: Parameters<ReturnType<typeof useUploadPhoto>["mutateAsync"]>[0]["input"] | null,
  ) => Promise<void>;
  pending: boolean;
  error: unknown;
}) {
  const { pick, t } = useI18n();
  const empty = {
    personName: "",
    age: "",
    gender: "FEMALE" as Gender,
    height: "",
    complexion: "",
    identifyingMarks: "",
    lastSeenLocation: "",
    lastSeenAt: "",
    lastSeenWearing: "",
    circumstances: "",
    reporterName: "",
    reporterPhone: "",
    reporterRelation: "",
  };
  const [form, setForm] = React.useState(empty);
  const [flags, setFlags] = React.useState<Vulnerability[]>([]);
  const [officer, setOfficer] = React.useState<{ id: string; name: string } | null>(null);
  const [fir, setFir] = React.useState<RecordLink | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [place, setPlace] = React.useState<LocationValue>({ location: "", latitude: null, longitude: null });
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoSource, setPhotoSource] = React.useState<PhotoSource>("FAMILY");
  const [photoProvider, setPhotoProvider] = React.useState("");
  const [photoRelation, setPhotoRelation] = React.useState("");
  const [photoConsent, setPhotoConsent] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setPlace({ location: "", latitude: null, longitude: null });
      setPhotoFile(null);
      setPhotoSource("FAMILY");
      setPhotoProvider("");
      setPhotoRelation("");
      setPhotoConsent(false);
      setForm(empty);
      setFlags([]);
      setOfficer(null);
      setFir(null);
      setLocalError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (key: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [key]: v }));
  const ageNumber = form.age === "" ? NaN : Number(form.age);
  const isMinor = !Number.isNaN(ageNumber) && ageNumber < 18;
  const effectiveFlags: Vulnerability[] = isMinor && !flags.includes("CHILD") ? ["CHILD", ...flags] : flags;
  const toggle = (v: Vulnerability, on: boolean) =>
    setFlags((prev) => (on ? [...prev.filter((x) => x !== v), v] : prev.filter((x) => x !== v)));

  const submit = async () => {
    setLocalError(null);
    const required = [form.personName, form.age, place.location, form.lastSeenAt, form.reporterName, form.reporterPhone, form.reporterRelation];
    if (required.some((v) => v.trim() === "")) {
      setLocalError(pick(L.requiredMissing));
      return;
    }
    // The photograph's giver defaults to the informant when left blank.
    const provider = (photoProvider || form.reporterName).trim();
    const relation = (photoRelation || form.reporterRelation).trim();
    if (photoFile && (!provider || !relation)) {
      setLocalError(t("missingBoard.upload.required"));
      return;
    }
    const opt = (v: string) => (v.trim() === "" ? null : v.trim());
    try {
      await onSubmit({
        personName: form.personName.trim(),
        age: ageNumber,
        gender: form.gender,
        height: opt(form.height),
        complexion: opt(form.complexion),
        identifyingMarks: opt(form.identifyingMarks),
        lastSeenLocation: place.location.trim(),
        lastSeenLatitude: place.latitude,
        lastSeenLongitude: place.longitude,
        lastSeenAt: toApiTime(form.lastSeenAt),
        lastSeenWearing: opt(form.lastSeenWearing),
        circumstances: opt(form.circumstances),
        vulnerabilities: effectiveFlags,
        reporterName: form.reporterName.trim(),
        reporterPhone: form.reporterPhone.trim(),
        reporterRelation: form.reporterRelation.trim(),
        assignedTo: officer?.id ?? null,
        firId: fir ? (fir.kind === "fir" ? fir.id : fir.firId) : null,
      }, photoFile ? { file: photoFile, source: photoSource, providedByName: provider, relationship: relation, consentRecorded: photoConsent } : null);
    } catch {
      // The mutation error is shown below from `error`.
    }
  };

  const shownError = localError ?? errorMessage(error);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pick(L.register)}</DialogTitle>
          <DialogDescription>{pick(L.registerDesc)}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <section className="grid gap-3 sm:grid-cols-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle sm:col-span-2">{pick(L.personDetails)}</h3>
            <Field id="mp-name" label={`${pick(L.name)} *`}>
              <Input id="mp-name" value={form.personName} onChange={set("personName")} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="mp-age" label={`${pick(L.age)} *`}>
                <Input id="mp-age" type="number" min={0} max={130} value={form.age} onChange={set("age")} />
              </Field>
              <Field id="mp-gender" label={`${pick(L.gender)} *`}>
                <select id="mp-gender" className={selectClass} value={form.gender} onChange={(e) => set("gender")(e.target.value)}>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {pick(GENDER[g])}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field id="mp-height" label={pick(L.height)}>
              <Input id="mp-height" value={form.height} onChange={set("height")} />
            </Field>
            <Field id="mp-complexion" label={pick(L.complexion)}>
              <Input id="mp-complexion" value={form.complexion} onChange={set("complexion")} />
            </Field>
            <Field id="mp-marks" label={pick(L.marks)} wide>
              <Input id="mp-marks" value={form.identifyingMarks} onChange={set("identifyingMarks")} />
            </Field>
            <div className="sm:col-span-2">
              <LocationPicker value={place} onChange={setPlace} label={`${pick(L.lastSeenPlace)} *`} mapHeight="220px" />
            </div>
            <Field id="mp-time" label={`${pick(L.lastSeenTime)} *`}>
              <Input id="mp-time" type="datetime-local" value={form.lastSeenAt} onChange={set("lastSeenAt")} />
            </Field>
            <Field id="mp-wearing" label={pick(L.wearing)} wide>
              <Input id="mp-wearing" value={form.lastSeenWearing} onChange={set("lastSeenWearing")} />
            </Field>
            <Field id="mp-circ" label={pick(L.circumstances)} wide>
              <Textarea id="mp-circ" rows={2} value={form.circumstances} onChange={set("circumstances")} />
            </Field>
          </section>

          <section className="grid gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">{pick(L.vulnerabilities)}</h3>
            <div className="flex flex-wrap gap-4">
              {VULNERABILITIES.map((v) => {
                const forced = v === "CHILD" && isMinor;
                return (
                  <label key={v} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      aria-label={pick(VULNERABILITY[v])}
                      checked={forced || flags.includes(v)}
                      disabled={forced}
                      onCheckedChange={(c) => toggle(v, c === true)}
                    />
                    {pick(VULNERABILITY[v])}
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-foreground-subtle">{pick(L.vulnerabilityHint)}</p>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle sm:col-span-3">{pick(L.informant)}</h3>
            <Field id="mp-rname" label={`${pick(L.informantName)} *`}>
              <Input id="mp-rname" value={form.reporterName} onChange={set("reporterName")} />
            </Field>
            <Field id="mp-rphone" label={`${pick(L.informantPhone)} *`}>
              <Input id="mp-rphone" type="tel" value={form.reporterPhone} onChange={set("reporterPhone")} />
            </Field>
            <Field id="mp-rrel" label={`${pick(L.relation)} *`}>
              <Input id="mp-rrel" value={form.reporterRelation} onChange={set("reporterRelation")} />
            </Field>
          </section>

          <section className="grid gap-3 sm:grid-cols-2" data-testid="register-photo">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-subtle sm:col-span-2">
              <ImagePlus className="h-3.5 w-3.5" />
              {pick(L.photoOptional)}
            </h3>
            <p className="text-xs text-foreground-muted sm:col-span-2">{t("missingBoard.upload.description")}</p>
            <div className="grid gap-1.5 sm:col-span-2">
              <label htmlFor="mp-photo" className="text-sm font-medium text-foreground">{t("missingBoard.upload.file")}</label>
              <input
                id="mp-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setLocalError(null);
                  if (!f) return setPhotoFile(null);
                  if (!PHOTO_TYPES.includes(f.type)) return setLocalError(t("missingBoard.upload.wrongType"));
                  if (f.size > PHOTO_MAX_BYTES) return setLocalError(t("missingBoard.upload.tooLarge"));
                  setPhotoFile(f);
                }}
                className="text-sm text-foreground-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-background-secondary file:px-3 file:py-1.5 file:text-sm file:text-foreground"
              />
            </div>
            {photoFile && (
              <>
                <Field id="mp-photo-source" label={t("missingBoard.upload.source")}>
                  <select id="mp-photo-source" className={selectClass} value={photoSource} onChange={(e) => setPhotoSource(e.target.value as PhotoSource)}>
                    {PHOTO_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {t(`missingBoard.photos.source.${s}`)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="mp-photo-provider" label={t("missingBoard.upload.providerName")}>
                  <Input id="mp-photo-provider" placeholder={form.reporterName} value={photoProvider} onChange={(v: string) => setPhotoProvider(v)} />
                </Field>
                <Field id="mp-photo-relation" label={t("missingBoard.upload.relationship")}>
                  <Input id="mp-photo-relation" placeholder={form.reporterRelation} value={photoRelation} onChange={(v: string) => setPhotoRelation(v)} />
                </Field>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <Checkbox checked={photoConsent} onCheckedChange={(c) => setPhotoConsent(c === true)} aria-label={t("missingBoard.upload.consent")} />
                  {t("missingBoard.upload.consent")}
                </label>
              </>
            )}
          </section>

          <section className="grid gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">{pick(L.assignment)}</h3>
            <div className="grid gap-1.5">
              <Label>{pick(L.assignOfficer)}</Label>
              <OfficerPicker value={officer?.id} onChange={(id, name) => setOfficer({ id, name })} />
            </div>
            <div className="grid gap-1.5">
              <Label>{pick(L.linkFir)}</Label>
              <RecordLinkPicker value={fir} onChange={setFir} />
            </div>
          </section>
        </div>

        {shownError && (
          <Alert variant="danger">
            <AlertTriangle />
            <AlertDescription>{shownError}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {pick(L.cancel)}
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? pick(L.saving) : pick(L.submitRegister)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
