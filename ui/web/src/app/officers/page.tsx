"use client";

import * as React from "react";
import {
  Copy,
  Clock,
  KeyRound,
  Shield,
  Loader2,
  Lock,
  PencilLine,
  ShieldCheck,
  UserCog,
  UserMinus,
  UserPlus,
  UserRoundCheck,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ActivityTrail } from "@/components/platform/ActivityTrail";
import {
  useAssignRole,
  useRoles,
  useRolesOfOfficer,
  useUnassignRole,
} from "@/hooks/use-roles";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import {
  useAmendOfficer,
  useCreateOfficer,
  useDeactivateOfficer,
  useOfficerOptions,
  useOfficers,
  useReactivateOfficer,
  useResetOfficerPassword,
} from "@/hooks/use-officers";
import type { IssuedPassword, Officer, OfficerStatusFilter } from "@/lib/api/officers";
import { ApiClientError } from "@/lib/api/client";
import { PageHeader, Panel, StatusPill } from "@/components/platform/primitives";
import { DataTable, type Column } from "@/components/platform/data-table";
import type { Action } from "@/components/platform/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { toast } from "@/stores/toastStore";
import { formatDateTime } from "@/lib/utils";
import type { Role } from "@/types";

/**
 * Officer accounts.
 *
 * The register of who may sign in. Before this screen existed every account in
 * the platform had been inserted by hand, so joining a force, transferring and
 * retiring were all database work.
 *
 * Two rules shape what is on screen. A department is never chosen — the create
 * and transfer forms ask for a station and the department comes with it. And
 * an account is never deleted — the nearest thing is a closure, and the dialog
 * says so in as many words, because an administrator who believes it is a
 * deletion will use it wrongly.
 */

const fieldClass = "rounded-md border border-border bg-surface px-3 py-2 text-sm";

