"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n";
import { ApiClientError } from "@/lib/api/client";
import {
  DISPOSAL_TYPES,
  MOVEMENT_TYPES,
  PROPERTY_CATEGORIES,
  type DisposalType,
  type MovementType,
  type PropertyCategory,
  type PropertyItem,
} from "@/lib/api/malkhana";
import {
  useCreateMalkhanaLocation,
  useDispose,
  useMalkhanaLocations,
  useMalkhanaStations,
  useMoveOut,
  useRegisterProperty,
  useRelocate,
  useReseal,
  useReturnMovement,
  useVerifySeal,
} from "@/hooks/use-malkhana";
import { courtApi } from "@/lib/api/court";
import { useQuery } from "@tanstack/react-query";
import { OfficerPicker, RecordLinkPicker, type RecordLink } from "@/components/platform/pickers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/stores/toastStore";
import { useRouter } from "next/navigation";

export const fieldClass =
  "h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

/** Officer-readable message for an API failure. Raw decoder text never reaches the screen. */
export function officerMessage(err: unknown): string {
  if (err instanceof ApiClientError && err.code === 429) {
    return "Too many requests in the last minute. Wait a moment and try again.";
  }
  const msg = err instanceof Error ? err.message : "";
  if (!msg || /^Key: '|Error:Field validation|^json: |cannot unmarshal|^invalid character/.test(msg)) {
    return "Some details are missing or not in the expected form. Check the fields and try again.";
  }
  return msg.charAt(0).toUpperCase() + msg.slice(1);
}

export function formatRupees(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) return "—";
  return "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** Local datetime-input value for a Date. */
export function localInput(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function FormField({ id, label, children, hint }: { id: string; label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-foreground-subtle">{hint}</p>}
    </div>
  );
}

function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert variant="danger" data-testid="dialog-error">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function LocationSelect({
  id,
  value,
  onChange,
  stationId,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  stationId?: string;
}) {
  const { t } = useI18n();
  const locations = useMalkhanaLocations(stationId);
  const list = (locations.data ?? []).filter((l) => l.active);
  return (
    <>
      <select id={id} className={fieldClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {list.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label} · {t("malkhanaScreen.locations.held", { count: l.itemsHeld })}
          </option>
        ))}
      </select>
      {locations.isSuccess && list.length === 0 && (
        <p className="text-xs text-warning">{t("malkhanaScreen.locations.none")}</p>
      )}
      {locations.isError && <p className="text-xs text-danger">{officerMessage(locations.error)}</p>}
    </>
  );
}

/* ------------------------------------------------------------ add location */

