"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Shield,
  Crosshair,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  History,
  FileText,
  RefreshCw,
  Package,
  Edit,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";

// Mock weapons data
const mockWeapons: Record<string, {
  id: string;
  weaponId: string;
  type: string;
  make: string;
  model: string;
  serialNumber: string;
  caliber: string;
  status: string;
  assignedTo: string | null;
  assignedBadge: string | null;
  issuedDate: string | null;
  expectedReturn: string | null;
  condition: string;
  lastInspection: string;
  nextInspection: string;
  purchaseDate: string;
  purchaseValue: number;
  location: string;
  remarks: string | null;
}> = {
  "wpn-001": {
    id: "wpn-001",
    weaponId: "WPN-KOR-001",
    type: "9mm Pistol",
    make: "Glock",
    model: "17 Gen 5",
    serialNumber: "GLK-2019-78542",
    caliber: "9x19mm",
    status: "ISSUED",
    assignedTo: "SI Suresh Patil",
    assignedBadge: "KAR-SI-1234",
    issuedDate: "2024-01-15",
    expectedReturn: "2024-01-15",
    condition: "SERVICEABLE",
    lastInspection: "2024-01-10",
    nextInspection: "2024-04-10",
    purchaseDate: "2019-06-15",
    purchaseValue: 45000,
    location: "Field (Issued)",
    remarks: null,
  },
  "wpn-002": {
    id: "wpn-002",
    weaponId: "WPN-KOR-002",
    type: "9mm Pistol",
    make: "Glock",
    model: "17 Gen 5",
    serialNumber: "GLK-2019-78543",
    status: "ISSUED",
    caliber: "9x19mm",
    assignedTo: "ASI Prakash Rao",
    assignedBadge: "KAR-ASI-2345",
    issuedDate: "2024-01-16",
    expectedReturn: "2024-01-16",
    condition: "SERVICEABLE",
    lastInspection: "2024-01-10",
    nextInspection: "2024-04-10",
    purchaseDate: "2019-06-15",
    purchaseValue: 45000,
    location: "Field (Issued)",
    remarks: null,
  },
  "wpn-003": {
    id: "wpn-003",
    weaponId: "WPN-KOR-003",
    type: "9mm Pistol",
    make: "Glock",
    model: "17 Gen 5",
    serialNumber: "GLK-2019-78544",
    caliber: "9x19mm",
    status: "IN_ARMOURY",
    assignedTo: null,
    assignedBadge: null,
    issuedDate: null,
    expectedReturn: null,
    condition: "SERVICEABLE",
    lastInspection: "2024-01-10",
    nextInspection: "2024-04-10",
    purchaseDate: "2019-06-15",
    purchaseValue: 45000,
    location: "Armoury Vault A",
    remarks: null,
  },
  "wpn-005": {
    id: "wpn-005",
    weaponId: "WPN-KOR-005",
    type: "9mm Pistol",
    make: "Glock",
    model: "17 Gen 5",
    serialNumber: "GLK-2019-78545",
    caliber: "9x19mm",
    status: "MAINTENANCE",
    assignedTo: null,
    assignedBadge: null,
    issuedDate: null,
    expectedReturn: null,
    condition: "UNDER_REPAIR",
    lastInspection: "2024-01-05",
    nextInspection: "2024-04-05",
    purchaseDate: "2019-06-15",
    purchaseValue: 45000,
    location: "Workshop",
    remarks: "Trigger mechanism repair in progress",
  },
};

// Mock issuance history
const mockIssuanceHistory = [
  {
    id: "i-001",
    date: "2024-01-15",
    action: "ISSUED",
    officer: "SI Suresh Patil",
    badge: "KAR-SI-1234",
    purpose: "Patrol Duty",
    verifiedBy: "HC Mohan (Biometric)",
    ammunition: "15 rounds",
  },
  {
    id: "i-002",
    date: "2024-01-14",
    action: "RETURNED",
    officer: "ASI Prakash",
    badge: "KAR-ASI-2345",
    purpose: "-",
    verifiedBy: "HC Mohan (Biometric)",
    ammunition: "15 rounds returned",
  },
  {
    id: "i-003",
    date: "2024-01-14",
    action: "ISSUED",
    officer: "ASI Prakash",
    badge: "KAR-ASI-2345",
    purpose: "Investigation",
    verifiedBy: "HC Mohan (Biometric)",
    ammunition: "15 rounds",
  },
];

