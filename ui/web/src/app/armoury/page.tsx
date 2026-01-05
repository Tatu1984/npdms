"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Search,
  Filter,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Crosshair,
  FileText,
  Download,
  RefreshCw,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useArmouryStore } from "@/stores/armouryStore";
import { usePersonnelStore } from "@/stores/personnelStore";
import { exportToCSV, exportConfigs } from "@/lib/utils/export";

// Weapon data now comes from useArmouryStore

// Mock ammunition data
const mockAmmunition = [
  { type: "9mm", inStock: 1800, issued: 450, minLevel: 500, status: "OK" },
  { type: ".303", inStock: 340, issued: 60, minLevel: 200, status: "OK" },
  { type: "7.62mm", inStock: 180, issued: 20, minLevel: 200, status: "LOW" },
  { type: "Tear Gas", inStock: 20, issued: 0, minLevel: 10, status: "OK" },
];

// Mock overdue returns
const mockOverdue = [
  {
    weaponId: "WPN-KOR-012",
    type: "9mm Pistol",
    assignedTo: "Const. Ravi",
    dueDate: "2024-01-17",
    daysOverdue: 1,
    reason: "Extended duty",
  },
  {
    weaponId: "WPN-KOR-018",
    type: ".303 Rifle",
    assignedTo: "HC Shankar",
    dueDate: "2024-01-16",
    daysOverdue: 2,
    reason: "Bandobast duty",
  },
];

const weaponTypeOptions = [
  { value: "", label: "All Types" },
  { value: "9mm Pistol", label: "9mm Pistol" },
  { value: ".303 Rifle", label: ".303 Rifle" },
  { value: "7.62mm Rifle", label: "7.62mm Rifle" },
  { value: "Tear Gas Gun", label: "Tear Gas Gun" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "IN_ARMOURY", label: "In Armoury" },
  { value: "ISSUED", label: "Issued" },
  { value: "MAINTENANCE", label: "Under Maintenance" },
  { value: "CONDEMNED", label: "Condemned" },
];

function getStatusBadgeVariant(status: string) {
  const variants: Record<string, string> = {
    IN_ARMOURY: "success",
    ISSUED: "info",
    MAINTENANCE: "warning",
    CONDEMNED: "error",
  };
  return variants[status] || "secondary";
}

