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
import { exportToCSV, exportConfigs } from "@/lib/utils/export";

// Mock weapons data
const mockWeapons = [
  {
    id: "wpn-001",
    weaponId: "WPN-KOR-001",
    type: "9mm Pistol",
    make: "Glock 17",
    serialNumber: "GLK-2019-78542",
    status: "ISSUED",
    assignedTo: "SI Suresh",
    assignedBadge: "KAR-SI-1234",
    issuedDate: "2024-01-15",
    expectedReturn: "2024-01-15",
    condition: "SERVICEABLE",
  },
  {
    id: "wpn-002",
    weaponId: "WPN-KOR-002",
    type: "9mm Pistol",
    make: "Glock 17",
    serialNumber: "GLK-2019-78543",
    status: "ISSUED",
    assignedTo: "ASI Prakash",
    assignedBadge: "KAR-ASI-2345",
    issuedDate: "2024-01-16",
    expectedReturn: "2024-01-16",
    condition: "SERVICEABLE",
  },
  {
    id: "wpn-003",
    weaponId: "WPN-KOR-003",
    type: "9mm Pistol",
    make: "Glock 17",
    serialNumber: "GLK-2019-78544",
    status: "IN_ARMOURY",
    assignedTo: null,
    condition: "SERVICEABLE",
  },
  {
    id: "wpn-004",
    weaponId: "WPN-KOR-004",
    type: ".303 Rifle",
    make: "INSAS",
    serialNumber: "INS-2015-45612",
    status: "ISSUED",
    assignedTo: "Const. Kumar",
    assignedBadge: "KAR-C-4567",
    issuedDate: "2024-01-18",
    expectedReturn: "2024-01-18",
    condition: "SERVICEABLE",
  },
  {
    id: "wpn-005",
    weaponId: "WPN-KOR-005",
    type: "9mm Pistol",
    make: "Glock 17",
    serialNumber: "GLK-2019-78545",
    status: "MAINTENANCE",
    assignedTo: null,
    condition: "UNDER_REPAIR",
    maintenanceNote: "Trigger mechanism repair",
  },
];

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
  const [activeTab, setActiveTab] = useState("weapons");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const canIssue = user && hasMinimumRole(user.role, "SHO");
  const canAudit = user && hasMinimumRole(user.role, "SP");

  const filteredWeapons = mockWeapons.filter((w) => {
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

  const stats = {
    totalWeapons: mockWeapons.length,
    issued: mockWeapons.filter((w) => w.status === "ISSUED").length,
    available: mockWeapons.filter((w) => w.status === "IN_ARMOURY").length,
    maintenance: mockWeapons.filter((w) => w.status === "MAINTENANCE").length,
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
              <Button>
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
                <Button variant="secondary" size="sm">
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
                                onClick={() => {
                                  addToast({
                                    type: "info",
                                    title: "Return Weapon",
                                    message: "Weapon return feature coming soon",
                                  });
                                }}
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
                            <Button variant="ghost" size="sm">
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
              <Button variant="secondary">
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
                    <TableRow>
                      <TableCell>08:00</TableCell>
                      <TableCell>
                        <span className="font-mono text-accent">WPN-KOR-001</span>
                      </TableCell>
                      <TableCell>SI Suresh</TableCell>
                      <TableCell>
                        <Badge variant="info">ISSUED</Badge>
                      </TableCell>
                      <TableCell>Patrol Duty</TableCell>
                      <TableCell>HC Mohan (Biometric)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>08:15</TableCell>
                      <TableCell>
                        <span className="font-mono text-accent">WPN-KOR-002</span>
                      </TableCell>
                      <TableCell>ASI Prakash</TableCell>
                      <TableCell>
                        <Badge variant="info">ISSUED</Badge>
                      </TableCell>
                      <TableCell>Investigation</TableCell>
                      <TableCell>HC Mohan (Biometric)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>09:00</TableCell>
                      <TableCell>
                        <span className="font-mono text-accent">WPN-KOR-004</span>
                      </TableCell>
                      <TableCell>Const. Kumar</TableCell>
                      <TableCell>
                        <Badge variant="info">ISSUED</Badge>
                      </TableCell>
                      <TableCell>VIP Security</TableCell>
                      <TableCell>HC Mohan (Biometric)</TableCell>
                    </TableRow>
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
                        { value: "p-001", label: "Ramesh Kumar (KAR-C-4567)" },
                        { value: "p-004", label: "Suresh Patil (KAR-SI-1234)" },
                      ]}
                      value=""
                      onChange={() => {}}
                    />
                    <Select
                      label="Weapon"
                      options={[
                        { value: "", label: "Select Available Weapon" },
                        { value: "wpn-003", label: "WPN-KOR-003 - 9mm Pistol" },
                      ]}
                      value=""
                      onChange={() => {}}
                    />
                    <Input label="Ammunition (rounds)" type="number" placeholder="0" />
                    <Select
                      label="Purpose"
                      options={[
                        { value: "", label: "Select Purpose" },
                        { value: "DUTY", label: "Regular Duty" },
                        { value: "PATROL", label: "Patrol" },
                        { value: "INVESTIGATION", label: "Investigation" },
                        { value: "VIP", label: "VIP Security" },
                        { value: "BANDOBAST", label: "Bandobast" },
                      ]}
                      value=""
                      onChange={() => {}}
                    />
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-md bg-background-tertiary">
                    <Shield className="h-5 w-5 text-accent" />
                    <span className="text-sm text-foreground-muted">
                      Biometric verification required for issuance
                    </span>
                  </div>
                  <Button className="w-full">
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
