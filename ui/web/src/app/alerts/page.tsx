"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  Search,
  Plus,
  Eye,
  CheckCircle,
  Megaphone,
  Radio,
  Shield,
  X,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LegacySelect as Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import {
  useAcknowledgeAlert,
  useActiveAlerts,
  useAlerts,
  useCreateAlert,
  useUnacknowledgedAlerts,
} from "@/hooks/use-alerts";
import type { Alert, AlertPriority, AlertScope, AlertType } from "@/lib/api/alerts";

const PAGE_SIZE = 20;

const typeLabels: Record<AlertType, string> = {
  FLASH: "Flash",
  URGENT: "Urgent",
  BOLO: "BOLO",
  NOTICE: "Notice",
};

const scopeLabels: Record<AlertScope, string> = {
  STATION: "Station",
  DISTRICT: "District",
  STATE: "State",
  NATIONAL: "National",
};

const priorityLabels: Record<AlertPriority, string> = { 1: "Priority 1 — highest", 2: "Priority 2", 3: "Priority 3" };

const badgeVariant: Record<AlertType, string> = {
  FLASH: "error",
  URGENT: "warning",
  BOLO: "info",
  NOTICE: "secondary",
};

const cardStyle: Record<AlertType, string> = {
  FLASH: "border-l-4 border-l-error bg-error/5",
  URGENT: "border-l-4 border-l-warning bg-warning/5",
  BOLO: "border-l-4 border-l-info bg-info/5",
  NOTICE: "border-l-4 border-l-border",
};

function formatTimeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

const emptyForm = () => ({
  type: "" as AlertType | "",
  scope: "STATION" as AlertScope,
  title: "",
  description: "",
  expiresAt: "",
  priority: 2 as AlertPriority,
});