export default function OfficersPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);

  const [status, setStatus] = React.useState<OfficerStatusFilter>("");
  const officers = useOfficers({ status });

  // Mirrors the API: the Superintendent and above opens, amends and closes an
  // account; the roster itself is readable from DSP. The API's answer is the
  // authority — this only decides what to offer.
  const canRead = Boolean(user && hasMinimumRole(user.role as Role, "DSP"));
  const canAdminister = Boolean(user && hasMinimumRole(user.role as Role, "SP"));

  const options = useOfficerOptions(canAdminister);

  const [creating, setCreating] = React.useState(false);
  const [amending, setAmending] = React.useState<Officer | null>(null);
  const [closing, setClosing] = React.useState<Officer | null>(null);
  const [reopening, setReopening] = React.useState<Officer | null>(null);
  const [resetting, setResetting] = React.useState<Officer | null>(null);
  const [editingRoles, setEditingRoles] = React.useState<Officer | null>(null);
  const [viewingActivity, setViewingActivity] = React.useState<Officer | null>(null);
  const [issued, setIssued] = React.useState<IssuedPassword | null>(null);

  const forbidden =
    (officers.error instanceof ApiClientError && officers.error.code === 403) || !canRead;

  if (forbidden) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-4">
          <PageHeader
            title={t("officersScreen.nav.name")}
            description={t("officersScreen.nav.desc")}
            icon={ShieldCheck}
          />
          <Alert variant="warning">
            <Lock />
            <div>
              <AlertTitle>{t("officersScreen.refusedTitle")}</AlertTitle>
              <AlertDescription>{t("officersScreen.needsSP")}</AlertDescription>
            </div>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const rows = officers.data ?? [];

  const columns: Column<Officer>[] = [
    {
      id: "officer",
      header: t("officersScreen.column.officer"),
      sortValue: (o) => o.name,
      searchValue: (o) => `${o.name} ${o.username} ${o.badgeNumber ?? ""}`,
      cell: (o) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{o.name}</span>
          <span className="font-mono text-xs text-foreground-subtle">
            {o.username}
            {o.badgeNumber ? ` · ${o.badgeNumber}` : ""}
          </span>
        </div>
      ),
    },
    {
      id: "rank",
      header: t("officersScreen.column.rank"),
      sortValue: (o) => o.role,
      cell: (o) => <span className="text-sm text-foreground">{o.role.replace(/_/g, " ")}</span>,
    },
    {
      id: "posting",
      header: t("officersScreen.column.posting"),
      sortValue: (o) => o.stationName ?? "",
      searchValue: (o) => o.stationName ?? "",
      hideBelow: "md",
      cell: (o) => <span className="text-sm text-foreground-muted">{o.stationName || "—"}</span>,
    },
    {
      id: "department",
      header: t("officersScreen.column.department"),
      sortValue: (o) => o.forceShortName,
      hideBelow: "sm",
      cell: (o) => <StatusPill tone="neutral">{o.forceShortName}</StatusPill>,
    },
    {
      id: "status",
      header: t("officersScreen.column.status"),
      sortValue: (o) => (o.isActive ? 1 : 0),
      cell: (o) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill tone={o.isActive ? "success" : "neutral"}>
            {t(o.isActive ? "officersScreen.status.active" : "officersScreen.status.inactive")}
          </StatusPill>
          {o.isActive && o.mustChangePassword && (
            <span className="text-xs text-foreground-subtle">
              {t("officersScreen.status.owesPasswordChange")}
            </span>
          )}
        </div>
      ),
    },
    {
      id: "lastLogin",
      header: t("officersScreen.column.lastLogin"),
      sortValue: (o) => o.lastLogin ?? "",
      hideBelow: "lg",
      cell: (o) => (
        <span className="text-xs text-foreground-muted">
          {o.lastLogin ? formatDateTime(o.lastLogin) : t("officersScreen.status.neverSignedIn")}
        </span>
      ),
    },
  ];

  const rowActions = (o: Officer): Action[] => {
    if (!canAdminister) return [];
    const actions: Action[] = [
      {
        kind: "action",
        id: "amend",
        label: t("officersScreen.actions.amend"),
        icon: PencilLine,
        onSelect: () => setAmending(o),
      },
      {
        kind: "action",
        id: "password",
        label: t("officersScreen.actions.resetPassword"),
        icon: KeyRound,
        onSelect: () => setResetting(o),
      },
      {
        // Rank is amended above; this is the officer's job. The two are kept
        // apart deliberately — a promotion should not silently change what
        // somebody is responsible for.
        kind: "action",
        id: "roles",
        label: "Roles",
        icon: Shield,
        onSelect: () => setEditingRoles(o),
      },
      { kind: "separator", id: "sep" },
    ];
    actions.push(
      o.isActive
        ? {
            kind: "action",
            id: "deactivate",
            label: t("officersScreen.actions.deactivate"),
            icon: UserMinus,
            destructive: true,
            onSelect: () => setClosing(o),
          }
        : {
            kind: "action",
            id: "reactivate",
            label: t("officersScreen.actions.reactivate"),
            icon: UserRoundCheck,
            onSelect: () => setReopening(o),
          },
    );
    return actions;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("officersScreen.nav.name")}
          description={t("officersScreen.nav.desc")}
          icon={UserCog}
          breadcrumb={[
            { label: t("nav.knowledgeGroup") },
            { label: t("officersScreen.nav.name") },
          ]}
          actions={
            canAdminister ? (
              <Button onClick={() => setCreating(true)} data-testid="open-account">
                <UserPlus className="h-4 w-4" />
                {t("officersScreen.actions.create")}
              </Button>
            ) : undefined
          }
        />

        <Alert variant="info">
          <UserCog />
          <div>
            <AlertDescription>{t("officersScreen.lead")}</AlertDescription>
          </div>
        </Alert>

        {!canAdminister && (
          <Alert variant="default">
            <ShieldCheck />
            <div>
              <AlertDescription>{t("officersScreen.needsSP")}</AlertDescription>
            </div>
          </Alert>
        )}

        <Panel
          title={t("officersScreen.roster")}
          description={t("officersScreen.rosterNote", { n: rows.length })}
          bodyClassName="p-0"
        >
          {officers.isPending ? (
            <p className="flex items-center gap-2 p-6 text-sm text-foreground-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("common.loading")}
            </p>
          ) : (
            <div className="p-4">
              <DataTable
                rows={rows}
                columns={columns}
                rowKey={(o) => o.id}
                rowActions={rowActions}
                onRowSelect={(o) => (canAdminister ? setAmending(o) : undefined)}
                searchPlaceholder={t("officersScreen.searchPlaceholder")}
                emptyTitle={t("officersScreen.empty")}
                toolbar={
                  <div className="flex gap-2" data-testid="officer-filters">
                    {(["", "active", "inactive"] as OfficerStatusFilter[]).map((value) => (
                      <Button
                        key={value || "all"}
                        size="sm"
                        variant={status === value ? "default" : "outline"}
                        onClick={() => setStatus(value)}
                      >
                        {t(
                          `officersScreen.filter.${value === "" ? "all" : value}` as TranslationKey,
                        )}
                      </Button>
                    ))}
                  </div>
                }
              />
            </div>
          )}
        </Panel>
      </div>

      {creating && (
        <CreateDialog
          postings={options.data?.postings ?? []}
          ranks={options.data?.ranks ?? []}
          onClose={() => setCreating(false)}
          onIssued={(result) => {
            setCreating(false);
            setIssued(result);
          }}
        />
      )}

      {amending && (
        <AmendDialog
          officer={amending}
          postings={options.data?.postings ?? []}
          ranks={options.data?.ranks ?? []}
          readOnly={!canAdminister}
          onClose={() => setAmending(null)}
        />
      )}

      {closing && <DeactivateDialog officer={closing} onClose={() => setClosing(null)} />}
      {reopening && <ReactivateDialog officer={reopening} onClose={() => setReopening(null)} />}

      {viewingActivity && (
        <Modal
          isOpen
          onClose={() => setViewingActivity(null)}
          title={`Activity — ${viewingActivity.name}`}
          size="lg"
        >
          <ActivityTrail officerId={viewingActivity.id} days={7} />
          <ModalFooter>
            <Button onClick={() => setViewingActivity(null)}>Done</Button>
          </ModalFooter>
        </Modal>
      )}
      {editingRoles && (
        <OfficerRolesDialog officer={editingRoles} onClose={() => setEditingRoles(null)} />
      )}
      {resetting && (
        <ResetPasswordDialog
          officer={resetting}
          onClose={() => setResetting(null)}
          onIssued={(result) => {
            setResetting(null);
            setIssued(result);
          }}
        />
      )}

      {issued && <IssuedPasswordDialog issued={issued} onClose={() => setIssued(null)} />}
    </DashboardLayout>
  );
}

