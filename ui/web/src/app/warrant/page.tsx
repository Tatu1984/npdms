"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileWarning,
  Search,
  Plus,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  MapPin,
  Gavel,
  Eye,
  Printer,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import { useWarrantStore, Warrant } from "@/stores/warrantStore";

const warrantTypes = {
  ARREST: { label: "Arrest Warrant", color: "error" },
  SEARCH: { label: "Search Warrant", color: "warning" },
  SUMMONS: { label: "Summons", color: "info" },
  NBW: { label: "Non-Bailable Warrant", color: "error" },
};

const statusConfig = {
  ACTIVE: { label: "Active", color: "warning", icon: Clock },
  EXECUTED: { label: "Executed", color: "success", icon: CheckCircle },
  EXPIRED: { label: "Expired", color: "muted", icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "error", icon: XCircle },
};

const warrantTypeOptions = [
  { value: "ARREST", label: "Arrest Warrant" },
  { value: "SEARCH", label: "Search Warrant" },
  { value: "SUMMONS", label: "Summons" },
  { value: "NBW", label: "Non-Bailable Warrant" },
];

const priorityOptions = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

export default function WarrantPage() {
  const { user } = useAuthStore();
  const { warrants, createWarrant, getStats } = useWarrantStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showNewWarrantModal, setShowNewWarrantModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newWarrant, setNewWarrant] = useState({
    type: "ARREST" as Warrant["type"],
    issuedFor: "",
    caseNumber: "",
    firNumber: "",
    issuedBy: "",
    issuedDate: new Date().toISOString().split("T")[0],
    validUntil: "",
    charges: "",
    lastKnownLocation: "",
    priority: "MEDIUM" as Warrant["priority"],
    description: "",
  });

  const canCreate = user && hasMinimumRole(user.role, "SI");

  const filteredWarrants = warrants.filter((warrant) => {
    const matchesSearch =
      warrant.warrantNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warrant.issuedFor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warrant.caseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "ALL" || warrant.type === filterType;
    const matchesStatus = filterStatus === "ALL" || warrant.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = getStats();

  const handleCreateWarrant = async () => {
    if (!newWarrant.issuedFor || !newWarrant.caseNumber || !newWarrant.firNumber || !newWarrant.issuedBy || !newWarrant.validUntil) {
      toast.error("Validation Error", "Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const warrant = await createWarrant({
        type: newWarrant.type,
        status: "ACTIVE",
        issuedFor: newWarrant.issuedFor,
        caseNumber: newWarrant.caseNumber,
        firNumber: newWarrant.firNumber,
        issuedBy: newWarrant.issuedBy,
        issuedDate: newWarrant.issuedDate,
        validUntil: newWarrant.validUntil,
        charges: newWarrant.charges.split(",").map(c => c.trim()).filter(Boolean),
        lastKnownLocation: newWarrant.lastKnownLocation || undefined,
        priority: newWarrant.priority,
        description: newWarrant.description || undefined,
      });

      toast.success("Warrant Created", `Warrant ${warrant.warrantNumber} has been created successfully`);
      setShowNewWarrantModal(false);
      setNewWarrant({
        type: "ARREST",
        issuedFor: "",
        caseNumber: "",
        firNumber: "",
        issuedBy: "",
        issuedDate: new Date().toISOString().split("T")[0],
        validUntil: "",
        charges: "",
        lastKnownLocation: "",
        priority: "MEDIUM",
        description: "",
      });
    } catch (error) {
      toast.error("Error", "Failed to create warrant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardClick = (status: string) => {
    if (filterStatus === status) {
      setFilterStatus("ALL");
    } else {
      setFilterStatus(status);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Warrant Management</h1>
            <p className="text-foreground-muted">
              Track and manage arrest warrants, search warrants, and summons
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => setShowNewWarrantModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Warrant Request
            </Button>
          )}
        </div>

        {/* Stats - Now Clickable */}
        <div className="grid grid-cols-4 gap-4">
          <Card
            className={`cursor-pointer transition-all hover:border-accent/50 ${filterStatus === "ALL" ? "border-accent ring-1 ring-accent" : ""}`}
            onClick={() => setFilterStatus("ALL")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <FileWarning className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-foreground-muted">Total Warrants</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:border-warning/50 ${filterStatus === "ACTIVE" ? "border-warning ring-1 ring-warning" : ""}`}
            onClick={() => handleCardClick("ACTIVE")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                  <p className="text-xs text-foreground-muted">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:border-success/50 ${filterStatus === "EXECUTED" ? "border-success ring-1 ring-success" : ""}`}
            onClick={() => handleCardClick("EXECUTED")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.executed}</p>
                  <p className="text-xs text-foreground-muted">Executed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:border-error/50 ${filterStatus === "EXPIRED" ? "border-error ring-1 ring-error" : ""}`}
            onClick={() => handleCardClick("EXPIRED")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-error/10">
                  <AlertTriangle className="h-5 w-5 text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.expired}</p>
                  <p className="text-xs text-foreground-muted">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by warrant ID, name, or case number..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="ALL">All Types</option>
                <option value="ARREST">Arrest Warrant</option>
                <option value="SEARCH">Search Warrant</option>
                <option value="SUMMONS">Summons</option>
                <option value="NBW">Non-Bailable</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="EXECUTED">Executed</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Warrant List */}
        <div className="space-y-4">
          {filteredWarrants.map((warrant) => {
            const typeConfig = warrantTypes[warrant.type as keyof typeof warrantTypes];
            const status = statusConfig[warrant.status as keyof typeof statusConfig];
            const StatusIcon = status.icon;

            return (
              <Card key={warrant.id} className="hover:border-accent/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-${typeConfig.color}/10`}>
                        <FileWarning className={`h-6 w-6 text-${typeConfig.color}`} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-foreground">{warrant.warrantNumber}</span>
                          <Badge variant={typeConfig.color as any}>{typeConfig.label}</Badge>
                          <Badge variant={status.color as any}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                          {warrant.priority === "HIGH" && (
                            <Badge variant="error">High Priority</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-foreground-muted" />
                          <span className="text-foreground">{warrant.issuedFor}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-foreground-muted">
                          <span>Case: {warrant.caseNumber}</span>
                          <span>FIR: {warrant.firNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground-muted">
                          <Gavel className="h-4 w-4" />
                          <span>{warrant.issuedBy}</span>
                        </div>
                        {warrant.charges && warrant.charges.length > 0 && (
                          <div className="flex items-center gap-2">
                            {warrant.charges.map((charge) => (
                              <span
                                key={charge}
                                className="px-2 py-0.5 text-xs rounded bg-background-tertiary text-foreground-muted"
                              >
                                {charge}
                              </span>
                            ))}
                          </div>
                        )}
                        {warrant.lastKnownLocation && (
                          <div className="flex items-center gap-2 text-sm text-foreground-muted">
                            <MapPin className="h-4 w-4" />
                            <span>Last Known: {warrant.lastKnownLocation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-sm text-foreground-muted">
                        <div className="flex items-center gap-2 justify-end">
                          <Calendar className="h-4 w-4" />
                          Issued: {warrant.issuedDate}
                        </div>
                        <div className="mt-1">
                          Valid Until: {warrant.validUntil}
                        </div>
                        {warrant.executedDate && (
                          <div className="mt-1 text-success">
                            Executed: {warrant.executedDate}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Link href={`/warrant/${warrant.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => { toast.info("Print", "Opening print dialog..."); window.print(); }}>
                          <Printer className="h-4 w-4 mr-1" />
                          Print
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredWarrants.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileWarning className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">No warrants found</h3>
              <p className="text-foreground-muted">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* New Warrant Modal */}
      <Modal
        isOpen={showNewWarrantModal}
        onClose={() => setShowNewWarrantModal(false)}
        title="New Warrant Request"
        description="Submit a request for a new warrant"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Warrant Type *"
              value={newWarrant.type}
              onChange={(v) => setNewWarrant({ ...newWarrant, type: v as Warrant["type"] })}
              options={warrantTypeOptions}
            />
            <Select
              label="Priority *"
              value={newWarrant.priority}
              onChange={(v) => setNewWarrant({ ...newWarrant, priority: v as Warrant["priority"] })}
              options={priorityOptions}
            />
          </div>

          <Input
            label="Issued For (Person/Premises) *"
            placeholder="Name of accused or address of premises"
            value={newWarrant.issuedFor}
            onChange={(v) => setNewWarrant({ ...newWarrant, issuedFor: v })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Case Number *"
              placeholder="CASE-2024-XXXXX"
              value={newWarrant.caseNumber}
              onChange={(v) => setNewWarrant({ ...newWarrant, caseNumber: v })}
            />
            <Input
              label="FIR Number *"
              placeholder="KOR/2024/XXXXX"
              value={newWarrant.firNumber}
              onChange={(v) => setNewWarrant({ ...newWarrant, firNumber: v })}
            />
          </div>

          <Input
            label="Issuing Authority *"
            placeholder="Sessions Court, Koramangala"
            value={newWarrant.issuedBy}
            onChange={(v) => setNewWarrant({ ...newWarrant, issuedBy: v })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Issue Date *"
              type="date"
              value={newWarrant.issuedDate}
              onChange={(v) => setNewWarrant({ ...newWarrant, issuedDate: v })}
            />
            <Input
              label="Valid Until *"
              type="date"
              value={newWarrant.validUntil}
              onChange={(v) => setNewWarrant({ ...newWarrant, validUntil: v })}
            />
          </div>

          <Input
            label="Charges (comma separated)"
            placeholder="IPC 392, IPC 397"
            value={newWarrant.charges}
            onChange={(v) => setNewWarrant({ ...newWarrant, charges: v })}
          />

          <Input
            label="Last Known Location"
            placeholder="Address or area"
            value={newWarrant.lastKnownLocation}
            onChange={(v) => setNewWarrant({ ...newWarrant, lastKnownLocation: v })}
            icon={<MapPin className="h-4 w-4" />}
          />

          <Textarea
            label="Description / Notes"
            placeholder="Additional details about the warrant..."
            value={newWarrant.description}
            onChange={(v) => setNewWarrant({ ...newWarrant, description: v })}
            rows={3}
          />
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowNewWarrantModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateWarrant} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Warrant Request"}
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
