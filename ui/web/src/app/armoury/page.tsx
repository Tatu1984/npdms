"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  Crosshair,
  FileText,
  History,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Target,
  Wrench,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LegacySelect as Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import {
  useIssueWeapon,
  useRegisterWeapon,
  useReturnWeapon,
  useSetWeaponState,
  useWeaponIssuances,
  useWeaponLedger,
  useWeapons,
  useWeaponStats,
} from "@/hooks/use-armoury";
import { investigationApi } from "@/lib/api/investigation";
import type { Weapon, WeaponCondition, WeaponIssuance, WeaponStatus } from "@/lib/api/armoury";
import { formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 20;

const statusConfig: Record<WeaponStatus, { label: string; variant: "success" | "warning" | "info" | "error" }> = {
  IN_ARMOURY: { label: "In Armoury", variant: "success" },
  ISSUED: { label: "Issued", variant: "info" },
  MAINTENANCE: { label: "Maintenance", variant: "warning" },
  CONDEMNED: { label: "Condemned", variant: "error" },
};

const conditionLabel: Record<WeaponCondition, string> = {
  SERVICEABLE: "Serviceable",
  UNDER_REPAIR: "Under repair",
  UNSERVICEABLE: "Unserviceable",
};

const conditionOptions = (Object.keys(conditionLabel) as WeaponCondition[]).map((c) => ({
  value: c,
  label: conditionLabel[c],
}));

const message = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

type Dialog =
  | { kind: "register" }
  | { kind: "issue"; weapon: Weapon }
  | { kind: "return"; weapon: Weapon }
  | { kind: "state"; weapon: Weapon }
  | { kind: "ledger"; weapon: Weapon }
  | null;

export default function ArmouryPage() {
  const { user } = useAuthStore();
  // Role floors match the routes: register and state changes SHO+, issue and return ASI+.
  const canManage = Boolean(user && hasMinimumRole(user.role, "SHO"));
  const canIssue = Boolean(user && hasMinimumRole(user.role, "ASI"));

  const [tab, setTab] = useState("weapons");
  const [searchQuery, setSearchQuery] = useState("");
  const search = useDeferredValue(searchQuery.trim());
  const [status, setStatus] = useState<"" | WeaponStatus>("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [openOnly, setOpenOnly] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);

  const weapons = useWeapons({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status: status || undefined,
    overdue: overdueOnly || undefined,
  });
  const stats = useWeaponStats();
  const ledger = useWeaponLedger(ledgerPage, openOnly);

  const rows = weapons.data?.data ?? [];

  const statCards = [
    { key: "total", label: "Total Weapons", value: stats.data?.total, icon: Crosshair, wrap: "bg-accent/10", color: "text-accent" },
    { key: "inArmoury", label: "In Armoury", value: stats.data?.inArmoury, icon: Shield, wrap: "bg-success/10", color: "text-success" },
    { key: "issued", label: "Issued", value: stats.data?.issued, icon: Target, wrap: "bg-info/10", color: "text-info" },
    { key: "maintenance", label: "Maintenance", value: stats.data?.maintenance, icon: Wrench, wrap: "bg-warning/10", color: "text-warning" },
    { key: "roundsOut", label: "Rounds Out", value: stats.data?.roundsOut, icon: Target, wrap: "bg-accent/10", color: "text-accent" },
    { key: "shortfall", label: "Rounds Unreturned", value: stats.data?.roundsShortfall, icon: AlertTriangle, wrap: "bg-error/10", color: "text-error" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Armoury Management</h1>
            <p className="text-foreground-muted">Weapon register and the issue and return ledger</p>
          </div>
          {canManage && (
            <Button onClick={() => setDialog({ kind: "register" })}>
              <Plus className="h-4 w-4 mr-2" />
              Register Weapon
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map(({ key, label, value, icon: Icon, wrap, color }) => (
            <Card key={key}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${wrap}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.isError ? "—" : value ?? <Loader2 className="h-5 w-5 animate-spin" />}
                    </p>
                    <p className="text-xs text-foreground-muted">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(stats.data?.overdue ?? 0) > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Overdue returns</p>
                  <p className="text-sm text-foreground-muted">
                    {stats.data!.overdue} weapon{stats.data!.overdue === 1 ? " is" : "s are"} out past the expected
                    return time
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setTab("weapons");
                    setOverdueOnly(true);
                    setStatus("");
                    setPage(1);
                  }}
                >
                  Show overdue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="weapons">
              <Crosshair className="h-4 w-4 mr-2" />
              Weapons Register
            </TabsTrigger>
            <TabsTrigger value="ledger">
              <FileText className="h-4 w-4 mr-2" />
              Issue Ledger
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weapons" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[16rem]">
                    <Input
                      placeholder="Search by weapon number, serial, make or type..."
                      value={searchQuery}
                      onChange={(v: string) => {
                        setSearchQuery(v);
                        setPage(1);
                      }}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value as "" | WeaponStatus);
                      setPage(1);
                    }}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="">All Status</option>
                    {(Object.keys(statusConfig) as WeaponStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {statusConfig[s].label}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={overdueOnly}
                      onChange={(e) => {
                        setOverdueOnly(e.target.checked);
                        setPage(1);
                      }}
                    />
                    Overdue only
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                {weapons.isPending ? (
                  <div className="p-12 flex items-center justify-center gap-3 text-foreground-muted">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading weapons…
                  </div>
                ) : weapons.isError ? (
                  <div className="p-12 text-center space-y-3">
                    <AlertTriangle className="h-10 w-10 text-error mx-auto" />
                    <p className="text-foreground font-medium">Weapons could not be loaded</p>
                    <p className="text-foreground-muted">{weapons.error.message}</p>
                    <Button variant="secondary" onClick={() => weapons.refetch()}>
                      Try again
                    </Button>
                  </div>
                ) : rows.length === 0 ? (
                  <div className="p-12 text-center text-foreground-muted">
                    {search || status || overdueOnly
                      ? "No weapons match these filters"
                      : "No weapons have been registered yet"}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Weapon</TableHead>
                          <TableHead>Serial</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Condition</TableHead>
                          <TableHead>Held By</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((w) => {
                          const issue = w.currentIssue;
                          return (
                            <TableRow key={w.id}>
                              <TableCell>
                                <p className="font-mono text-accent">{w.weaponNumber}</p>
                                <p className="text-xs text-foreground-muted">
                                  {w.type} · {w.make}
                                </p>
                              </TableCell>
                              <TableCell className="font-mono text-sm">{w.serialNumber}</TableCell>
                              <TableCell>
                                <Badge variant={statusConfig[w.status].variant}>{statusConfig[w.status].label}</Badge>
                                {issue?.overdue && (
                                  <Badge variant="error" className="ml-2">
                                    Overdue
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <p className="text-sm">{conditionLabel[w.condition]}</p>
                                {w.maintenanceNote && w.status !== "IN_ARMOURY" && (
                                  <p className="text-xs text-foreground-muted">{w.maintenanceNote}</p>
                                )}
                              </TableCell>
                              <TableCell>
                                {issue ? (
                                  <div className="text-sm">
                                    <p className="text-foreground">
                                      {issue.issuedToName}
                                      {issue.issuedToBadge && (
                                        <span className="text-foreground-muted"> · {issue.issuedToBadge}</span>
                                      )}
                                    </p>
                                    <p className="text-xs text-foreground-muted">
                                      {issue.roundsIssued} rounds · since {formatDateTime(issue.issuedAt)}
                                      {issue.expectedReturn && ` · due ${formatDateTime(issue.expectedReturn)}`}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-foreground-muted text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap justify-end gap-2">
                                  {canIssue && w.status === "IN_ARMOURY" && w.condition === "SERVICEABLE" && (
                                    <Button size="sm" onClick={() => setDialog({ kind: "issue", weapon: w })}>
                                      Issue
                                    </Button>
                                  )}
                                  {canIssue && w.status === "ISSUED" && (
                                    <Button size="sm" onClick={() => setDialog({ kind: "return", weapon: w })}>
                                      <RotateCcw className="h-3 w-3 mr-1" />
                                      Return
                                    </Button>
                                  )}
                                  {canManage && w.status !== "ISSUED" && (
                                    <Button size="sm" variant="secondary" onClick={() => setDialog({ kind: "state", weapon: w })}>
                                      <Wrench className="h-3 w-3 mr-1" />
                                      Status
                                    </Button>
                                  )}
                                  <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "ledger", weapon: w })}>
                                    <History className="h-3 w-3 mr-1" />
                                    Ledger
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Pager
              page={page}
              totalPages={weapons.data?.totalPages ?? 0}
              total={weapons.data?.total ?? 0}
              noun="weapons"
              onPage={setPage}
            />
          </TabsContent>

          <TabsContent value="ledger" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Issue and Return Ledger</CardTitle>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={openOnly}
                    onChange={(e) => {
                      setOpenOnly(e.target.checked);
                      setLedgerPage(1);
                    }}
                  />
                  Still out only
                </label>
              </CardHeader>
              <CardContent className="p-0">
                <LedgerTable
                  isPending={ledger.isPending}
                  error={ledger.isError ? ledger.error.message : null}
                  rows={ledger.data?.data ?? []}
                  showWeapon
                  onRetry={() => ledger.refetch()}
                />
              </CardContent>
            </Card>
            <Pager
              page={ledgerPage}
              totalPages={ledger.data?.totalPages ?? 0}
              total={ledger.data?.total ?? 0}
              noun="movements"
              onPage={setLedgerPage}
            />
          </TabsContent>
        </Tabs>
      </div>

      {dialog?.kind === "register" && <RegisterDialog onClose={() => setDialog(null)} />}
      {dialog?.kind === "issue" && <IssueDialog weapon={dialog.weapon} onClose={() => setDialog(null)} />}
      {dialog?.kind === "return" && <ReturnDialog weapon={dialog.weapon} onClose={() => setDialog(null)} />}
      {dialog?.kind === "state" && <StateDialog weapon={dialog.weapon} onClose={() => setDialog(null)} />}
      {dialog?.kind === "ledger" && <WeaponLedgerDialog weapon={dialog.weapon} onClose={() => setDialog(null)} />}
    </DashboardLayout>
  );
}

function Pager({
  page,
  totalPages,
  total,
  noun,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  noun: string;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm text-foreground-muted">
      <span>
        Page {page} of {totalPages} · {total} {noun}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

function LedgerTable({
  isPending,
  error,
  rows,
  showWeapon,
  onRetry,
}: {
  isPending: boolean;
  error: string | null;
  rows: WeaponIssuance[];
  showWeapon?: boolean;
  onRetry: () => void;
}) {
  if (isPending) {
    return (
      <div className="p-8 flex items-center justify-center gap-3 text-foreground-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading ledger…
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-8 text-center space-y-2">
        <p className="text-foreground-muted">{error}</p>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }
  if (rows.length === 0) {
    return <p className="p-8 text-center text-foreground-muted">No issues recorded</p>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {showWeapon && <TableHead>Weapon</TableHead>}
            <TableHead>Issued To</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead>Returned</TableHead>
            <TableHead>Rounds</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((i) => {
            const shortfall = i.roundsReturned !== null ? i.roundsIssued - i.roundsReturned : 0;
            return (
              <TableRow key={i.id}>
                {showWeapon && <TableCell className="font-mono text-accent">{i.weaponNumber}</TableCell>}
                <TableCell>
                  <p>{i.issuedToName}</p>
                  <p className="text-xs text-foreground-muted">
                    {i.issuedToBadge} · issued by {i.issuedByName}
                  </p>
                </TableCell>
                <TableCell className="text-sm">{i.purpose}</TableCell>
                <TableCell className="text-sm">
                  {formatDateTime(i.issuedAt)}
                  {i.expectedReturn && (
                    <p className="text-xs text-foreground-muted">due {formatDateTime(i.expectedReturn)}</p>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {i.returnedAt ? (
                    <>
                      {formatDateTime(i.returnedAt)}
                      <p className="text-xs text-foreground-muted">
                        to {i.receivedByName}
                        {i.returnCondition && ` · ${conditionLabel[i.returnCondition]}`}
                      </p>
                      {i.returnNote && <p className="text-xs text-foreground-muted">{i.returnNote}</p>}
                    </>
                  ) : (
                    <Badge variant={i.overdue ? "error" : "info"}>{i.overdue ? "Overdue" : "Out"}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {i.roundsReturned !== null ? (
                    <>
                      {i.roundsReturned} of {i.roundsIssued} back
                      {shortfall > 0 && <p className="text-xs text-error font-medium">{shortfall} not returned</p>}
                    </>
                  ) : (
                    `${i.roundsIssued} issued`
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function RegisterDialog({ onClose }: { onClose: () => void }) {
  const register = useRegisterWeapon();
  const [form, setForm] = useState({ type: "", make: "", serialNumber: "" });

  const submit = async () => {
    if (!form.type.trim() || !form.make.trim() || !form.serialNumber.trim()) {
      toast.error("Validation Error", "Type, make and serial number are required");
      return;
    }
    try {
      const weapon = await register.mutateAsync(form);
      toast.success("Weapon Registered", `${weapon.weaponNumber} added to ${weapon.stationName || "the armoury"}`);
      onClose();
    } catch (err) {
      toast.error("Weapon not registered", message(err, "The server rejected the request"));
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Register Weapon" description="Adds the weapon to your station's armoury">
      <div className="space-y-4">
        <Input
          label="Type *"
          placeholder="9mm Pistol, 5.56mm INSAS Rifle…"
          value={form.type}
          onChange={(v: string) => setForm({ ...form, type: v })}
        />
        <Input
          label="Make / Model *"
          placeholder="Manufacturer and model"
          value={form.make}
          onChange={(v: string) => setForm({ ...form, make: v })}
        />
        <Input
          label="Serial Number *"
          value={form.serialNumber}
          onChange={(v: string) => setForm({ ...form, serialNumber: v })}
        />
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={register.isPending}>
          {register.isPending ? "Registering…" : "Register Weapon"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function IssueDialog({ weapon, onClose }: { weapon: Weapon; onClose: () => void }) {
  const issue = useIssueWeapon();
  const [officerSearch, setOfficerSearch] = useState("");
  const deferredSearch = useDeferredValue(officerSearch.trim());
  const officers = useQuery({
    queryKey: ["investigation", "officers", deferredSearch],
    queryFn: () => investigationApi.officers(deferredSearch || undefined),
  });
  const [officer, setOfficer] = useState<{ id: string; label: string } | null>(null);
  const [form, setForm] = useState({ purpose: "", rounds: "0", expectedReturn: "" });

  const submit = async () => {
    const rounds = Number(form.rounds);
    if (!officer || !form.purpose.trim()) {
      toast.error("Validation Error", "Choose the officer and record the purpose");
      return;
    }
    if (!Number.isInteger(rounds) || rounds < 0) {
      toast.error("Validation Error", "Rounds must be a whole number, zero or more");
      return;
    }
    try {
      const record = await issue.mutateAsync({
        id: weapon.id,
        input: {
          issuedTo: officer.id,
          purpose: form.purpose.trim(),
          roundsIssued: rounds,
          expectedReturn: form.expectedReturn ? new Date(form.expectedReturn).toISOString() : null,
        },
      });
      toast.success("Weapon Issued", `${record.weaponNumber} issued to ${record.issuedToName}`);
      onClose();
    } catch (err) {
      toast.error("Weapon not issued", message(err, "The server rejected the request"));
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Issue ${weapon.weaponNumber}`} description={`${weapon.type} · ${weapon.make}`} size="lg">
      <div className="space-y-4">
        {officer ? (
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="text-foreground">{officer.label}</span>
            <Button variant="ghost" size="sm" onClick={() => setOfficer(null)}>
              Change
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Input
              label="Issue To *"
              placeholder="Search officers by name or badge"
              value={officerSearch}
              onChange={setOfficerSearch}
              icon={<Search className="h-4 w-4" />}
            />
            <div className="rounded-lg border border-border divide-y divide-border max-h-48 overflow-y-auto">
              {officers.isPending ? (
                <p className="p-3 text-sm text-foreground-muted">Loading officers…</p>
              ) : officers.isError ? (
                <p className="p-3 text-sm text-error">Officers could not be loaded: {officers.error.message}</p>
              ) : (officers.data.data ?? []).length === 0 ? (
                <p className="p-3 text-sm text-foreground-muted">No matching officers</p>
              ) : (
                (officers.data.data ?? []).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className="w-full text-left p-3 hover:bg-background-tertiary"
                    onClick={() =>
                      setOfficer({
                        id: o.id,
                        label: [o.roleLabel, o.name, o.badgeNumber].filter(Boolean).join(" · "),
                      })
                    }
                  >
                    <span className="text-sm text-foreground">
                      {o.roleLabel} {o.name}
                    </span>
                    <span className="block text-xs text-foreground-muted">
                      {[o.badgeNumber, o.stationName].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
        <Input
          label="Purpose *"
          placeholder="Duty for which the weapon is drawn"
          value={form.purpose}
          onChange={(v: string) => setForm({ ...form, purpose: v })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Rounds Issued"
            type="number"
            min={0}
            value={form.rounds}
            onChange={(v: string) => setForm({ ...form, rounds: v })}
          />
          <Input
            label="Expected Return"
            type="datetime-local"
            value={form.expectedReturn}
            onChange={(v: string) => setForm({ ...form, expectedReturn: v })}
          />
        </div>
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={issue.isPending}>
          {issue.isPending ? "Issuing…" : "Issue Weapon"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function ReturnDialog({ weapon, onClose }: { weapon: Weapon; onClose: () => void }) {
  const doReturn = useReturnWeapon();
  const issue = weapon.currentIssue;
  const [form, setForm] = useState({
    rounds: String(issue?.roundsIssued ?? 0),
    condition: "SERVICEABLE" as WeaponCondition,
    note: "",
  });
  const rounds = Number(form.rounds);
  const shortfall = issue && Number.isInteger(rounds) ? issue.roundsIssued - rounds : 0;

  const submit = async () => {
    if (!Number.isInteger(rounds) || rounds < 0) {
      toast.error("Validation Error", "Rounds returned must be a whole number, zero or more");
      return;
    }
    if (form.condition !== "SERVICEABLE" && !form.note.trim()) {
      toast.error("Validation Error", "Describe the damage when a weapon comes back unserviceable or needing repair");
      return;
    }
    try {
      const record = await doReturn.mutateAsync({
        id: weapon.id,
        input: { roundsReturned: rounds, condition: form.condition, note: form.note.trim() || null },
      });
      const short = record.roundsIssued - (record.roundsReturned ?? 0);
      toast.success(
        "Weapon Returned",
        `${record.weaponNumber} received${short > 0 ? ` — ${short} rounds not returned` : ""}`
      );
      onClose();
    } catch (err) {
      toast.error("Return not recorded", message(err, "The server rejected the request"));
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Receive ${weapon.weaponNumber}`} description="Record the return into the armoury">
      <div className="space-y-4">
        {issue && (
          <div className="rounded-lg bg-background-tertiary p-3 text-sm">
            <p className="text-foreground">
              Out with {issue.issuedToName} {issue.issuedToBadge && `(${issue.issuedToBadge})`}
            </p>
            <p className="text-foreground-muted">
              {issue.roundsIssued} rounds issued · {issue.purpose} · since {formatDateTime(issue.issuedAt)}
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Rounds Returned *"
            type="number"
            min={0}
            value={form.rounds}
            onChange={(v: string) => setForm({ ...form, rounds: v })}
          />
          <Select
            label="Condition *"
            value={form.condition}
            onChange={(v: string) => setForm({ ...form, condition: v as WeaponCondition })}
            options={conditionOptions}
          />
        </div>
        {shortfall > 0 && (
          <p className="text-sm text-error flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {shortfall} rounds will be recorded as not returned
          </p>
        )}
        {shortfall < 0 && (
          <p className="text-sm text-error">More rounds than were issued — the server will refuse this</p>
        )}
        <Textarea
          label={form.condition === "SERVICEABLE" ? "Note" : "Damage / Defect *"}
          value={form.note}
          onChange={(v: string) => setForm({ ...form, note: v })}
          rows={3}
        />
        {form.condition !== "SERVICEABLE" && (
          <p className="text-xs text-foreground-muted">The weapon will move to maintenance.</p>
        )}
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={doReturn.isPending}>
          {doReturn.isPending ? "Recording…" : "Record Return"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function StateDialog({ weapon, onClose }: { weapon: Weapon; onClose: () => void }) {
  const setState = useSetWeaponState();
  const [form, setForm] = useState({
    status: (weapon.status === "ISSUED" ? "MAINTENANCE" : weapon.status) as Exclude<WeaponStatus, "ISSUED">,
    condition: weapon.condition,
    note: weapon.maintenanceNote ?? "",
  });

  const submit = async () => {
    if (form.status === "IN_ARMOURY" && form.condition !== "SERVICEABLE") {
      toast.error("Validation Error", "A weapon returns to the armoury only when serviceable");
      return;
    }
    if (form.status !== "IN_ARMOURY" && !form.note.trim()) {
      toast.error("Validation Error", "Record the reason for maintenance or condemnation");
      return;
    }
    try {
      const updated = await setState.mutateAsync({
        id: weapon.id,
        input: { status: form.status, condition: form.condition, maintenanceNote: form.note.trim() || null },
      });
      toast.success("Weapon Updated", `${updated.weaponNumber} is now ${statusConfig[updated.status].label.toLowerCase()}`);
      onClose();
    } catch (err) {
      toast.error("Weapon not updated", message(err, "The server rejected the request"));
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`Status of ${weapon.weaponNumber}`} description={`${weapon.type} · ${weapon.make}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Status *"
            value={form.status}
            onChange={(v: string) => setForm({ ...form, status: v as Exclude<WeaponStatus, "ISSUED"> })}
            options={[
              { value: "IN_ARMOURY", label: "In Armoury" },
              { value: "MAINTENANCE", label: "Maintenance" },
              { value: "CONDEMNED", label: "Condemned" },
            ]}
          />
          <Select
            label="Condition *"
            value={form.condition}
            onChange={(v: string) => setForm({ ...form, condition: v as WeaponCondition })}
            options={conditionOptions}
          />
        </div>
        <Textarea
          label={form.status === "IN_ARMOURY" ? "Note" : "Reason *"}
          value={form.note}
          onChange={(v: string) => setForm({ ...form, note: v })}
          rows={3}
        />
        {form.status === "CONDEMNED" && (
          <p className="text-sm text-warning flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Condemned weapons cannot be issued. The change is recorded in the audit trail.
          </p>
        )}
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={setState.isPending}>
          {setState.isPending ? (
            "Saving…"
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function WeaponLedgerDialog({ weapon, onClose }: { weapon: Weapon; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const ledger = useWeaponIssuances(weapon.id, page);
  return (
    <Modal isOpen onClose={onClose} title={`Ledger — ${weapon.weaponNumber}`} description={`${weapon.type} · ${weapon.make} · serial ${weapon.serialNumber}`} size="xl">
      <LedgerTable
        isPending={ledger.isPending}
        error={ledger.isError ? ledger.error.message : null}
        rows={ledger.data?.data ?? []}
        onRetry={() => ledger.refetch()}
      />
      <div className="mt-4">
        <Pager
          page={page}
          totalPages={ledger.data?.totalPages ?? 0}
          total={ledger.data?.total ?? 0}
          noun="movements"
          onPage={setPage}
        />
      </div>
    </Modal>
  );
}