export default function ArmouryPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { weapons, issuanceRecords, issueWeapon, returnWeapon, getAvailableWeapons } = useArmouryStore();
  const { personnel } = usePersonnelStore();
  const [activeTab, setActiveTab] = useState("weapons");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Issuance form state
  const [issuanceForm, setIssuanceForm] = useState({
    officerId: "",
    weaponId: "",
    ammunition: "",
    purpose: "",
  });

  const canIssue = user && hasMinimumRole(user.role, "SHO");
  const canAudit = user && hasMinimumRole(user.role, "SP");

  const filteredWeapons = weapons.filter((w) => {
    if (typeFilter && w.type !== typeFilter) return false;
    if (statusFilter && w.status !== statusFilter) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        w.weaponId.toLowerCase().includes(search) ||
        w.serialNumber.toLowerCase().includes(search) ||
        w.assignedTo?.toLowerCase().includes(search) ||
        false
      );
    }
    return true;
  });

  const availableWeapons = getAvailableWeapons();

  const stats = {
    totalWeapons: weapons.length,
    issued: weapons.filter((w) => w.status === "ISSUED").length,
    available: weapons.filter((w) => w.status === "IN_ARMOURY").length,
    maintenance: weapons.filter((w) => w.status === "MAINTENANCE").length,
  };

  const handleReturnWeapon = async (weapon: typeof weapons[0]) => {
    if (weapon.assignedTo && weapon.assignedBadge) {
      await returnWeapon(weapon.id, weapon.assignedTo, weapon.assignedBadge);
      addToast({
        type: "success",
        title: "Weapon Returned",
        message: `${weapon.weaponId} has been returned to armoury`,
      });
    }
  };

  const handleIssueWeapon = async () => {
    if (!issuanceForm.officerId || !issuanceForm.weaponId || !issuanceForm.purpose) {
      addToast({ type: "error", title: "Validation Error", message: "Please fill in all required fields" });
      return;
    }

    const selectedPerson = personnel.find(p => p.id === issuanceForm.officerId);
    if (!selectedPerson) return;

    await issueWeapon(
      issuanceForm.weaponId,
      selectedPerson.name,
      selectedPerson.badgeNumber,
      issuanceForm.purpose,
      issuanceForm.ammunition || "15 rounds"
    );

    addToast({
      type: "success",
      title: "Weapon Issued",
      message: `Weapon has been issued to ${selectedPerson.name} (biometric verified)`,
    });

    setIssuanceForm({ officerId: "", weaponId: "", ammunition: "", purpose: "" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Armoury Management</h1>
            <p className="text-foreground-muted">
              Manage weapons inventory, issuance, and ammunition stock
            </p>
          </div>
          <div className="flex gap-2">
            {canIssue && (
              <Button onClick={() => {
                setActiveTab("issuance");
                addToast({ type: "info", title: "Issue Weapon", message: "Fill the issuance form below" });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Issue Weapon
              </Button>
            )}
            {canAudit && (
              <Button
                variant="secondary"
                onClick={() => {
                  addToast({
                    type: "info",
                    title: "Audit Report",
                    message: "Audit report generation coming soon",
                  });
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Audit Report
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Total Weapons</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalWeapons}</p>
                </div>
                <Crosshair className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Issued</p>
                  <p className="text-2xl font-bold text-info">{stats.issued}</p>
                </div>
                <Shield className="h-8 w-8 text-info opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Available</p>
                  <p className="text-2xl font-bold text-success">{stats.available}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Maintenance</p>
                  <p className="text-2xl font-bold text-warning">{stats.maintenance}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overdue Warning */}
        {mockOverdue.length > 0 && (
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Pending Returns</p>
                  <p className="text-sm text-foreground-muted">
                    {mockOverdue.length} weapons are overdue for return
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => addToast({ type: "warning", title: "Overdue Returns", message: `${mockOverdue.length} weapons are overdue: ${mockOverdue.map(o => o.weaponId).join(", ")}` })}>
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="weapons">
              <Crosshair className="h-4 w-4 mr-2" />
              Weapons Registry
            </TabsTrigger>
            <TabsTrigger value="ammunition">
              <Package className="h-4 w-4 mr-2" />
              Ammunition Stock
            </TabsTrigger>
            <TabsTrigger value="issuance">
              <FileText className="h-4 w-4 mr-2" />
              Issuance Log
            </TabsTrigger>
          </TabsList>

          {/* Weapons Registry Tab */}
          <TabsContent value="weapons" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by weapon ID, serial number, or assigned officer..."
                      value={searchQuery}
                      onChange={setSearchQuery}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <Select
                    options={weaponTypeOptions}
                    value={typeFilter}
                    onChange={setTypeFilter}
                    className="w-full md:w-40"
                  />
                  <Select
                    options={statusOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    className="w-full md:w-40"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Weapons Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crosshair className="h-5 w-5" />
                  Weapons Registry ({filteredWeapons.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Weapon ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Make/Model</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWeapons.map((weapon) => (
                      <TableRow key={weapon.id} className="hover:bg-background-tertiary">
                        <TableCell>
                          <span className="font-mono text-accent">{weapon.weaponId}</span>
                        </TableCell>
                        <TableCell>{weapon.type}</TableCell>
                        <TableCell>{weapon.make}</TableCell>
                        <TableCell>
                          <span className="font-mono text-sm">{weapon.serialNumber}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(weapon.status) as any}>
                            {weapon.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {weapon.assignedTo ? (
                            <div>
                              <p className="text-foreground">{weapon.assignedTo}</p>
                              <p className="text-xs text-foreground-muted">{weapon.assignedBadge}</p>
                            </div>
                          ) : (
                            <span className="text-foreground-muted">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              weapon.condition === "SERVICEABLE" ? "success" : "warning"
                            }
                          >
                            {weapon.condition.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/armoury/${weapon.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {canIssue && weapon.status === "ISSUED" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReturnWeapon(weapon)}
                                title="Return Weapon"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ammunition Stock Tab */}
          <TabsContent value="ammunition" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Ammunition Stock</CardTitle>
                {canIssue && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      addToast({
                        type: "info",
                        title: "Add Stock",
                        message: "Add ammunition stock feature coming soon",
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stock
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>In Stock</TableHead>
                      <TableHead>Issued (MTD)</TableHead>
                      <TableHead>Min Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockAmmunition.map((ammo, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <span className="font-medium text-foreground">{ammo.type}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground">{ammo.inStock.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground">{ammo.issued}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground-muted">{ammo.minLevel}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ammo.status === "OK" ? "success" : "warning"}>
                            {ammo.status === "LOW" ? (
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                LOW
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                OK
                              </span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {canIssue && (
                            <Button variant="ghost" size="sm" onClick={() => addToast({ type: "info", title: "Issue Ammunition", message: `Ammunition issuance form for ${ammo.type} coming soon` })}>
                              Issue
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Stock Level Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Levels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockAmmunition.map((ammo, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-foreground">{ammo.type}</span>
                      <span className="text-sm text-foreground-muted">
                        {ammo.inStock} / {ammo.minLevel * 5} capacity
                      </span>
                    </div>
                    <div className="h-3 bg-background-tertiary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          ammo.status === "LOW" ? "bg-warning" : "bg-success"
                        }`}
                        style={{ width: `${(ammo.inStock / (ammo.minLevel * 5)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Issuance Log Tab */}
          <TabsContent value="issuance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Today&apos;s Issuance Log</h3>
              <Button variant="secondary" onClick={() => {
                exportToCSV(weapons.filter(w => w.status === "ISSUED"), "issuance-log", exportConfigs.armoury);
                addToast({ type: "success", title: "Export Complete", message: "Issuance log exported to CSV" });
              }}>
                <Download className="h-4 w-4 mr-2" />
                Export Log
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Weapon</TableHead>
                      <TableHead>Officer</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Verified By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issuanceRecords.slice(0, 10).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {new Date(record.timestamp).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-accent">{record.weaponId}</span>
                        </TableCell>
                        <TableCell>{record.officer}</TableCell>
                        <TableCell>
                          <Badge variant={record.action === "ISSUED" ? "info" : "success"}>
                            {record.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.purpose}</TableCell>
                        <TableCell>{record.verifiedBy}</TableCell>
                      </TableRow>
                    ))}
                    {issuanceRecords.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-foreground-muted py-8">
                          No issuance records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Issue Weapon Form (for SHO+) */}
            {canIssue && (
              <Card>
                <CardHeader>
                  <CardTitle>Issue Weapon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Officer"
                      options={[
                        { value: "", label: "Select Officer" },
                        ...personnel
                          .filter(p => p.status === "ON_DUTY")
                          .map(p => ({ value: p.id, label: `${p.name} (${p.badgeNumber})` }))
                      ]}
                      value={issuanceForm.officerId}
                      onChange={(value: string) => setIssuanceForm({ ...issuanceForm, officerId: value })}
                    />
                    <Select
                      label="Weapon"
                      options={[
                        { value: "", label: "Select Available Weapon" },
                        ...availableWeapons.map(w => ({ value: w.id, label: `${w.weaponId} - ${w.type}` }))
                      ]}
                      value={issuanceForm.weaponId}
                      onChange={(value: string) => setIssuanceForm({ ...issuanceForm, weaponId: value })}
                    />
                    <Input
                      label="Ammunition (rounds)"
                      type="number"
                      placeholder="15"
                      value={issuanceForm.ammunition}
                      onChange={(value: string) => setIssuanceForm({ ...issuanceForm, ammunition: value })}
                    />
                    <Select
                      label="Purpose"
                      options={[
                        { value: "", label: "Select Purpose" },
                        { value: "Regular Duty", label: "Regular Duty" },
                        { value: "Patrol", label: "Patrol" },
                        { value: "Investigation", label: "Investigation" },
                        { value: "VIP Security", label: "VIP Security" },
                        { value: "Bandobast", label: "Bandobast" },
                      ]}
                      value={issuanceForm.purpose}
                      onChange={(value: string) => setIssuanceForm({ ...issuanceForm, purpose: value })}
                    />
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-md bg-background-tertiary">
                    <Shield className="h-5 w-5 text-accent" />
                    <span className="text-sm text-foreground-muted">
                      Biometric verification required for issuance
                    </span>
                  </div>
                  <Button className="w-full" onClick={handleIssueWeapon}>
                    Issue Weapon (Biometric Required)
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