function AlertCard({
  alert,
  onAcknowledge,
  acknowledging,
}: {
  alert: Alert;
  onAcknowledge: (alert: Alert) => void;
  acknowledging: boolean;
}) {
  const expired = new Date(alert.expiresAt) <= new Date();
  return (
    <Card className={cardStyle[alert.type]}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[16rem]">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant={badgeVariant[alert.type] as any}>{typeLabels[alert.type]}</Badge>
              <Badge variant="secondary">{scopeLabels[alert.scope]}</Badge>
              {alert.priority === 1 && <Badge variant="error">Priority 1</Badge>}
              {expired && <Badge variant="secondary">Expired</Badge>}
              <span className="text-xs text-foreground-muted">{formatTimeAgo(alert.issuedAt)}</span>
            </div>
            <h3 className="font-medium text-foreground">{alert.title}</h3>
            <p className="text-sm text-foreground-muted mt-1 line-clamp-2">{alert.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-foreground-muted">
              {alert.issuedBy && <span>From: {alert.issuedBy}</span>}
              <span>
                {expired ? "Expired" : "Expires"}: {formatDateTime(alert.expiresAt)}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {alert.acknowledged ? (
              <Badge variant="success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Acknowledged{alert.acknowledgedBy ? ` by ${alert.acknowledgedBy}` : ""}
              </Badge>
            ) : (
              !expired && (
                <Button size="sm" onClick={() => onAcknowledge(alert)} disabled={acknowledging}>
                  Acknowledge
                </Button>
              )
            )}
            {alert.resourceType === "missing_person" && alert.resourceId && (
              <Link href={`/missing-persons/${alert.resourceId}`} data-testid="alert-open-report">
                <Button variant="outline" size="sm">
                  <Radio className="h-4 w-4 mr-1" />
                  Open missing-person report
                </Button>
              </Link>
            )}
            <Link href={`/alerts/${alert.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Details
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ListState({
  isPending,
  error,
  onRetry,
  empty,
  emptyText,
}: {
  isPending: boolean;
  error: Error | null;
  onRetry: () => void;
  empty: boolean;
  emptyText: string;
}) {
  if (isPending) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center gap-3 text-foreground-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading alerts…
        </CardContent>
      </Card>
    );
  }
  if (error) {
    return (
      <Card className="border-error/30">
        <CardContent className="p-8 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-error mx-auto" />
          <p className="font-medium text-foreground">Alerts could not be loaded</p>
          <p className="text-sm text-foreground-muted">{error.message}</p>
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }
  if (empty) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-foreground-muted">{emptyText}</CardContent>
      </Card>
    );
  }
  return null;
}

export default function AlertsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const search = useDeferredValue(searchQuery.trim());
  const [typeFilter, setTypeFilter] = useState<AlertType | "">("");
  const [scopeFilter, setScopeFilter] = useState<AlertScope | "">("");
  const [ackFilter, setAckFilter] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [newAlert, setNewAlert] = useState(emptyForm);

  const active = useActiveAlerts();
  const unacknowledged = useUnacknowledgedAlerts();
  const all = useAlerts({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    type: typeFilter || undefined,
    scope: scopeFilter || undefined,
    acknowledged: ackFilter === "" ? undefined : ackFilter === "true",
  });
  const createAlert = useCreateAlert();
  const acknowledge = useAcknowledgeAlert();

  // The server's floor for issuing, editing and deleting alerts is SHO.
  const canIssue = user && hasMinimumRole(user.role, "SHO");

  const activeAlerts = active.data ?? [];
  const pending = unacknowledged.data ?? [];
  const bolos = activeAlerts.filter((a) => a.type === "BOLO");

  const handleAcknowledge = async (alert: Alert) => {
    try {
      await acknowledge.mutateAsync(alert.id);
      toast.success("Alert Acknowledged", alert.title);
    } catch (error) {
      toast.error("Not acknowledged", error instanceof Error ? error.message : "The server rejected the request");
    }
  };

  const handleIssueAlert = async () => {
    if (!newAlert.type || !newAlert.title.trim() || !newAlert.description.trim() || !newAlert.expiresAt) {
      toast.error("Validation Error", "Type, title, description and expiry are required");
      return;
    }
    const expiresAt = new Date(newAlert.expiresAt);
    if (expiresAt <= new Date()) {
      toast.error("Validation Error", "The expiry must be in the future");
      return;
    }
    try {
      const created = await createAlert.mutateAsync({
        type: newAlert.type,
        scope: newAlert.scope,
        title: newAlert.title.trim(),
        description: newAlert.description.trim(),
        expiresAt: expiresAt.toISOString(),
        priority: newAlert.priority,
        stationId: user?.stationId ?? null,
      });
      toast.success("Alert Issued", created.title);
      setShowIssueForm(false);
      setNewAlert(emptyForm());
    } catch (error) {
      toast.error("Alert not issued", error instanceof Error ? error.message : "The server rejected the request");
    }
  };

  const stats: Array<{ label: string; value: number | undefined; icon: typeof Bell; valueClass: string; iconClass: string; failed: boolean }> = [
    { label: "Active Alerts", value: active.data?.length, icon: Bell, valueClass: "text-foreground", iconClass: "text-accent", failed: active.isError },
    { label: "Awaiting Acknowledgement", value: unacknowledged.data?.length, icon: AlertTriangle, valueClass: "text-error", iconClass: "text-error", failed: unacknowledged.isError },
    { label: "Active Flash Alerts", value: active.data?.filter((a) => a.type === "FLASH").length, icon: Radio, valueClass: "text-warning", iconClass: "text-warning", failed: active.isError },
    { label: "Active BOLOs", value: active.data ? bolos.length : undefined, icon: Shield, valueClass: "text-info", iconClass: "text-info", failed: active.isError },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alerts & Communications</h1>
            <p className="text-foreground-muted">View and manage alerts, BOLO notices and broadcasts</p>
          </div>
          {canIssue && (
            <Button onClick={() => setShowIssueForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Issue Alert
            </Button>
          )}
        </div>

        {/* Counts come from the server's active and unacknowledged lists */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, valueClass, iconClass, failed }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground-muted">{label}</p>
                    <p className={`text-2xl font-bold ${valueClass}`}>
                      {failed ? "—" : value ?? <Loader2 className="h-5 w-5 animate-spin" />}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 opacity-50 ${iconClass}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {pending.length > 0 && (
          <Card className="border-error/50 bg-error/5">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-error/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-error" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{pending.length} alert(s) awaiting acknowledgement</p>
                  <p className="text-sm text-foreground-muted">{pending[0].title}</p>
                </div>
                <Button size="sm" onClick={() => handleAcknowledge(pending[0])} disabled={acknowledge.isPending}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Acknowledge
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showIssueForm && canIssue && (
          <Card className="border-accent/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Issue New Alert</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowIssueForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Alert Type *"
                  options={[
                    { value: "", label: "Select type" },
                    { value: "FLASH", label: "Flash — immediate action" },
                    { value: "URGENT", label: "Urgent — high priority" },
                    { value: "BOLO", label: "BOLO — be on the lookout" },
                    { value: "NOTICE", label: "Notice — information" },
                  ]}
                  value={newAlert.type}
                  onChange={(value: string) => setNewAlert({ ...newAlert, type: value as AlertType })}
                />
                <Select
                  label="Scope *"
                  options={(Object.keys(scopeLabels) as AlertScope[]).map((s) => ({ value: s, label: scopeLabels[s] }))}
                  value={newAlert.scope}
                  onChange={(value: string) => setNewAlert({ ...newAlert, scope: value as AlertScope })}
                />
                <Select
                  label="Priority *"
                  options={([1, 2, 3] as AlertPriority[]).map((p) => ({ value: String(p), label: priorityLabels[p] }))}
                  value={String(newAlert.priority)}
                  onChange={(value: string) => setNewAlert({ ...newAlert, priority: Number(value) as AlertPriority })}
                />
              </div>
              <Input
                label="Title *"
                placeholder="Brief, clear alert title"
                value={newAlert.title}
                onChange={(value: string) => setNewAlert({ ...newAlert, title: value })}
              />
              <Textarea
                label="Description *"
                placeholder="What officers need to know and do"
                rows={4}
                value={newAlert.description}
                onChange={(v: string) => setNewAlert({ ...newAlert, description: v })
                }
              />
              <Input
                label="Expires At *"
                type="datetime-local"
                value={newAlert.expiresAt}
                onChange={(value: string) => setNewAlert({ ...newAlert, expiresAt: value })}
              />
              <p className="text-xs text-foreground-muted">
                For a wanted or missing person with sightings to track, issue a notice from the{" "}
                <Link href="/lookout" className="text-accent hover:underline">
                  lookout register
                </Link>{" "}
                instead.
              </p>
              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => setShowIssueForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleIssueAlert} disabled={createAlert.isPending}>
                  <Megaphone className="h-4 w-4 mr-2" />
                  {createAlert.isPending ? "Issuing…" : "Issue Alert"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active">
              <Bell className="h-4 w-4 mr-2" />
              Active
            </TabsTrigger>
            <TabsTrigger value="pending">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Awaiting acknowledgement
            </TabsTrigger>
            <TabsTrigger value="bolo">
              <Shield className="h-4 w-4 mr-2" />
              BOLO notices
            </TabsTrigger>
            <TabsTrigger value="all">
              <Search className="h-4 w-4 mr-2" />
              All alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <ListState
              isPending={active.isPending}
              error={active.error}
              onRetry={() => active.refetch()}
              empty={activeAlerts.length === 0}
              emptyText="No active alerts"
            />
            {activeAlerts.map((a) => (
              <AlertCard key={a.id} alert={a} onAcknowledge={handleAcknowledge} acknowledging={acknowledge.isPending} />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <ListState
              isPending={unacknowledged.isPending}
              error={unacknowledged.error}
              onRetry={() => unacknowledged.refetch()}
              empty={pending.length === 0}
              emptyText="Every active alert has been acknowledged"
            />
            {pending.map((a) => (
              <AlertCard key={a.id} alert={a} onAcknowledge={handleAcknowledge} acknowledging={acknowledge.isPending} />
            ))}
          </TabsContent>

          <TabsContent value="bolo" className="space-y-4">
            <ListState
              isPending={active.isPending}
              error={active.error}
              onRetry={() => active.refetch()}
              empty={bolos.length === 0}
              emptyText="No active BOLO notices"
            />
            {bolos.map((a) => (
              <AlertCard key={a.id} alert={a} onAcknowledge={handleAcknowledge} acknowledging={acknowledge.isPending} />
            ))}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search title or description…"
                      value={searchQuery}
                      onChange={(v: string) => {
                        setSearchQuery(v);
                        setPage(1);
                      }}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <Select
                    options={[{ value: "", label: "All types" }, ...(Object.keys(typeLabels) as AlertType[]).map((t) => ({ value: t, label: typeLabels[t] }))]}
                    value={typeFilter}
                    onChange={(value: string) => {
                      setTypeFilter(value as AlertType | "");
                      setPage(1);
                    }}
                    className="w-full md:w-40"
                  />
                  <Select
                    options={[{ value: "", label: "All scopes" }, ...(Object.keys(scopeLabels) as AlertScope[]).map((s) => ({ value: s, label: scopeLabels[s] }))]}
                    value={scopeFilter}
                    onChange={(value: string) => {
                      setScopeFilter(value as AlertScope | "");
                      setPage(1);
                    }}
                    className="w-full md:w-40"
                  />
                  <Select
                    options={[
                      { value: "", label: "Any acknowledgement" },
                      { value: "false", label: "Not acknowledged" },
                      { value: "true", label: "Acknowledged" },
                    ]}
                    value={ackFilter}
                    onChange={(value: string) => {
                      setAckFilter(value as "" | "true" | "false");
                      setPage(1);
                    }}
                    className="w-full md:w-48"
                  />
                </div>
              </CardContent>
            </Card>
            <ListState
              isPending={all.isPending}
              error={all.error}
              onRetry={() => all.refetch()}
              empty={(all.data?.data.length ?? 0) === 0}
              emptyText="No alerts match these filters"
            />
            {all.data?.data.map((a) => (
              <AlertCard key={a.id} alert={a} onAcknowledge={handleAcknowledge} acknowledging={acknowledge.isPending} />
            ))}
            {(all.data?.totalPages ?? 0) > 1 && (
              <div className="flex items-center justify-between text-sm text-foreground-muted">
                <span>
                  Page {page} of {all.data?.totalPages} · {all.data?.total} alerts
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= (all.data?.totalPages ?? 1)}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
