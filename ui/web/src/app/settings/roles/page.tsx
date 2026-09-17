"use client";

import * as React from "react";
import { Check, KeyRound, Loader2, Plus, Search, Shield, Trash2, Users } from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState, PageHeader, Panel } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { toast } from "@/stores/toastStore";
import {
  useCreateRole,
  useDeleteRole,
  usePermissionCatalogue,
  useRole,
  useRoles,
  useSetRolePermissions,
  useMyPermissions,
} from "@/hooks/use-roles";
import type { Permission, Role } from "@/lib/api/roles";

const failure = (err: unknown) =>
  err instanceof Error ? err.message : "The server rejected the request";

/** The catalogue, grouped the way an administrator reads it. */
function byModule(permissions: Permission[]): [string, Permission[]][] {
  const groups = new Map<string, Permission[]>();
  for (const p of permissions) {
    const list = groups.get(p.module) ?? [];
    list.push(p);
    groups.set(p.module, list);
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

const moduleLabel = (module: string) =>
  module.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

export default function RolesPage() {
  const mine = useMyPermissions();
  const held = React.useMemo(() => new Set(mine.data?.permissions ?? []), [mine.data]);
  const canView = held.has("roles.view");
  const canCreate = held.has("roles.create");
  const canGrant = held.has("roles.permissions.amend");
  const canDelete = held.has("roles.delete");

  const roles = useRoles(canView);
  const catalogue = usePermissionCatalogue(canView);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<Role | null>(null);

  // Nothing here is the check. The server refuses regardless; this only keeps
  // the screen from offering a control that would be refused.
  if (mine.isPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center gap-2 p-6 text-sm text-foreground-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading your permissions…
        </div>
      </DashboardLayout>
    );
  }

  if (!canView) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Roles and permissions"
          description="What each job in the force is allowed to do."
          icon={Shield}
        />
        <EmptyState
          icon={Shield}
          title="Not available to you"
          description="Reading roles needs the roles.view permission. Your administrator can grant it."
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Roles and permissions"
          description="A role is a job. Rank says how senior an officer is; a role says what they do."
          icon={Shield}
          breadcrumb={[{ label: "Settings", href: "/settings" }, { label: "Roles and permissions" }]}
          actions={
            canCreate ? (
              <Button onClick={() => setCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New role
              </Button>
            ) : undefined
          }
        />

        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <Panel title="Roles" bodyClassName="p-0">
            {roles.isPending && (
              <div className="flex items-center gap-2 p-4 text-sm text-foreground-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            )}
            {roles.data?.length === 0 && (
              <p className="p-4 text-sm text-foreground-muted">No roles yet.</p>
            )}
            <ul className="divide-y divide-border">
              {roles.data?.map((role) => (
                <li key={role.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(role.id)}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover ${
                      selectedId === role.id ? "bg-surface-hover" : ""
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {role.name}
                        </span>
                        {role.isRankDefault && (
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            rank
                          </Badge>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-foreground-muted">
                        {role.grantCount} permissions · {role.holderCount} officer
                        {role.holderCount === 1 ? "" : "s"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          {selectedId ? (
            <RoleDetail
              roleId={selectedId}
              catalogue={catalogue.data ?? []}
              canGrant={canGrant}
              canDelete={canDelete}
              onDelete={setDeleting}
            />
          ) : (
            <Panel>
              <EmptyState
                icon={KeyRound}
                title="Choose a role"
                description="Pick a role to see and change what it allows."
              />
            </Panel>
          )}
        </div>
      </div>

      {creating && (
        <CreateRoleDialog catalogue={catalogue.data ?? []} onClose={() => setCreating(false)} />
      )}
      {deleting && <DeleteRoleDialog role={deleting} onClose={() => setDeleting(null)} />}
    </DashboardLayout>
  );
}

function RoleDetail({
  roleId,
  catalogue,
  canGrant,
  canDelete,
  onDelete,
}: {
  roleId: string;
  catalogue: Permission[];
  canGrant: boolean;
  canDelete: boolean;
  onDelete: (role: Role) => void;
}) {
  const role = useRole(roleId);
  const save = useSetRolePermissions();
  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  const [filter, setFilter] = React.useState("");

  // The grid reflects the role that was loaded, and resets whenever another
  // role is chosen, so an unsaved tick never carries across to a second role.
  React.useEffect(() => {
    setChecked(new Set(role.data?.permissions ?? []));
  }, [role.data?.id, role.data?.permissions]);

  const fixed = role.data?.isRankDefault ?? false;
  const editable = canGrant && !fixed;

  const dirty = React.useMemo(() => {
    const original = new Set(role.data?.permissions ?? []);
    if (original.size !== checked.size) return true;
    for (const k of checked) if (!original.has(k)) return true;
    return false;
  }, [checked, role.data?.permissions]);

  const shown = React.useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return catalogue;
    return catalogue.filter(
      (p) =>
        p.key.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle),
    );
  }, [catalogue, filter]);

  const toggle = (key: string) => {
    if (!editable) return;
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const onSave = () => {
    save.mutate(
      { id: roleId, permissions: [...checked] },
      {
        onSuccess: () => toast.success("Saved", "What this role allows has been changed."),
        onError: (err) => toast.error("Not saved", failure(err)),
      },
    );
  };

  if (role.isPending) {
    return (
      <Panel>
        <div className="flex items-center gap-2 text-sm text-foreground-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title={role.data?.name}
      description={role.data?.description || undefined}
      bodyClassName="p-0"
      footer={
        editable ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-foreground-subtle">
              {checked.size} of {catalogue.length} permissions
            </span>
            <Button size="sm" disabled={!dirty || save.isPending} onClick={onSave}>
              {save.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        ) : (
          <span className="text-xs text-foreground-subtle">
            {checked.size} of {catalogue.length} permissions
          </span>
        )
      }
    >
      {fixed && (
        <p className="border-b border-border bg-accent/5 px-4 py-3 text-xs leading-relaxed text-foreground-muted">
          This role mirrors the rank of {role.data?.name} and cannot be changed. It is what keeps
          the platform behaving as it did before roles existed. To give an officer something
          different, make a role of your own and give them that as well.
        </p>
      )}

      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-foreground-subtle" />
        <Input
          value={filter}
          onChange={setFilter}
          placeholder="Find a permission — malkhana, dispose, court…"
          className="h-8"
        />
        <span className="shrink-0 text-xs text-foreground-subtle">
          <Users className="mr-1 inline h-3 w-3" />
          {role.data?.holderCount ?? 0}
        </span>
        {canDelete && !fixed && role.data && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(role.data as Role)}
            className="shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="max-h-[32rem] overflow-y-auto">
        {byModule(shown).map(([module, permissions]) => (
          <div key={module}>
            <div className="sticky top-0 z-10 border-b border-border bg-background-secondary px-4 py-1.5 text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
              {moduleLabel(module)}
            </div>
            <ul className="divide-y divide-border">
              {permissions.map((p) => (
                <li key={p.key}>
                  <label
                    className={`flex items-start gap-3 px-4 py-2.5 ${
                      editable ? "cursor-pointer hover:bg-surface-hover" : "cursor-default"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(p.key)}
                      onChange={() => toggle(p.key)}
                      disabled={!editable}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm text-foreground">{p.description}</span>
                      <span className="block truncate font-mono text-[11px] text-foreground-subtle">
                        {p.key}
                        {p.routes.length > 0 && ` · ${p.routes.length} route${p.routes.length === 1 ? "" : "s"}`}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {shown.length === 0 && (
          <p className="p-4 text-sm text-foreground-muted">No permission matches that.</p>
        )}
      </div>
    </Panel>
  );
}

function CreateRoleDialog({
  catalogue,
  onClose,
}: {
  catalogue: Permission[];
  onClose: () => void;
}) {
  const create = useCreateRole();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const submit = () => {
    create.mutate(
      { name: name.trim(), description: description.trim(), permissions: [] },
      {
        onSuccess: (role) => {
          toast.success("Role created", `${role.name} exists. Now choose what it allows.`);
          onClose();
        },
        onError: (err) => toast.error("Not created", failure(err)),
      },
    );
  };

  return (
    <Modal isOpen onClose={onClose} title="New role">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Name</label>
          <Input
            value={name}
            onChange={setName}
            placeholder="Malkhana clerk"
            autoFocus
          />
          <p className="mt-1 text-xs text-foreground-subtle">
            Name it after the job, not the rank — ranks already have roles of their own.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">What this job is</label>
          <Textarea
            value={description}
            onChange={setDescription}
            placeholder="Keeps the property store: receives and moves items, but does not dispose of them."
            rows={3}
          />
        </div>
        <p className="text-xs text-foreground-subtle">
          It starts with no permissions. You choose them next, from the {catalogue.length} the
          platform defines.
        </p>
      </div>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!name.trim() || create.isPending}>
          {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function DeleteRoleDialog({ role, onClose }: { role: Role; onClose: () => void }) {
  const remove = useDeleteRole();
  return (
    <Modal isOpen onClose={onClose} title={`Delete ${role.name}?`}>
      <p className="text-sm text-foreground-muted">
        {role.holderCount > 0
          ? `${role.holderCount} officer${role.holderCount === 1 ? " holds" : "s hold"} this role. Take it off them before deleting it.`
          : "Nobody holds this role. Deleting it cannot be undone."}
      </p>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          disabled={role.holderCount > 0 || remove.isPending}
          onClick={() =>
            remove.mutate(role.id, {
              onSuccess: () => {
                toast.success("Deleted", `${role.name} is gone.`);
                onClose();
              },
              onError: (err) => toast.error("Not deleted", failure(err)),
            })
          }
        >
          {remove.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Delete
        </Button>
      </ModalFooter>
    </Modal>
  );
}