/**
 * A refusal is the rule that stopped it, stated against the form rather than
 * thrown away in a toast. 403 and 409 are rules — another department's
 * officer, a rank above the administrator's own, a username already taken.
 */
function useRefusal() {
  const { t } = useI18n();
  const [refusal, setRefusal] = React.useState<string | null>(null);

  const catchRefusal = (title: string, err: unknown) => {
    if (err instanceof ApiClientError && (err.code === 403 || err.code === 409)) {
      setRefusal(err.message);
      return;
    }
    toast.error(title, err instanceof Error ? err.message : t("common.error"));
  };

  const banner = refusal ? (
    <Alert variant="info" data-testid="officer-refusal">
      <ShieldCheck />
      <div>
        <AlertTitle>{t("officersScreen.refusedTitle")}</AlertTitle>
        <AlertDescription>{refusal}</AlertDescription>
      </div>
    </Alert>
  ) : null;

  return { banner, catchRefusal, clear: () => setRefusal(null) };
}

function PostingSelect({
  postings,
  value,
  onChange,
  testId,
}: {
  postings: { id: string; name: string; forceShortName: string }[];
  value: string;
  onChange: (value: string) => void;
  testId: string;
}) {
  return (
    <select
      className={fieldClass}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid={testId}
    >
      <option value="">—</option>
      {postings.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} · {p.forceShortName}
        </option>
      ))}
    </select>
  );
}

