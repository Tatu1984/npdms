"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Edit,
  Loader2,
  Radio,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LegacySelect as Select } from "@/components/ui/select";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import { useAcknowledgeAlert, useAlert, useDeleteAlert, useUpdateAlert } from "@/hooks/use-alerts";
import type { AlertPriority, AlertScope, AlertType } from "@/lib/api/alerts";
import { ApiClientError } from "@/lib/api/client";

const typeLabels: Record<AlertType, string> = { FLASH: "Flash", URGENT: "Urgent", BOLO: "BOLO", NOTICE: "Notice" };
const scopeLabels: Record<AlertScope, string> = {
  STATION: "Station",
  DISTRICT: "District",
  STATE: "State",
  NATIONAL: "National",
};
const badgeVariant: Record<AlertType, string> = { FLASH: "error", URGENT: "warning", BOLO: "info", NOTICE: "secondary" };
const typeIcon: Record<AlertType, typeof Bell> = { FLASH: Radio, URGENT: AlertTriangle, BOLO: Shield, NOTICE: Bell };

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

/** datetime-local wants local wall-clock time without a zone. */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AlertDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: alert, isPending, isError, error, refetch } = useAlert(params.id);
  const acknowledge = useAcknowledgeAlert();
  const update = useUpdateAlert();
  const remove = useDeleteAlert();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    type: "NOTICE" as AlertType,
    scope: "STATION" as AlertScope,
    title: "",
    description: "",
    expiresAt: "",
    priority: 2 as AlertPriority,
  });

  // Matches the server's floor for editing and deleting alerts.
  const canManage = user && hasMinimumRole(user.role, "SHO");

  if (isPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96 gap-3 text-foreground-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading alert…
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiClientError && error.code === 404;
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-2">
          <AlertTriangle className="h-12 w-12 text-warning mb-2" />
          <h2 className="text-xl font-bold text-foreground">{notFound ? "Alert Not Found" : "Alert could not be loaded"}</h2>
          <p className="text-foreground-muted mb-2">{notFound ? "The requested alert does not exist." : error.message}</p>
          <div className="flex gap-2">
            {!notFound && (
              <Button variant="secondary" onClick={() => refetch()}>
                Try again
              </Button>
            )}
            <Link href="/alerts">
              <Button>Back to Alerts</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const Icon = typeIcon[alert.type];
  const expired = new Date(alert.expiresAt) <= new Date();

  const openEdit = () => {
    setForm({
      type: alert.type,
      scope: alert.scope,
      title: alert.title,
      description: alert.description,
      expiresAt: toLocalInput(alert.expiresAt),
      priority: alert.priority,
    });
    setEditing(true);
  };

  const handleAcknowledge = async () => {
    try {
      await acknowledge.mutateAsync(alert.id);
      toast.success("Alert Acknowledged", alert.title);
    } catch (err) {
      toast.error("Not acknowledged", err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.expiresAt) {
      toast.error("Validation Error", "Title, description and expiry are required");
      return;
    }
    try {
      await update.mutateAsync({
        alert,
        changes: {
          type: form.type,
          scope: form.scope,
          title: form.title.trim(),
          description: form.description.trim(),
          expiresAt: new Date(form.expiresAt).toISOString(),
          priority: form.priority,
        },
      });
      toast.success("Alert Updated", form.title.trim());
      setEditing(false);
    } catch (err) {
      toast.error("Alert not updated", err instanceof Error ? err.message : "The server rejected the request");
    }
  };

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(alert.id);
      toast.success("Alert Deleted", alert.title);
      router.push("/alerts");
    } catch (err) {
      toast.error("Alert not deleted", err instanceof Error ? err.message : "The server rejected the request");
      setConfirmDelete(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={badgeVariant[alert.type] as any}>
                  <Icon className="h-3 w-3 mr-1" />
                  {typeLabels[alert.type]}
                </Badge>
                <Badge variant="secondary">{scopeLabels[alert.scope]}</Badge>
                <Badge variant={alert.priority === 1 ? "error" : "secondary"}>Priority {alert.priority}</Badge>
                {expired && <Badge variant="secondary">Expired</Badge>}
              </div>
              <h1 className="text-2xl font-bold text-foreground mt-1">{alert.title}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            {!alert.acknowledged && !expired && (
              <Button onClick={handleAcknowledge} disabled={acknowledge.isPending}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Acknowledge
              </Button>
            )}
            {canManage && (
              <>
                <Button variant="secondary" onClick={openEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="ghost" className="text-error" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Alert</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{alert.description}</p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-foreground-muted">Issued</p>
                  <p className="text-foreground">{formatDateTime(alert.issuedAt)}</p>
                </div>
                <div>
                  <p className="text-foreground-muted">{expired ? "Expired" : "Expires"}</p>
                  <p className={expired ? "text-foreground-muted" : "text-foreground"}>{formatDateTime(alert.expiresAt)}</p>
                </div>
                <div>
                  <p className="text-foreground-muted">Issued by</p>
                  <p className="text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-foreground-muted" />
                    {alert.issuedBy || "Not recorded"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className={alert.acknowledged ? "border-success/30" : "border-warning/30"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Acknowledgement
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {alert.acknowledged ? (
                  <p className="text-foreground">
                    Acknowledged by {alert.acknowledgedBy || "an officer"}
                    {alert.acknowledgedAt && ` on ${formatDateTime(alert.acknowledgedAt)}`}
                  </p>
                ) : (
                  <p className="text-foreground-muted">
                    {expired ? "Expired without acknowledgement." : "Not yet acknowledged."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Modal isOpen={editing} onClose={() => setEditing(false)} title="Edit alert" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Type"
              options={(Object.keys(typeLabels) as AlertType[]).map((t) => ({ value: t, label: typeLabels[t] }))}
              value={form.type}
              onChange={(v: string) => setForm({ ...form, type: v as AlertType })}
            />
            <Select
              label="Scope"
              options={(Object.keys(scopeLabels) as AlertScope[]).map((s) => ({ value: s, label: scopeLabels[s] }))}
              value={form.scope}
              onChange={(v: string) => setForm({ ...form, scope: v as AlertScope })}
            />
            <Select
              label="Priority"
              options={[1, 2, 3].map((p) => ({ value: String(p), label: `Priority ${p}` }))}
              value={String(form.priority)}
              onChange={(v: string) => setForm({ ...form, priority: Number(v) as AlertPriority })}
            />
          </div>
          <Input label="Title" value={form.title} onChange={(v: string) => setForm({ ...form, title: v })} />
          <Textarea
            label="Description"
            rows={4}
            value={form.description}
            onChange={(v: string) => setForm({ ...form, description: v })}
          />
          <Input
            label="Expires At"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(v: string) => setForm({ ...form, expiresAt: v })}
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this alert?"
        description="The alert is removed for every officer. The deletion is recorded in the audit trail."
      >
        <ModalFooter>
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Keep
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={remove.isPending}>
            Delete Alert
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