// Mock inspection history
const mockInspectionHistory = [
  {
    id: "insp-001",
    date: "2024-01-10",
    inspector: "SHO Sharma",
    result: "PASS",
    notes: "All parts in working condition. No visible wear or damage.",
    nextDue: "2024-04-10",
  },
  {
    id: "insp-002",
    date: "2023-10-10",
    inspector: "SHO Sharma",
    result: "PASS",
    notes: "Minor cleaning required. Otherwise serviceable.",
    nextDue: "2024-01-10",
  },
  {
    id: "insp-003",
    date: "2023-07-10",
    inspector: "Insp. Kumar",
    result: "PASS",
    notes: "Annual inspection complete. Weapon in good condition.",
    nextDue: "2023-10-10",
  },
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

function getConditionBadgeVariant(condition: string) {
  const variants: Record<string, string> = {
    SERVICEABLE: "success",
    UNDER_REPAIR: "warning",
    UNSERVICEABLE: "error",
  };
  return variants[condition] || "secondary";
}

export default function WeaponDetailPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");

  const weaponId = params.id as string;
  const weapon = mockWeapons[weaponId] || mockWeapons["wpn-001"];

  const canIssue = user && hasMinimumRole(user.role, "SHO");
  const canEdit = user && hasMinimumRole(user.role, "SP");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/armoury">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Armoury
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Crosshair className="h-6 w-6" />
                {weapon.weaponId}
              </h1>
              <p className="text-foreground-muted">
                {weapon.make} {weapon.model} - {weapon.type}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(weapon.status) as any} className="text-sm px-3 py-1">
              {weapon.status.replace(/_/g, " ")}
            </Badge>
            {canEdit && (
              <Button variant="secondary">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Condition</p>
                  <Badge variant={getConditionBadgeVariant(weapon.condition) as any} className="mt-1">
                    {weapon.condition.replace(/_/g, " ")}
                  </Badge>
                </div>
                <Shield className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Location</p>
                  <p className="text-lg font-bold text-foreground">{weapon.location}</p>
                </div>
                <Package className="h-8 w-8 text-info opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Next Inspection</p>
                  <p className="text-lg font-bold text-foreground">
                    {new Date(weapon.nextInspection).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Serial Number</p>
                  <p className="text-lg font-mono text-accent">{weapon.serialNumber}</p>
                </div>
                <FileText className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Assignment */}
        {weapon.assignedTo && (
          <Card className="border-info/30 bg-info/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-info/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-info" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Currently Issued to: {weapon.assignedTo}</p>
                    <p className="text-sm text-foreground-muted">Badge: {weapon.assignedBadge}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground-muted">Issued on</p>
                  <p className="text-foreground">{new Date(weapon.issuedDate!).toLocaleDateString("en-IN")}</p>
                </div>
                {canIssue && (
                  <Button variant="secondary">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Return Weapon
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Maintenance Warning */}
        {weapon.status === "MAINTENANCE" && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium text-foreground">Under Maintenance</p>
                  <p className="text-sm text-foreground-muted">{weapon.remarks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <Crosshair className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="issuance">
              <History className="h-4 w-4 mr-2" />
              Issuance History
            </TabsTrigger>
            <TabsTrigger value="inspection">
              <CheckCircle className="h-4 w-4 mr-2" />
              Inspections
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weapon Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-foreground-muted">Weapon ID</p>
                      <p className="font-mono text-accent">{weapon.weaponId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Type</p>
                      <p className="text-foreground">{weapon.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Make</p>
                      <p className="text-foreground">{weapon.make}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Model</p>
                      <p className="text-foreground">{weapon.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Serial Number</p>
                      <p className="font-mono text-foreground">{weapon.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Caliber</p>
                      <p className="text-foreground">{weapon.caliber}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Asset Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-foreground-muted">Purchase Date</p>
                      <p className="text-foreground">{new Date(weapon.purchaseDate).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Purchase Value</p>
                      <p className="text-foreground">Rs. {weapon.purchaseValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Last Inspection</p>
                      <p className="text-foreground">{new Date(weapon.lastInspection).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Next Inspection</p>
                      <p className="text-foreground">{new Date(weapon.nextInspection).toLocaleDateString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Current Location</p>
                      <p className="text-foreground">{weapon.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Condition</p>
                      <Badge variant={getConditionBadgeVariant(weapon.condition) as any}>
                        {weapon.condition.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Issue Weapon Button for Available Weapons */}
            {weapon.status === "IN_ARMOURY" && canIssue && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium text-foreground">Weapon Available for Issuance</p>
                        <p className="text-sm text-foreground-muted">Biometric verification required</p>
                      </div>
                    </div>
                    <Button>
                      <Shield className="h-4 w-4 mr-2" />
                      Issue Weapon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Issuance History Tab */}
          <TabsContent value="issuance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Issuance History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Officer</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Ammunition</TableHead>
                      <TableHead>Verified By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockIssuanceHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.date).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell>
                          <Badge variant={record.action === "ISSUED" ? "info" : "success"}>
                            {record.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-foreground">{record.officer}</p>
                            <p className="text-xs text-foreground-muted">{record.badge}</p>
                          </div>
                        </TableCell>
                        <TableCell>{record.purpose}</TableCell>
                        <TableCell>{record.ammunition}</TableCell>
                        <TableCell>{record.verifiedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inspection History Tab */}
          <TabsContent value="inspection" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inspection History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Next Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockInspectionHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.date).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell>{record.inspector}</TableCell>
                        <TableCell>
                          <Badge variant={record.result === "PASS" ? "success" : "error"}>
                            {record.result}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{record.notes}</TableCell>
                        <TableCell>{new Date(record.nextDue).toLocaleDateString("en-IN")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