export function LocationDialog({ open, onOpenChange, stationId }: { open: boolean; onOpenChange: (o: boolean) => void; stationId?: string }) {
  const { t } = useI18n();
  const create = useCreateMalkhanaLocation();
  const [room, setRoom] = React.useState("");
  const [rack, setRack] = React.useState("");
  const [shelf, setShelf] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      await create.mutateAsync({ stationId, room, rack, shelf });
      toast.success(t("malkhanaScreen.locations.created"), `${room} / ${rack}${shelf ? " / " + shelf : ""}`);
      setRoom("");
      setRack("");
      setShelf("");
      onOpenChange(false);
    } catch (err) {
      setError(officerMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("malkhanaScreen.actions.addLocation")}</DialogTitle>
          <DialogDescription>{t("malkhanaScreen.locations.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField id="loc-room" label={t("malkhanaScreen.locations.room")}>
            <Input id="loc-room" value={room} onChange={setRoom} placeholder={t("malkhanaScreen.locations.roomHint")} />
          </FormField>
          <FormField id="loc-rack" label={t("malkhanaScreen.locations.rack")}>
            <Input id="loc-rack" value={rack} onChange={setRack} placeholder={t("malkhanaScreen.locations.rackHint")} />
          </FormField>
          <FormField id="loc-shelf" label={t("malkhanaScreen.locations.shelf")}>
            <Input id="loc-shelf" value={shelf} onChange={setShelf} placeholder={t("malkhanaScreen.locations.shelfHint")} />
          </FormField>
        </div>
        <ErrorLine message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("malkhanaScreen.actions.cancel")}</Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? t("malkhanaScreen.actions.saving") : t("malkhanaScreen.actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------- register property */

export function RegisterDialog({
  open,
  onOpenChange,
  stationId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  stationId?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const register = useRegisterProperty();
  const [link, setLink] = React.useState<RecordLink | null>(null);
  const [category, setCategory] = React.useState<PropertyCategory>("OTHER");
  const [description, setDescription] = React.useState("");
  const [quantity, setQuantity] = React.useState("1");
  const [unit, setUnit] = React.useState("");
  const [weight, setWeight] = React.useState("");
  const [value, setValue] = React.useState("");
  const [seizedAt, setSeizedAt] = React.useState(() => localInput(new Date()));
  const [seizedPlace, setSeizedPlace] = React.useState("");
  const [seizedBy, setSeizedBy] = React.useState<string>("");
  const [memo, setMemo] = React.useState("");
  const [locationId, setLocationId] = React.useState("");
  const [seal, setSeal] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const qty = Number(quantity);
    const grams = weight.trim() === "" ? null : Number(weight);
    const rupees = value.trim() === "" ? null : Number(value.replace(/,/g, ""));
    if (!link) return setError("Link the property to an FIR or a case.");
    if (!Number.isFinite(qty) || qty <= 0) return setError("Quantity must be a number greater than zero.");
    if (grams !== null && (!Number.isFinite(grams) || grams <= 0)) return setError("Weight must be a number greater than zero.");
    if (rupees !== null && (!Number.isFinite(rupees) || rupees < 0)) return setError("Value must be a positive amount in rupees.");
    if (!locationId) return setError("Choose the storage location.");
    try {
      const item = await register.mutateAsync({
        stationId,
        firId: link.kind === "case" ? link.firId || null : link.id,
        caseId: link.kind === "case" ? link.id : null,
        category,
        description,
        quantity: qty,
        unit,
        weightGrams: grams,
        valuePaise: rupees === null ? null : Math.round(rupees * 100),
        seizedAt: new Date(seizedAt).toISOString(),
        seizedPlace,
        seizedBy: seizedBy || null,
        seizureMemoRef: memo,
        locationId,
        sealNumber: seal,
      });
      toast.success(t("malkhanaScreen.register.created", { number: item.propertyNumber }), item.locationLabel);
      onOpenChange(false);
      router.push(`/malkhana/${item.id}`);
    } catch (err) {
      setError(officerMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("malkhanaScreen.register.title")}</DialogTitle>
          <DialogDescription>{t("malkhanaScreen.register.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <FormField id="rg-link" label={t("malkhanaScreen.register.link")} hint={t("malkhanaScreen.register.linkHint")}>
            <RecordLinkPicker value={link} onChange={setLink} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="rg-category" label={t("malkhanaScreen.register.category")}>
              <select id="rg-category" className={fieldClass} value={category} onChange={(e) => setCategory(e.target.value as PropertyCategory)}>
                {PROPERTY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`malkhanaScreen.category.${c}`)}</option>
                ))}
              </select>
            </FormField>
            <FormField id="rg-memo" label={t("malkhanaScreen.register.memo")} hint={t("malkhanaScreen.register.memoHint")}>
              <Input id="rg-memo" value={memo} onChange={setMemo} />
            </FormField>
          </div>
          <FormField id="rg-desc" label={t("malkhanaScreen.register.detail")}>
            <Textarea id="rg-desc" rows={2} value={description} onChange={setDescription} placeholder={t("malkhanaScreen.register.descriptionHint")} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-4">
            <FormField id="rg-qty" label={t("malkhanaScreen.register.quantity")}>
              <Input id="rg-qty" inputMode="decimal" value={quantity} onChange={setQuantity} />
            </FormField>
            <FormField id="rg-unit" label={t("malkhanaScreen.register.unit")}>
              <Input id="rg-unit" value={unit} onChange={setUnit} placeholder={t("malkhanaScreen.register.unitHint")} />
            </FormField>
            <FormField
              id="rg-weight"
              label={category === "NARCOTICS" ? t("malkhanaScreen.register.weightRequired") : t("malkhanaScreen.register.weight")}
            >
              <Input id="rg-weight" inputMode="decimal" value={weight} onChange={setWeight} />
            </FormField>
            <FormField id="rg-value" label={t("malkhanaScreen.register.value")}>
              <Input id="rg-value" inputMode="decimal" value={value} onChange={setValue} />
            </FormField>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="rg-seized-at" label={t("malkhanaScreen.register.seizedAt")}>
              <input id="rg-seized-at" type="datetime-local" className={fieldClass} value={seizedAt} onChange={(e) => setSeizedAt(e.target.value)} />
            </FormField>
            <FormField id="rg-place" label={t("malkhanaScreen.register.seizedPlace")}>
              <Input id="rg-place" value={seizedPlace} onChange={setSeizedPlace} placeholder={t("malkhanaScreen.register.seizedPlaceHint")} />
            </FormField>
          </div>
          <FormField id="rg-by" label={t("malkhanaScreen.register.seizedBy")} hint={t("malkhanaScreen.register.seizedBySelf")}>
            <OfficerPicker value={seizedBy} onChange={(id) => setSeizedBy(id)} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="rg-location" label={t("malkhanaScreen.register.location")}>
              <LocationSelect id="rg-location" value={locationId} onChange={setLocationId} stationId={stationId} />
            </FormField>
            <FormField id="rg-seal" label={t("malkhanaScreen.register.seal")} hint={t("malkhanaScreen.register.sealHint")}>
              <Input id="rg-seal" value={seal} onChange={setSeal} />
            </FormField>
          </div>
        </div>
        <ErrorLine message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("malkhanaScreen.actions.cancel")}</Button>
          <Button onClick={submit} disabled={register.isPending}>
            {register.isPending ? t("malkhanaScreen.actions.saving") : t("malkhanaScreen.actions.register")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------------------------------------- seal check */

export function SealCheckDialog({ item, open, onOpenChange }: { item: PropertyItem; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useI18n();
  const verify = useVerifySeal(item.id);
  const [seal, setSeal] = React.useState(item.sealNumber);
  const [intact, setIntact] = React.useState(true);
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (open) {
      setSeal(item.sealNumber);
      setIntact(true);
      setNote("");
      setError(null);
    }
  }, [open, item.sealNumber]);
  const mismatch = seal.trim() !== "" && seal.trim().toLowerCase() !== item.sealNumber.toLowerCase();

  const submit = async () => {
    setError(null);
    try {
      const updated = await verify.mutateAsync({ sealNumber: seal, intact, note: note || null });
      if (updated.sealState === "BROKEN" && item.sealState !== "BROKEN") {
        toast.warning(t("malkhanaScreen.sealCheck.brokenRecorded"), item.propertyNumber);
      } else {
        toast.success(t("malkhanaScreen.sealCheck.recorded"), item.propertyNumber);
      }
      onOpenChange(false);
    } catch (err) {
      setError(officerMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("malkhanaScreen.sealCheck.title")}</DialogTitle>
          <DialogDescription>{t("malkhanaScreen.sealCheck.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <FormField id="sc-seal" label={t("malkhanaScreen.sealCheck.number")}>
            <Input id="sc-seal" value={seal} onChange={setSeal} />
          </FormField>
          {mismatch && <p className="text-xs text-warning">{t("malkhanaScreen.sealCheck.mismatch", { seal: item.sealNumber })}</p>}
          <fieldset className="grid gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="sc-state" checked={intact} onChange={() => setIntact(true)} />
              {t("malkhanaScreen.sealCheck.intact")}
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="sc-state" checked={!intact} onChange={() => setIntact(false)} />
              {t("malkhanaScreen.sealCheck.broken")}
            </label>
          </fieldset>
          <FormField id="sc-note" label={!intact || mismatch ? t("malkhanaScreen.sealCheck.noteRequired") : t("malkhanaScreen.sealCheck.note")}>
            <Textarea id="sc-note" rows={2} value={note} onChange={setNote} />
          </FormField>
        </div>
        <ErrorLine message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("malkhanaScreen.actions.cancel")}</Button>
          <Button onClick={submit} disabled={verify.isPending}>
            {verify.isPending ? t("malkhanaScreen.actions.saving") : t("malkhanaScreen.actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------- reseal */

export function ResealDialog({ item, open, onOpenChange }: { item: PropertyItem; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useI18n();
  const reseal = useReseal(item.id);
  const [reason, setReason] = React.useState("");
  const [seal, setSeal] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      await reseal.mutateAsync({ reason, newSealNumber: seal });
      toast.success(t("malkhanaScreen.reseal.done"), `${item.propertyNumber} · ${seal}`);
      setReason("");
      setSeal("");
      onOpenChange(false);
    } catch (err) {
      setError(officerMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("malkhanaScreen.reseal.title")}</DialogTitle>
          <DialogDescription>{t("malkhanaScreen.reseal.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <FormField id="rs-reason" label={t("malkhanaScreen.reseal.reason")}>
            <Textarea id="rs-reason" rows={3} value={reason} onChange={setReason} />
          </FormField>
          <FormField id="rs-seal" label={t("malkhanaScreen.reseal.newSeal")}>
            <Input id="rs-seal" value={seal} onChange={setSeal} />
          </FormField>
        </div>
        <ErrorLine message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("malkhanaScreen.actions.cancel")}</Button>
          <Button onClick={submit} disabled={reseal.isPending}>
            {reseal.isPending ? t("malkhanaScreen.actions.saving") : t("malkhanaScreen.actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------------------------------------------- relocate */

export function RelocateDialog({ item, open, onOpenChange }: { item: PropertyItem; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useI18n();
  const relocate = useRelocate(item.id);
  const [locationId, setLocationId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!locationId) return setError("Choose the new storage location.");
    try {
      const updated = await relocate.mutateAsync({ locationId, reason });
      toast.success(t("malkhanaScreen.relocate.done"), updated.locationLabel);
      setReason("");
      onOpenChange(false);
    } catch (err) {
      setError(officerMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("malkhanaScreen.relocate.title")}</DialogTitle>
          <DialogDescription>{item.locationLabel}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <FormField id="rl-location" label={t("malkhanaScreen.relocate.location")}>
            <LocationSelect id="rl-location" value={locationId} onChange={setLocationId} stationId={item.stationId} />
          </FormField>
          <FormField id="rl-reason" label={t("malkhanaScreen.relocate.reason")}>
            <Input id="rl-reason" value={reason} onChange={setReason} />
          </FormField>
        </div>
        <ErrorLine message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("malkhanaScreen.actions.cancel")}</Button>
          <Button onClick={submit} disabled={relocate.isPending}>
            {relocate.isPending ? t("malkhanaScreen.actions.saving") : t("malkhanaScreen.actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------ movement out */

export function MoveOutDialog({ item, open, onOpenChange }: { item: PropertyItem; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useI18n();
  const move = useMoveOut(item.id);
  const stations = useMalkhanaStations(open);
  const [type, setType] = React.useState<MovementType>("FORENSIC_EXAMINATION");
  const [destination, setDestination] = React.useState("");
  const [stationId, setStationId] = React.useState("");
  const [hearingId, setHearingId] = React.useState("");
  const [purpose, setPurpose] = React.useState("");
  const [authority, setAuthority] = React.useState("");
  const [handedTo, setHandedTo] = React.useState("");
  const [expected, setExpected] = React.useState(() => localInput(new Date(Date.now() + 7 * 86400000)));
  const [seal, setSeal] = React.useState(item.sealNumber);
  const [error, setError] = React.useState<string | null>(null);
  const hearings = useQuery({
    queryKey: ["court", "hearings", "for-case", item.caseId],
    queryFn: () => courtApi.hearings({ caseId: item.caseId!, pageSize: 50 }),
    enabled: open && type === "COURT_PRODUCTION" && Boolean(item.caseId),
  });
  React.useEffect(() => {
    if (open) setSeal(item.sealNumber);
  }, [open, item.sealNumber]);

  const placeholder =
    type === "FORENSIC_EXAMINATION"
      ? t("malkhanaScreen.move.destinationForensic")
      : type === "COURT_PRODUCTION"
        ? t("malkhanaScreen.move.destinationCourt")
        : type === "INTERIM_CUSTODY"
          ? t("malkhanaScreen.move.destinationOwner")
          : "";

  const submit = async () => {
    setError(null);
    let dest = destination;
    if (type === "INTER_STATION") {
      const s = (stations.data ?? []).find((x) => x.id === stationId);
      if (!s) return setError("Choose the receiving station.");
      dest = s.name;
    }
    const hearing = (hearings.data?.data ?? []).find((h) => h.id === hearingId);
    if (type === "COURT_PRODUCTION" && hearing && !dest) dest = hearing.court;
    try {
      await move.mutateAsync({
        movementType: type,
        destination: dest,
        destinationStationId: type === "INTER_STATION" ? stationId : null,
        courtHearingId: type === "COURT_PRODUCTION" && hearingId ? hearingId : null,
        purpose,
        authorityRef: authority,
        handedTo,
        expectedReturnAt: new Date(expected).toISOString(),
        sealNumber: seal,
      });
      toast.success(t("malkhanaScreen.move.done"), `${item.propertyNumber} → ${dest}`);
      setDestination("");
      setPurpose("");
      setAuthority("");
      setHandedTo("");
      setHearingId("");
      onOpenChange(false);
    } catch (err) {
      setError(officerMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("malkhanaScreen.move.title")}</DialogTitle>
          <DialogDescription>{t("malkhanaScreen.move.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <FormField id="mv-type" label={t("malkhanaScreen.move.type")}>
            <select id="mv-type" className={fieldClass} value={type} onChange={(e) => setType(e.target.value as MovementType)}>
              {MOVEMENT_TYPES.map((m) => (
                <option key={m} value={m}>{t(`malkhanaScreen.movementType.${m}`)}</option>
              ))}
            </select>
          </FormField>
          {type === "INTER_STATION" ? (
            <FormField id="mv-station" label={t("malkhanaScreen.move.station")}>
              <select id="mv-station" className={fieldClass} value={stationId} onChange={(e) => setStationId(e.target.value)}>
                <option value="">{t("malkhanaScreen.move.chooseStation")}</option>
                {(stations.data ?? [])
                  .filter((s) => s.id !== item.stationId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ""}</option>
                  ))}
              </select>
            </FormField>
          ) : (
            <FormField id="mv-destination" label={t("malkhanaScreen.move.destination")}>
              <Input id="mv-destination" value={destination} onChange={setDestination} placeholder={placeholder} />
            </FormField>
          )}
          {type === "COURT_PRODUCTION" && item.caseId && (
            <FormField id="mv-hearing" label={t("malkhanaScreen.move.hearing")}>
              <select id="mv-hearing" className={fieldClass} value={hearingId} onChange={(e) => setHearingId(e.target.value)}>
                <option value="">{t("malkhanaScreen.move.noHearing")}</option>
                {(hearings.data?.data ?? []).map((h) => (
                  <option key={h.id} value={h.id}>{formatDay(h.date)} · {h.court}{h.courtRoom ? ` · ${h.courtRoom}` : ""}</option>
                ))}
              </select>
              {hearings.isSuccess && (hearings.data?.data ?? []).length === 0 && (
                <p className="text-xs text-foreground-subtle">{t("malkhanaScreen.move.noHearings")}</p>
              )}
            </FormField>
          )}
          <FormField id="mv-purpose" label={t("malkhanaScreen.move.purpose")}>
            <Input id="mv-purpose" value={purpose} onChange={setPurpose} />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="mv-authority" label={t("malkhanaScreen.move.authority")} hint={t("malkhanaScreen.move.authorityHint")}>
              <Input id="mv-authority" value={authority} onChange={setAuthority} />
            </FormField>
            <FormField id="mv-expected" label={t("malkhanaScreen.move.expected")}>
              <input id="mv-expected" type="datetime-local" className={fieldClass} value={expected} onChange={(e) => setExpected(e.target.value)} />
            </FormField>
          </div>
          <FormField id="mv-handed" label={t("malkhanaScreen.move.handedTo")} hint={t("malkhanaScreen.move.handedToHint")}>
            <Input id="mv-handed" value={handedTo} onChange={setHandedTo} />
          </FormField>
          <FormField id="mv-seal" label={t("malkhanaScreen.move.seal")}>
            <Input id="mv-seal" value={seal} onChange={setSeal} />
          </FormField>
        </div>
        <ErrorLine message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("malkhanaScreen.actions.cancel")}</Button>
          <Button onClick={submit} disabled={move.isPending}>
            {move.isPending ? t("malkhanaScreen.actions.saving") : t("malkhanaScreen.actions.moveOut")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ return */

export function ReturnDialog({ item, open, onOpenChange }: { item: PropertyItem; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useI18n();
  const ret = useReturnMovement(item.id);
  const movement = item.openMovement;
  const [returnedBy, setReturnedBy] = React.useState("");
  const [seal, setSeal] = React.useState(movement?.sealNumberOut ?? "");
  const [intact, setIntact] = React.useState(true);
  const [note, setNote] = React.useState("");
  const [locationId, setLocationId] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (open) {
      setSeal(movement?.sealNumberOut ?? "");
      setReturnedBy(movement?.handedTo ?? "");
      setIntact(true);
      setNote("");
      setError(null);
    }
  }, [open, movement?.sealNumberOut, movement?.handedTo]);

  if (!movement) return null;

  const submit = async () => {
    setError(null);
    if (!locationId) return setError("Choose the storage location.");
    try {
      const m = await ret.mutateAsync({
        movementId: movement.id,
        input: { returnedBy, sealNumber: seal, sealIntact: intact, note: note || null, locationId },
      });
      if (m.sealIntactBack === false) {
        toast.warning(t("malkhanaScreen.sealCheck.brokenRecorded"), item.propertyNumber);
      } else {
        toast.success(t("malkhanaScreen.back.done"), item.propertyNumber);
      }
      onOpenChange(false);
    } catch (err) {
      setError(officerMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("malkhanaScreen.back.title")}</DialogTitle>
          <DialogDescription>{t("malkhanaScreen.back.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <p className="text-sm text-foreground-muted">
            {movement.destination} · {t("malkhanaScreen.item.sealOut")}: <span className="font-mono">{movement.sealNumberOut}</span>
          </p>
          <FormField id="rt-by" label={t("malkhanaScreen.back.returnedBy")}>
            <Input id="rt-by" value={returnedBy} onChange={setReturnedBy} />
          </FormField>
          <FormField id="rt-seal" label={t("malkhanaScreen.back.seal")}>
            <Input id="rt-seal" value={seal} onChange={setSeal} />
          </FormField>
          <fieldset className="grid gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="rt-state" checked={intact} onChange={() => setIntact(true)} />
              {t("malkhanaScreen.back.intact")}
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="rt-state" checked={!intact} onChange={() => setIntact(false)} />
              {t("malkhanaScreen.back.notIntact")}
            </label>
          </fieldset>
          <FormField id="rt-note" label={t("malkhanaScreen.back.note")}>
            <Textarea id="rt-note" rows={2} value={note} onChange={setNote} />
          </FormField>
          <FormField id="rt-location" label={t("malkhanaScreen.back.location")}>
            <LocationSelect id="rt-location" value={locationId} onChange={setLocationId} stationId={item.stationId} />
          </FormField>
        </div>
        <ErrorLine message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("malkhanaScreen.actions.cancel")}</Button>
          <Button onClick={submit} disabled={ret.isPending}>
            {ret.isPending ? t("malkhanaScreen.actions.saving") : t("malkhanaScreen.actions.returnBack")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ dispose */

export function DisposeDialog({ item, open, onOpenChange }: { item: PropertyItem; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useI18n();
  const dispose = useDispose(item.id);
  const [type, setType] = React.useState<DisposalType>("RETURNED_TO_OWNER");
  const [orderId, setOrderId] = React.useState("");
  const [witnessId, setWitnessId] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const orders = useQuery({
    queryKey: ["court", "orders", "for-case", item.caseId],
    queryFn: () => courtApi.orders({ caseId: item.caseId!, pageSize: 50 }),
    enabled: open && Boolean(item.caseId),
  });
  const witnessNeeded = item.category === "NARCOTICS" && type === "DESTROYED";

  const submit = async () => {
    setError(null);
    if (!orderId) return setError("Choose the court order.");
    try {
      await dispose.mutateAsync({ disposalType: type, courtOrderId: orderId, witnessId: witnessId || null, note });
      toast.success(t("malkhanaScreen.dispose.done"), item.propertyNumber);
      onOpenChange(false);
    } catch (err) {
      setError(officerMessage(err));
    }
  };

  const orderList = orders.data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("malkhanaScreen.dispose.title")}</DialogTitle>
          <DialogDescription>{t("malkhanaScreen.dispose.description")}</DialogDescription>
        </DialogHeader>
        {!item.caseId ? (
          <Alert variant="warning">
            <AlertDescription>{t("malkhanaScreen.dispose.noCase")}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-3">
            <FormField id="dp-type" label={t("malkhanaScreen.dispose.type")}>
              <select id="dp-type" className={fieldClass} value={type} onChange={(e) => setType(e.target.value as DisposalType)}>
                {DISPOSAL_TYPES.map((d) => (
                  <option key={d} value={d}>{t(`malkhanaScreen.disposalType.${d}`)}</option>
                ))}
              </select>
            </FormField>
            <FormField id="dp-order" label={t("malkhanaScreen.dispose.order")}>
              <select id="dp-order" className={fieldClass} value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                <option value="">{t("malkhanaScreen.dispose.chooseOrder")}</option>
                {orderList.map((o) => (
                  <option key={o.id} value={o.id}>
                    {formatDay(o.orderDate)} · {o.orderType} · {o.court}
                  </option>
                ))}
              </select>
              {orders.isSuccess && orderList.length === 0 && (
                <p className="text-xs text-warning">{t("malkhanaScreen.dispose.noOrders")}</p>
              )}
              {orders.isError && <p className="text-xs text-danger">{officerMessage(orders.error)}</p>}
            </FormField>
            <FormField
              id="dp-witness"
              label={witnessNeeded ? t("malkhanaScreen.dispose.witnessRequired") : t("malkhanaScreen.dispose.witnessOptional")}
            >
              <OfficerPicker value={witnessId} onChange={(id) => setWitnessId(id)} />
            </FormField>
            <FormField id="dp-note" label={t("malkhanaScreen.dispose.note")}>
              <Textarea id="dp-note" rows={2} value={note} onChange={setNote} placeholder={t("malkhanaScreen.dispose.noteHint")} />
            </FormField>
            <p className="text-xs text-foreground-muted">{t("malkhanaScreen.dispose.confirm")}</p>
          </div>
        )}
        <ErrorLine message={error} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("malkhanaScreen.actions.cancel")}</Button>
          <Button variant="destructive" onClick={submit} disabled={dispose.isPending || !item.caseId}>
            {dispose.isPending ? t("malkhanaScreen.actions.saving") : t("malkhanaScreen.actions.dispose")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
