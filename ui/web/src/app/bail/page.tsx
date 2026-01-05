"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Scale,
  Search,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Gavel,
  IndianRupee,
  Eye,
  Printer,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import { useBailStore, BailApplication } from "@/stores/bailStore";

const statusConfig = {
  PENDING: { label: "Pending", color: "warning", icon: Clock },
  APPROVED: { label: "Approved", color: "success", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "error", icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "error", icon: XCircle },
  RELEASED: { label: "Released", color: "info", icon: UserCheck },
};

const bailTypes = {
  REGULAR: { label: "Regular Bail", color: "info" },
  ANTICIPATORY: { label: "Anticipatory Bail", color: "warning" },
  INTERIM: { label: "Interim Bail", color: "accent" },
};

const bailTypeOptions = [
  { value: "REGULAR", label: "Regular Bail" },
  { value: "ANTICIPATORY", label: "Anticipatory Bail" },
  { value: "INTERIM", label: "Interim Bail" },
];

export default function BailPage() {
  const { user } = useAuthStore();
  const { applications, createApplication, addSurety, verifySurety, updateStatus, getStats } = useBailStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedBail, setSelectedBail] = useState<BailApplication | null>(null);
  const [showNewBailModal, setShowNewBailModal] = useState(false);
  const [showAddSuretyModal, setShowAddSuretyModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newBail, setNewBail] = useState({
    accused: "",
    caseNumber: "",
    firNumber: "",
    charges: "",
    bailType: "REGULAR" as BailApplication["bailType"],
    applicationDate: new Date().toISOString().split("T")[0],
    hearingDate: "",
    court: "",
    proposedBailAmount: "",
    lawyer: "",
  });
  const [newSurety, setNewSurety] = useState({
    name: "",
    relation: "",
  });

  const canProcess = user && hasMinimumRole(user.role, "SI");

  const filteredApplications = applications.filter((bail) => {
    const matchesSearch =
      bail.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bail.accused.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bail.caseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || bail.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = getStats();

  const handleCreateBail = async () => {
    if (!newBail.accused || !newBail.caseNumber || !newBail.firNumber || !newBail.court) {
      toast.error("Validation Error", "Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const bail = await createApplication({
        accused: newBail.accused,
        caseNumber: newBail.caseNumber,
        firNumber: newBail.firNumber,
        charges: newBail.charges.split(",").map(c => c.trim()).filter(Boolean),
        status: "PENDING",
        bailType: newBail.bailType,
        applicationDate: newBail.applicationDate,
        hearingDate: newBail.hearingDate || undefined,
        court: newBail.court,
        proposedBailAmount: newBail.proposedBailAmount ? parseInt(newBail.proposedBailAmount) : undefined,
        lawyer: newBail.lawyer || undefined,
      });

      toast.success("Application Recorded", `Bail application ${bail.applicationNumber} has been recorded`);
      setShowNewBailModal(false);
      setNewBail({
        accused: "",
        caseNumber: "",
        firNumber: "",
        charges: "",
        bailType: "REGULAR",
        applicationDate: new Date().toISOString().split("T")[0],
        hearingDate: "",
        court: "",
        proposedBailAmount: "",
        lawyer: "",
      });
    } catch (error) {
      toast.error("Error", "Failed to record bail application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSurety = async () => {
    if (!selectedBail || !newSurety.name || !newSurety.relation) {
      toast.error("Validation Error", "Please fill in surety details");
      return;
    }

    await addSurety(selectedBail.id, { name: newSurety.name, relation: newSurety.relation, verified: false });
    toast.success("Surety Added", `Surety ${newSurety.name} added successfully`);
    setShowAddSuretyModal(false);
    setNewSurety({ name: "", relation: "" });

    // Refresh selected bail
    const updated = applications.find(a => a.id === selectedBail.id);
    if (updated) setSelectedBail(updated);
  };

  const handleVerifySurety = async (suretyIndex: number) => {
    if (!selectedBail) return;

    await verifySurety(selectedBail.id, suretyIndex);
    toast.success("Surety Verified", "Surety has been verified successfully");

    // Refresh selected bail
    const updated = applications.find(a => a.id === selectedBail.id);
    if (updated) setSelectedBail(updated);
  };

  const handleUpdateStatus = async (status: BailApplication["status"]) => {
    if (!selectedBail) return;

    await updateStatus(selectedBail.id, status);
    toast.success("Status Updated", `Bail application status updated to ${status}`);

    // Refresh selected bail
    const updated = applications.find(a => a.id === selectedBail.id);
    if (updated) setSelectedBail(updated);
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
            <h1 className="text-2xl font-bold text-foreground">Bail Processing</h1>
            <p className="text-foreground-muted">
              Manage bail applications, approvals, and surety verification
            </p>
          </div>
          {canProcess && (
            <Button onClick={() => setShowNewBailModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record New Application
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
                  <Scale className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-foreground-muted">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:border-warning/50 ${filterStatus === "PENDING" ? "border-warning ring-1 ring-warning" : ""}`}
            onClick={() => handleCardClick("PENDING")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                  <p className="text-xs text-foreground-muted">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:border-success/50 ${filterStatus === "APPROVED" ? "border-success ring-1 ring-success" : ""}`}
            onClick={() => handleCardClick("APPROVED")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
                  <p className="text-xs text-foreground-muted">Approved/Released</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all hover:border-error/50 ${filterStatus === "REJECTED" ? "border-error ring-1 ring-error" : ""}`}
            onClick={() => handleCardClick("REJECTED")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-error/10">
                  <XCircle className="h-5 w-5 text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
                  <p className="text-xs text-foreground-muted">Rejected/Cancelled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by bail ID, accused name, or case..."
                      value={searchQuery}
                      onChange={setSearchQuery}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="RELEASED">Released</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* List */}
            <div className="space-y-3">
              {filteredApplications.map((bail) => {
                const status = statusConfig[bail.status as keyof typeof statusConfig];
                const type = bailTypes[bail.bailType as keyof typeof bailTypes];
                const StatusIcon = status.icon;

                return (
                  <Card
                    key={bail.id}
                    className={`cursor-pointer transition-colors ${
                      selectedBail?.id === bail.id
                        ? "border-accent"
                        : "hover:border-accent/50"
                    }`}
                    onClick={() => setSelectedBail(bail)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-foreground">{bail.applicationNumber}</span>
                            <Badge variant={type.color as any}>{type.label}</Badge>
                            <Badge variant={status.color as any}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-foreground-muted" />
                            <span className="text-foreground">{bail.accused}</span>
                          </div>
                          <div className="text-sm text-foreground-muted">
                            {bail.caseNumber} | {bail.firNumber}
                          </div>
                          <div className="flex items-center gap-2">
                            {bail.charges.map((charge) => (
                              <span
                                key={charge}
                                className="px-2 py-0.5 text-xs rounded bg-background-tertiary text-foreground-muted"
                              >
                                {charge}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right text-sm text-foreground-muted">
                          <div>Applied: {bail.applicationDate}</div>
                          {bail.hearingDate && <div>Hearing: {bail.hearingDate}</div>}
                          {bail.bailAmount && (
                            <div className="flex items-center gap-1 justify-end mt-2 text-foreground">
                              <IndianRupee className="h-3 w-3" />
                              {bail.bailAmount.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Detail Panel */}
          <div>
            {selectedBail ? (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Bail Details</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { toast.info("Print", "Opening print dialog..."); window.print(); }}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href={`/bail/${selectedBail.id}`} className="block">
                    <Button className="w-full" variant="secondary">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Details
                    </Button>
                  </Link>

                  <div>
                    <p className="text-sm text-foreground-muted">Bail ID</p>
                    <p className="font-medium text-foreground">{selectedBail.applicationNumber}</p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground-muted">Accused</p>
                    <p className="font-medium text-foreground">{selectedBail.accused}</p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground-muted">Court</p>
                    <p className="text-foreground">{selectedBail.court}</p>
                  </div>

                  {selectedBail.judge && (
                    <div>
                      <p className="text-sm text-foreground-muted">Judge</p>
                      <p className="text-foreground">{selectedBail.judge}</p>
                    </div>
                  )}

                  {selectedBail.bailAmount && (
                    <div>
                      <p className="text-sm text-foreground-muted">Bail Amount</p>
                      <p className="text-lg font-bold text-foreground flex items-center gap-1">
                        <IndianRupee className="h-4 w-4" />
                        {selectedBail.bailAmount.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedBail.suretyAmount && (
                    <div>
                      <p className="text-sm text-foreground-muted">Surety Amount</p>
                      <p className="text-foreground flex items-center gap-1">
                        <IndianRupee className="h-4 w-4" />
                        {selectedBail.suretyAmount.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {selectedBail.conditions && selectedBail.conditions.length > 0 && (
                    <div>
                      <p className="text-sm text-foreground-muted mb-2">Bail Conditions</p>
                      <ul className="space-y-1">
                        {selectedBail.conditions.map((condition, i) => (
                          <li
                            key={i}
                            className="text-sm text-foreground flex items-start gap-2"
                          >
                            <span className="text-accent">•</span>
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedBail.sureties && selectedBail.sureties.length > 0 && (
                    <div>
                      <p className="text-sm text-foreground-muted mb-2">Sureties</p>
                      {selectedBail.sureties.map((surety, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-background-tertiary mb-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{surety.name}</p>
                              <p className="text-sm text-foreground-muted">{surety.relation}</p>
                            </div>
                            {surety.verified ? (
                              <Badge variant="success">Verified</Badge>
                            ) : canProcess && (
                              <Button size="sm" variant="secondary" onClick={() => handleVerifySurety(i)}>
                                Verify
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedBail.rejectionReason && (
                    <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                      <p className="text-sm text-error font-medium">Rejection Reason</p>
                      <p className="text-sm text-foreground-muted mt-1">
                        {selectedBail.rejectionReason}
                      </p>
                    </div>
                  )}

                  {selectedBail.cancellationReason && (
                    <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                      <p className="text-sm text-error font-medium">Cancellation Reason</p>
                      <p className="text-sm text-foreground-muted mt-1">
                        {selectedBail.cancellationReason}
                      </p>
                    </div>
                  )}

                  {selectedBail.status === "PENDING" && canProcess && (
                    <div className="space-y-2 pt-4 border-t border-border">
                      <Button className="w-full" variant="secondary" onClick={() => setShowAddSuretyModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Surety
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="secondary" onClick={() => handleUpdateStatus("APPROVED")}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button variant="secondary" onClick={() => handleUpdateStatus("REJECTED")}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedBail.status === "APPROVED" && canProcess && (
                    <div className="pt-4 border-t border-border">
                      <Button className="w-full" onClick={() => handleUpdateStatus("RELEASED")}>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Mark as Released
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Scale className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
                  <p className="text-foreground-muted">
                    Select a bail application to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* New Bail Application Modal */}
      <Modal
        isOpen={showNewBailModal}
        onClose={() => setShowNewBailModal(false)}
        title="Record New Bail Application"
        description="Record a bail application submitted to court"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Accused Name *"
              placeholder="Enter accused name"
              value={newBail.accused}
              onChange={(v) => setNewBail({ ...newBail, accused: v })}
            />
            <Select
              label="Bail Type *"
              value={newBail.bailType}
              onChange={(v) => setNewBail({ ...newBail, bailType: v as BailApplication["bailType"] })}
              options={bailTypeOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Case Number *"
              placeholder="CASE-2024-XXXXX"
              value={newBail.caseNumber}
              onChange={(v) => setNewBail({ ...newBail, caseNumber: v })}
            />
            <Input
              label="FIR Number *"
              placeholder="KOR/2024/XXXXX"
              value={newBail.firNumber}
              onChange={(v) => setNewBail({ ...newBail, firNumber: v })}
            />
          </div>

          <Input
            label="Charges (comma separated) *"
            placeholder="IPC 420, IPC 406"
            value={newBail.charges}
            onChange={(v) => setNewBail({ ...newBail, charges: v })}
          />

          <Input
            label="Court *"
            placeholder="Sessions Court, Koramangala"
            value={newBail.court}
            onChange={(v) => setNewBail({ ...newBail, court: v })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Application Date *"
              type="date"
              value={newBail.applicationDate}
              onChange={(v) => setNewBail({ ...newBail, applicationDate: v })}
            />
            <Input
              label="Hearing Date"
              type="date"
              value={newBail.hearingDate}
              onChange={(v) => setNewBail({ ...newBail, hearingDate: v })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Proposed Bail Amount"
              type="number"
              placeholder="50000"
              value={newBail.proposedBailAmount}
              onChange={(v) => setNewBail({ ...newBail, proposedBailAmount: v })}
            />
            <Input
              label="Lawyer"
              placeholder="Adv. Name"
              value={newBail.lawyer}
              onChange={(v) => setNewBail({ ...newBail, lawyer: v })}
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowNewBailModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateBail} disabled={isSubmitting}>
            {isSubmitting ? "Recording..." : "Record Application"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Add Surety Modal */}
      <Modal
        isOpen={showAddSuretyModal}
        onClose={() => setShowAddSuretyModal(false)}
        title="Add Surety"
        description="Add a surety for the bail application"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Surety Name *"
            placeholder="Enter surety name"
            value={newSurety.name}
            onChange={(v) => setNewSurety({ ...newSurety, name: v })}
          />
          <Input
            label="Relation with Accused *"
            placeholder="Brother, Father, Friend, etc."
            value={newSurety.relation}
            onChange={(v) => setNewSurety({ ...newSurety, relation: v })}
          />
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowAddSuretyModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddSurety}>
            Add Surety
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
