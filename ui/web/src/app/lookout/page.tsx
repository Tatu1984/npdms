"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Loader2,
  MapPin,
  Plus,
  Search,
  Siren,
  Trash2,
  UserSearch,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LegacySelect as Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import { useIssueLookout, useLookouts, useLookoutStats } from "@/hooks/use-lookouts";
import { firsApi } from "@/lib/api/firs";
import {
  LOOKOUT_PRIORITIES,
  LOOKOUT_TYPES,
  type LookoutPriority,
  type LookoutStatus,
  type LookoutType,
} from "@/lib/api/lookouts";
import { formatDateTime } from "@/lib/utils";
import { lookoutStatusConfig, lookoutTypeLabel, priorityVariant } from "./labels";

const PAGE_SIZE = 20;

export default function LookoutPage() {
  const { user } = useAuthStore();
  const canIssue = Boolean(user && hasMinimumRole(user.role, "SI"));

  const [searchQuery, setSearchQuery] = useState("");
  const search = useDeferredValue(searchQuery.trim());
  const [status, setStatus] = useState<"" | LookoutStatus>("ACTIVE");
  const [type, setType] = useState<"" | LookoutType>("");
  const [priority, setPriority] = useState<"" | LookoutPriority>("");
  const [page, setPage] = useState(1);
  const [showIssue, setShowIssue] = useState(false);

  const lookouts = useLookouts({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status: status || undefined,
    type: type || undefined,
    priority: priority || undefined,
  });
  const stats = useLookoutStats();
  const rows = lookouts.data?.data ?? [];
  const totalPages = lookouts.data?.totalPages ?? 0;

  const statCards = [
    { key: "active", label: "Active Notices", value: stats.data?.active, icon: Siren, wrap: "bg-error/10", color: "text-error", filter: "ACTIVE" as const },
    { key: "critical", label: "Critical & Active", value: stats.data?.critical, icon: AlertTriangle, wrap: "bg-warning/10", color: "text-warning", filter: null },
    { key: "unverified", label: "Sightings Awaiting Verification", value: stats.data?.unverifiedSightings, icon: Eye, wrap: "bg-info/10", color: "text-info", filter: null },
    { key: "located", label: "Located", value: stats.data?.located, icon: CheckCircle, wrap: "bg-success/10", color: "text-success", filter: "LOCATED" as const },
    { key: "closed", label: "Closed", value: stats.data?.closed, icon: XCircle, wrap: "bg-background-tertiary", color: "text-foreground-muted", filter: "CLOSED" as const },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lookout Notices</h1>
            <p className="text-foreground-muted">Wanted, missing and sought persons and vehicles, with reported sightings</p>
          </div>
          {canIssue && (
            <Button onClick={() => setShowIssue(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Issue Notice
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {statCards.map(({ key, label, value, icon: Icon, wrap, color, filter }) => (
            <Card
              key={key}
              className={filter ? `cursor-pointer transition-all hover:border-accent/50 ${status === filter ? "border-accent ring-1 ring-accent" : ""}` : ""}
              onClick={
                filter
                  ? () => {
                      setStatus(status === filter ? "" : filter);
                      setPage(1);
                    }
                  : undefined
              }
            >
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

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[16rem]">
                <Input
                  placeholder="Search by notice number, subject or description..."
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
                  setStatus(e.target.value as "" | LookoutStatus);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="LOCATED">Located</option>
                <option value="CLOSED">Closed</option>
              </select>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as "" | LookoutType);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="">All Types</option>
                {LOOKOUT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {lookoutTypeLabel[t]}
                  </option>
                ))}
              </select>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value as "" | LookoutPriority);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="">All Priorities</option>
                {LOOKOUT_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {lookouts.isPending ? (
          <Card>
            <CardContent className="p-12 flex items-center justify-center gap-3 text-foreground-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading notices…
            </CardContent>
          </Card>
        ) : lookouts.isError ? (
          <Card className="border-error/30">
            <CardContent className="p-12 text-center space-y-3">
              <AlertTriangle className="h-10 w-10 text-error mx-auto" />
              <p className="text-foreground font-medium">Notices could not be loaded</p>
              <p className="text-foreground-muted">{lookouts.error.message}</p>
              <Button variant="secondary" onClick={() => lookouts.refetch()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UserSearch className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
              <p className="text-foreground font-medium">No notices found</p>
              <p className="text-foreground-muted">
                {search || status || type || priority ? "Try adjusting the filters" : "No lookout notices have been issued yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rows.map((l) => (
              <Card key={l.id} className="hover:border-accent/50 transition-colors">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-foreground">{l.lookoutNumber}</span>
                        <Badge variant="secondary">{lookoutTypeLabel[l.type]}</Badge>
                        <Badge variant={priorityVariant[l.priority]}>{l.priority}</Badge>
                        <Badge variant={lookoutStatusConfig[l.status].variant}>{lookoutStatusConfig[l.status].label}</Badge>
                      </div>
                      <p className="text-lg font-semibold text-foreground">{l.subject}</p>
                      <p className="text-sm text-foreground-muted line-clamp-2">{l.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-foreground-muted">
                        <span>
                          Issued {formatDateTime(l.issuedAt)} by {l.issuedByName} · {l.stationName}
                        </span>
                        {l.firNumber && <span>FIR {l.firNumber}</span>}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-sm text-foreground-muted">
                        <p className="flex items-center gap-1 justify-end">
                          <MapPin className="h-4 w-4" />
                          {l.sightingCount} sighting{l.sightingCount === 1 ? "" : "s"} · {l.verifiedCount} verified
                        </p>
                        {l.lastSightedAt && <p>Last sighted {formatDateTime(l.lastSightedAt)}</p>}
                      </div>
                      <Link href={`/lookout/${l.id}`}>
                        <Button variant="secondary" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Open
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-foreground-muted">
                <span>
                  Page {page} of {totalPages} · {lookouts.data?.total} notices
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showIssue && <IssueNoticeDialog onClose={() => setShowIssue(false)} />}
    </DashboardLayout>
  );
}

function IssueNoticeDialog({ onClose }: { onClose: () => void }) {
  const issue = useIssueLookout();
  const [form, setForm] = useState({
    type: "WANTED" as LookoutType,
    priority: "NORMAL" as LookoutPriority,
    subject: "",
    description: "",
  });
  const [details, setDetails] = useState<Array<{ key: string; value: string }>>([{ key: "", value: "" }]);
  const [fir, setFir] = useState<{ id: string; label: string } | null>(null);
  const [firSearch, setFirSearch] = useState("");
  const deferredFirSearch = useDeferredValue(firSearch.trim());
  const firs = useQuery({
    queryKey: ["firs", "picker", deferredFirSearch],
    queryFn: () => firsApi.list({ search: deferredFirSearch || undefined, pageSize: 8 }),
    enabled: !fir && deferredFirSearch.length > 0,
  });

  const submit = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error("Validation Error", "Subject and description are required");
      return;
    }
    const detailMap: Record<string, string> = {};
    for (const { key, value } of details) {
      if (key.trim() && value.trim()) detailMap[key.trim()] = value.trim();
    }
    try {
      const notice = await issue.mutateAsync({
        type: form.type,
        priority: form.priority,
        subject: form.subject.trim(),
        description: form.description.trim(),
        details: detailMap,
        firId: fir?.id ?? null,
      });
      toast.success("Notice Issued", `${notice.lookoutNumber} — ${notice.subject}`);
      onClose();
    } catch (err) {
      toast.error("Notice not issued", err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Issue Lookout Notice" description="Circulated to officers across the platform" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Type *"
            value={form.type}
            onChange={(v: string) => setForm({ ...form, type: v as LookoutType })}
            options={LOOKOUT_TYPES.map((t) => ({ value: t, label: lookoutTypeLabel[t] }))}
          />
          <Select
            label="Priority *"
            value={form.priority}
            onChange={(v: string) => setForm({ ...form, priority: v as LookoutPriority })}
            options={LOOKOUT_PRIORITIES.map((p) => ({ value: p, label: p.charAt(0) + p.slice(1).toLowerCase() }))}
          />
        </div>
        <Input
          label="Subject *"
          placeholder={form.type === "STOLEN_VEHICLE" ? "Registration number and vehicle" : "Name or description of the person"}
          value={form.subject}
          onChange={(v: string) => setForm({ ...form, subject: v })}
        />
        <Textarea
          label="Description *"
          placeholder="Why the subject is sought and what officers should do on sighting"
          value={form.description}
          onChange={(v: string) => setForm({ ...form, description: v })}
          rows={3}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Identifying Details</p>
          {details.map((row, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  placeholder="e.g. Height, Colour, Last seen wearing"
                  value={row.key}
                  onChange={(v: string) => setDetails(details.map((d, i) => (i === index ? { ...d, key: v } : d)))}
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Value"
                  value={row.value}
                  onChange={(v: string) => setDetails(details.map((d, i) => (i === index ? { ...d, value: v } : d)))}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Remove detail"
                onClick={() => setDetails(details.length === 1 ? [{ key: "", value: "" }] : details.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setDetails([...details, { key: "", value: "" }])}>
            <Plus className="h-4 w-4 mr-1" />
            Add detail
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Linked FIR (optional)</p>
          {fir ? (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="font-mono text-sm text-foreground">{fir.label}</span>
              <Button variant="ghost" size="sm" onClick={() => setFir(null)}>
                Remove
              </Button>
            </div>
          ) : (
            <>
              <Input
                placeholder="Search FIRs by number or complainant"
                value={firSearch}
                onChange={setFirSearch}
                icon={<Search className="h-4 w-4" />}
              />
              {deferredFirSearch && (
                <div className="rounded-lg border border-border divide-y divide-border max-h-40 overflow-y-auto">
                  {firs.isPending ? (
                    <p className="p-3 text-sm text-foreground-muted">Searching…</p>
                  ) : firs.isError ? (
                    <p className="p-3 text-sm text-error">FIRs could not be loaded: {firs.error.message}</p>
                  ) : firs.data.data.length === 0 ? (
                    <p className="p-3 text-sm text-foreground-muted">No matching FIRs</p>
                  ) : (
                    firs.data.data.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className="w-full text-left p-3 hover:bg-background-tertiary"
                        onClick={() => setFir({ id: f.id, label: `${f.firNumber} · ${f.complainantName}` })}
                      >
                        <span className="font-mono text-sm text-foreground">{f.firNumber}</span>
                        <span className="block text-xs text-foreground-muted">{f.incidentLocation}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={issue.isPending}>
          {issue.isPending ? "Issuing…" : "Issue Notice"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