function CreateDialog({
  postings,
  ranks,
  onClose,
  onIssued,
}: {
  postings: { id: string; name: string; forceShortName: string }[];
  ranks: string[];
  onClose: () => void;
  onIssued: (issued: IssuedPassword) => void;
}) {
  const { t } = useI18n();
  const create = useCreateOfficer();
  const { banner, catchRefusal, clear } = useRefusal();

  const [username, setUsername] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [badgeNumber, setBadgeNumber] = React.useState("");
  const [role, setRole] = React.useState(ranks[0] ?? "CONSTABLE");
  const [stationId, setStationId] = React.useState("");

  React.useEffect(() => {
    if (ranks.length > 0 && !ranks.includes(role)) setRole(ranks[0]);
  }, [ranks, role]);

  const ready =
    username.trim().length > 0 &&
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    stationId !== "";

  const submit = async () => {
    clear();
    try {
      const issued = await create.mutateAsync({
        username: username.trim().toLowerCase(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        badgeNumber: badgeNumber.trim() || undefined,
        role,
        stationId,
      });
      toast.success(t("officersScreen.create.opened"), issued.officer.username);
      onIssued(issued);
    } catch (err) {
      catchRefusal(t("officersScreen.actions.create"), err);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t("officersScreen.create.title")}
      description={t("officersScreen.create.lead")}
      size="lg"
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("officersScreen.create.username")}</span>
            <input
              className={`${fieldClass} font-mono`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              data-testid="officer-username"
            />
            <span className="text-xs text-foreground-subtle">
              {t("officersScreen.create.usernameHelp")}
            </span>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("officersScreen.create.name")}</span>
            <input
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="officer-name"
            />
            <span className="text-xs text-foreground-subtle">
              {t("officersScreen.create.nameHelp")}
            </span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("officersScreen.create.email")}</span>
            <input
              className={fieldClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="officer-email"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("officersScreen.create.phone")}</span>
            <input
              className={fieldClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              data-testid="officer-phone"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("officersScreen.create.badge")}</span>
            <input
              className={`${fieldClass} font-mono`}
              value={badgeNumber}
              onChange={(e) => setBadgeNumber(e.target.value)}
              data-testid="officer-badge"
            />
            <span className="text-xs text-foreground-subtle">
              {t("officersScreen.create.badgeHelp")}
            </span>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("officersScreen.create.rank")}</span>
            <select
              className={fieldClass}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              data-testid="officer-rank"
            >
              {ranks.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <span className="text-xs text-foreground-subtle">
              {t("officersScreen.create.rankHelp")}
            </span>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t("officersScreen.create.posting")}</span>
          <PostingSelect
            postings={postings}
            value={stationId}
            onChange={setStationId}
            testId="officer-posting"
          />
          <span className="text-xs text-foreground-subtle">
            {t("officersScreen.create.postingHelp")}
          </span>
        </label>

        {banner}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button onClick={submit} disabled={!ready || create.isPending} data-testid="submit-officer">
          {create.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {t("officersScreen.create.submit")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function AmendDialog({
  officer,
  postings,
  ranks,
  readOnly,
  onClose,
}: {
  officer: Officer;
  postings: { id: string; name: string; forceShortName: string }[];
  ranks: string[];
  readOnly: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const amend = useAmendOfficer();
  const { banner, catchRefusal, clear } = useRefusal();

  const [name, setName] = React.useState(officer.name);
  const [email, setEmail] = React.useState(officer.email);
  const [phone, setPhone] = React.useState(officer.phone ?? "");
  const [badgeNumber, setBadgeNumber] = React.useState(officer.badgeNumber ?? "");
  const [role, setRole] = React.useState(officer.role);
  const [stationId, setStationId] = React.useState(officer.stationId ?? "");

  // A posting in another department is a transfer, and the screen says so
  // before the administrator commits to it rather than afterwards.
  const target = postings.find((p) => p.id === stationId);
  const crossesDepartment =
    Boolean(target) && stationId !== (officer.stationId ?? "") &&
    target!.forceShortName !== officer.forceShortName;

  const submit = async () => {
    clear();
    try {
      const saved = await amend.mutateAsync({
        id: officer.id,
        input: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          badgeNumber: badgeNumber.trim(),
          role,
          stationId: stationId || undefined,
        },
      });
      toast.success(t("officersScreen.amend.saved"), saved.username);
      onClose();
    } catch (err) {
      catchRefusal(t("officersScreen.actions.amend"), err);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t("officersScreen.amend.title", { name: officer.name })}
      description={t("officersScreen.amend.lead")}
      size="lg"
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("officersScreen.create.name")}</span>
            <input
              className={fieldClass}
              value={name}
              disabled={readOnly}
              onChange={(e) => setName(e.target.value)}
              data-testid="amend-name"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("officersScreen.create.email")}</span>
            <input
              className={fieldClass}
              value={email}
              disabled={readOnly}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("officersScreen.create.phone")}</span>
            <input
              className={fieldClass}
              value={phone}
              disabled={readOnly}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("officersScreen.create.badge")}</span>
            <input
              className={`${fieldClass} font-mono`}
              value={badgeNumber}
              disabled={readOnly}
              onChange={(e) => setBadgeNumber(e.target.value)}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("officersScreen.create.rank")}</span>
            <select
              className={fieldClass}
              value={role}
              disabled={readOnly}
              onChange={(e) => setRole(e.target.value)}
            >
              {(ranks.includes(role) ? ranks : [role, ...ranks]).map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("officersScreen.create.posting")}</span>
            <PostingSelect
              postings={postings}
              value={stationId}
              onChange={setStationId}
              testId="amend-posting"
            />
          </label>
        </div>

        {crossesDepartment && (
          <Alert variant="warning" data-testid="transfer-note">
            <UserCog />
            <div>
              <AlertDescription>
                {t("officersScreen.amend.transferNote", { force: target!.forceShortName })}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {!officer.isActive && (
          <p className="text-xs text-foreground-muted">
            {t("officersScreen.detail.closedOn")}:{" "}
            {officer.deactivatedAt ? formatDateTime(officer.deactivatedAt) : "—"}
            {officer.deactivatedByName
              ? ` · ${t("officersScreen.detail.closedBy")} ${officer.deactivatedByName}`
              : ""}
            {officer.deactivationReason ? ` — ${officer.deactivationReason}` : ""}
          </p>
        )}

        {banner}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        {!readOnly && (
          <Button onClick={submit} disabled={amend.isPending} data-testid="submit-amendment">
            {amend.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PencilLine className="h-4 w-4" />
            )}
            {t("officersScreen.amend.submit")}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

function DeactivateDialog({ officer, onClose }: { officer: Officer; onClose: () => void }) {
  const { t } = useI18n();
  const deactivate = useDeactivateOfficer();
  const { banner, catchRefusal, clear } = useRefusal();
  const [reason, setReason] = React.useState("");

  const submit = async () => {
    clear();
    try {
      await deactivate.mutateAsync({ id: officer.id, reason: reason.trim() });
      toast.success(t("officersScreen.deactivate.closed"), officer.username);
      onClose();
    } catch (err) {
      catchRefusal(t("officersScreen.actions.deactivate"), err);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t("officersScreen.deactivate.title", { name: officer.name })}
    >
      <div className="flex flex-col gap-4">
        {/* Said plainly, and in the strongest place on the dialog: this is not
            a deletion, and there is no deletion to reach for instead. */}
        <Alert variant="warning" data-testid="not-a-deletion">
          <ShieldCheck />
          <div>
            <AlertDescription>{t("officersScreen.deactivate.notADeletion")}</AlertDescription>
          </div>
        </Alert>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t("officersScreen.deactivate.reason")}</span>
          <textarea
            className={`${fieldClass} min-h-24`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            data-testid="deactivate-reason"
          />
          <span className="text-xs text-foreground-subtle">
            {t("officersScreen.deactivate.reasonHelp")}
          </span>
        </label>

        {banner}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          variant="destructive"
          onClick={submit}
          disabled={reason.trim().length === 0 || deactivate.isPending}
          data-testid="confirm-deactivate"
        >
          {deactivate.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserMinus className="h-4 w-4" />
          )}
          {t("officersScreen.deactivate.confirm")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function ReactivateDialog({ officer, onClose }: { officer: Officer; onClose: () => void }) {
  const { t } = useI18n();
  const reactivate = useReactivateOfficer();
  const { banner, catchRefusal, clear } = useRefusal();

  const submit = async () => {
    clear();
    try {
      await reactivate.mutateAsync(officer.id);
      toast.success(t("officersScreen.deactivate.reopened"), officer.username);
      onClose();
    } catch (err) {
      catchRefusal(t("officersScreen.actions.reactivate"), err);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t("officersScreen.deactivate.reactivateTitle", { name: officer.name })}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-foreground-muted">
          {t("officersScreen.deactivate.reactivateBody")}
        </p>
        {banner}
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button onClick={submit} disabled={reactivate.isPending} data-testid="confirm-reactivate">
          {reactivate.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserRoundCheck className="h-4 w-4" />
          )}
          {t("officersScreen.deactivate.reactivateConfirm")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function ResetPasswordDialog({
  officer,
  onClose,
  onIssued,
}: {
  officer: Officer;
  onClose: () => void;
  onIssued: (issued: IssuedPassword) => void;
}) {
  const { t } = useI18n();
  const reset = useResetOfficerPassword();
  const { banner, catchRefusal, clear } = useRefusal();

  const submit = async () => {
    clear();
    try {
      onIssued(await reset.mutateAsync(officer.id));
    } catch (err) {
      catchRefusal(t("officersScreen.actions.resetPassword"), err);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t("officersScreen.password.resetTitle", { name: officer.name })}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-foreground-muted">{t("officersScreen.password.resetLead")}</p>
        {banner}
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button onClick={submit} disabled={reset.isPending} data-testid="confirm-reset">
          {reset.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="h-4 w-4" />
          )}
          {t("officersScreen.password.resetConfirm")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

/**
 * The password, once.
 *
 * It is held in this component's state and nowhere else: not in the query
 * cache, not in local storage, not in a toast that could be scrolled back to.
 * Closing the dialog is the end of it.
 */
function IssuedPasswordDialog({
  issued,
  onClose,
}: {
  issued: IssuedPassword;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(issued.password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // A browser that refuses the clipboard is not a failure worth a dialog:
      // the password is on screen and can be read off it.
      setCopied(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={t("officersScreen.password.title", { name: issued.officer.name })}
      showCloseButton={false}
    >
      <div className="flex flex-col gap-4">
        <Alert variant="warning">
          <KeyRound />
          <div>
            <AlertDescription>{t("officersScreen.password.shownOnce")}</AlertDescription>
          </div>
        </Alert>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            {t("officersScreen.password.label")}
          </span>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 select-all rounded-md border border-border bg-surface-muted px-3 py-2 font-mono text-base tracking-wide text-foreground"
              data-testid="issued-password"
            >
              {issued.password}
            </code>
            <Button variant="outline" size="sm" onClick={copy}>
              <Copy className="h-4 w-4" />
              {copied ? t("officersScreen.password.copied") : t("officersScreen.password.copy")}
            </Button>
          </div>
          <span className="text-xs text-foreground-subtle">
            {t("officersScreen.password.mustChange")}
          </span>
        </div>

        <p className="text-xs text-foreground-muted">
          {issued.officer.username} · {issued.officer.role.replace(/_/g, " ")} ·{" "}
          {issued.officer.stationName} · {issued.officer.forceShortName}
        </p>
      </div>

      <ModalFooter>
        <Button onClick={onClose} data-testid="password-handed-over">
          {t("officersScreen.password.done")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}


/**
 * The roles an officer holds, and the ones they could be given.
 *
 * The rank role is shown but cannot be touched here: it follows the rank, and
 * the rank is amended on the form above. Offering it would mean offering a
 * change the server refuses and the database would undo at the next promotion.
 */
function OfficerRolesDialog({ officer, onClose }: { officer: Officer; onClose: () => void }) {
  const held = useRolesOfOfficer(officer.id);
  const all = useRoles();
  const assign = useAssignRole();
  const unassign = useUnassignRole();

  const heldIds = new Set((held.data ?? []).map((r) => r.id));
  const assignable = (all.data ?? []).filter((r) => !r.isRankDefault);
  const problem = (err: unknown) =>
    err instanceof Error ? err.message : "The server rejected the request";

  return (
    <Modal isOpen onClose={onClose} title={`Roles — ${officer.name}`}>
      <div className="space-y-4">
        <p className="text-sm text-foreground-muted">
          Rank says how senior {officer.name.split(" ")[0]} is. A role says what they do. The rank
          role follows the rank and is changed by amending the rank.
        </p>

        {(held.isPending || all.isPending) && (
          <p className="text-sm text-foreground-muted">Loading…</p>
        )}

        <div className="space-y-1.5">
          {(held.data ?? [])
            .filter((r) => r.isRankDefault)
            .map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-md border border-border bg-background-secondary px-3 py-2"
              >
                <span className="text-sm text-foreground">{r.name}</span>
                <span className="text-xs text-foreground-subtle">follows the rank</span>
              </div>
            ))}
        </div>

        {assignable.length === 0 && !all.isPending && (
          <p className="text-sm text-foreground-muted">
            No roles have been made yet. Create one under Settings → Roles and permissions.
          </p>
        )}

        <div className="space-y-1.5">
          {assignable.map((r) => {
            const on = heldIds.has(r.id);
            const busy = assign.isPending || unassign.isPending;
            return (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-foreground">{r.name}</span>
                  <span className="block truncate text-xs text-foreground-muted">
                    {r.grantCount} permissions
                  </span>
                </span>
                <Button
                  size="sm"
                  variant={on ? "outline" : "default"}
                  disabled={busy}
                  onClick={() => {
                    const run = on ? unassign : assign;
                    run.mutate(
                      { officerId: officer.id, roleId: r.id },
                      {
                        onSuccess: () =>
                          toast.success(
                            on ? "Role withdrawn" : "Role given",
                            `${officer.name} ${on ? "no longer holds" : "now holds"} ${r.name}.`,
                          ),
                        onError: (err) => toast.error("Not changed", problem(err)),
                      },
                    );
                  }}
                >
                  {on ? "Withdraw" : "Give"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <ModalFooter>
        <Button onClick={onClose}>Done</Button>
      </ModalFooter>
    </Modal>
  );
}
