"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Search,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  MapPin,
  Camera,
  Clock,
  User,
  Car,
  FileText,
  Filter,
  Download,
  Flag,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";

const lookoutTypeOptions = [
  { value: "", label: "All Types" },
  { value: "WANTED", label: "Wanted Criminal" },
  { value: "MISSING", label: "Missing Person" },
  { value: "STOLEN_VEHICLE", label: "Stolen Vehicle" },
  { value: "SUSPECT", label: "Suspect" },
  { value: "WITNESS", label: "Witness Required" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "LOCATED", label: "Located" },
  { value: "CLOSED", label: "Closed" },
];

// Mock lookout notices
const mockLookouts = [
  {
    id: "lo-001",
    lookoutId: "LO-2024-KOR-001",
    type: "WANTED",
    name: "Rajan Kumar @ Raju",
    description: "Wanted in murder case CC/2024/0045",
    details: {
      age: "32",
      gender: "Male",
      height: "5'8\"",
      complexion: "Dark",
      identifyingMarks: "Scar on left cheek",
      lastSeen: "Jayanagar, Bengaluru",
      lastSeenDate: "2024-01-15",
    },
    priority: "HIGH",
    status: "ACTIVE",
    linkedFIR: "KOR/2024/00089",
    issuedBy: "State Crime Branch",
    issuedAt: "2024-01-17",
    hasPhoto: true,
  },
  {
    id: "lo-002",
    lookoutId: "LO-2024-KOR-002",
    type: "MISSING",
    name: "Priya Sharma",
    description: "Missing since 16 Jan 2024 from BTM Layout",
    details: {
      age: "24",
      gender: "Female",
      height: "5'4\"",
      complexion: "Fair",
      lastWornClothes: "Blue salwar, white dupatta",
      lastSeen: "BTM Layout 2nd Stage",
      lastSeenDate: "2024-01-16",
      contactInfo: "+91 9876543210 (Father)",
    },
    priority: "CRITICAL",
    status: "ACTIVE",
    linkedFIR: "KOR/2024/00125",
    issuedBy: "Koramangala PS",
    issuedAt: "2024-01-17",
    hasPhoto: true,
  },
  {
    id: "lo-003",
    lookoutId: "LO-2024-KOR-003",
    type: "STOLEN_VEHICLE",
    name: "KA-01-MH-5678",
    description: "Honda City, White, Stolen from JP Nagar",
    details: {
      make: "Honda City",
      model: "VX CVT",
      year: "2022",
      color: "White",
      chassisNumber: "ME4WB2DE1M******",
      engineNumber: "L15Z6-21*****",
      stolenFrom: "JP Nagar 5th Phase",
      stolenDate: "2024-01-14",
    },
    priority: "NORMAL",
    status: "ACTIVE",
    linkedFIR: "KOR/2024/00118",
    issuedBy: "Koramangala PS",
    issuedAt: "2024-01-15",
    hasPhoto: false,
  },
  {
    id: "lo-004",
    lookoutId: "LO-2024-KOR-004",
    type: "SUSPECT",
    name: "Unknown Male",
    description: "Suspect in chain snatching incidents",
    details: {
      age: "25-30",
      gender: "Male",
      height: "5'6\" approx",
      complexion: "Wheatish",
      identifyingMarks: "Wears gold chain",
      vehicleDescription: "Red Pulsar, partial number MH-**-5*",
      lastSeen: "Koramangala area",
      lastSeenDate: "2024-01-18",
    },
    priority: "HIGH",
    status: "ACTIVE",
    linkedFIR: "KOR/2024/00120",
    issuedBy: "Koramangala PS",
    issuedAt: "2024-01-18",
    hasPhoto: false,
  },
];

// Mock sightings
const mockSightings = [
  {
    id: "sight-001",
    lookoutId: "LO-2024-KOR-001",
    reportedBy: "Const. Vijay",
    location: "Near Forum Mall",
    time: "2024-01-18T10:30:00Z",
    verified: false,
    details: "Person matching description seen near mall entrance",
  },
  {
    id: "sight-002",
    lookoutId: "LO-2024-KOR-003",
    reportedBy: "Public Tip",
    location: "Hosur Road",
    time: "2024-01-17T14:00:00Z",
    verified: true,
    details: "Vehicle spotted on Hosur Road heading towards Electronics City",
  },
];

function getTypeBadgeVariant(type: string) {
  const variants: Record<string, string> = {
    WANTED: "error",
    MISSING: "warning",
    STOLEN_VEHICLE: "info",
    SUSPECT: "secondary",
    WITNESS: "success",
  };
  return variants[type] || "secondary";
}

function getPriorityBadgeVariant(priority: string) {
  const variants: Record<string, string> = {
    LOW: "low",
    NORMAL: "normal",
    HIGH: "high",
    CRITICAL: "critical",
  };
  return variants[priority] || "secondary";
}

export default function LookoutPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("notices");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const canCreate = user && hasMinimumRole(user.role, "SI");
  const canVerify = user && hasMinimumRole(user.role, "SHO");

  const filteredLookouts = mockLookouts.filter((lo) => {
    if (typeFilter && lo.type !== typeFilter) return false;
    if (statusFilter && lo.status !== statusFilter) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        lo.lookoutId.toLowerCase().includes(search) ||
        lo.name.toLowerCase().includes(search) ||
        lo.description.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const stats = {
    active: mockLookouts.filter((lo) => lo.status === "ACTIVE").length,
    wanted: mockLookouts.filter((lo) => lo.type === "WANTED").length,
    missing: mockLookouts.filter((lo) => lo.type === "MISSING").length,
    vehicles: mockLookouts.filter((lo) => lo.type === "STOLEN_VEHICLE").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lookout Notices</h1>
            <p className="text-foreground-muted">
              Wanted persons, missing persons, and stolen vehicle alerts
            </p>
          </div>
          {canCreate && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Lookout
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Active Lookouts</p>
                  <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Wanted Persons</p>
                  <p className="text-2xl font-bold text-error">{stats.wanted}</p>
                </div>
                <User className="h-8 w-8 text-error opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Missing Persons</p>
                  <p className="text-2xl font-bold text-warning">{stats.missing}</p>
                </div>
                <Flag className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Stolen Vehicles</p>
                  <p className="text-2xl font-bold text-info">{stats.vehicles}</p>
                </div>
                <Car className="h-8 w-8 text-info opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="notices">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Lookout Notices
            </TabsTrigger>
            <TabsTrigger value="sightings">
              <Eye className="h-4 w-4 mr-2" />
              Sightings
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapPin className="h-4 w-4 mr-2" />
              Map View
            </TabsTrigger>
          </TabsList>

          {/* Notices Tab */}
          <TabsContent value="notices" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by ID, name, or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <Select
                    options={lookoutTypeOptions}
                    value={typeFilter}
                    onChange={setTypeFilter}
                    className="w-full md:w-44"
                  />
                  <Select
                    options={statusOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    className="w-full md:w-36"
                  />
                  <Button variant="secondary">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lookout Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLookouts.map((lookout) => (
                <Card key={lookout.id} className="hover:border-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Photo placeholder */}
                      <div className="h-32 w-24 bg-background-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                        {lookout.hasPhoto ? (
                          <Camera className="h-8 w-8 text-foreground-muted" />
                        ) : lookout.type === "STOLEN_VEHICLE" ? (
                          <Car className="h-8 w-8 text-foreground-muted" />
                        ) : (
                          <User className="h-8 w-8 text-foreground-muted" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getTypeBadgeVariant(lookout.type) as any}>
                            {lookout.type.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant={getPriorityBadgeVariant(lookout.priority) as any}>
                            {lookout.priority}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-foreground">{lookout.name}</h3>
                        <p className="text-sm text-foreground-muted">{lookout.description}</p>
                        <p className="text-xs text-foreground-muted mt-2">
                          <span className="font-mono text-accent">{lookout.lookoutId}</span>
                          {" | "}
                          FIR: {lookout.linkedFIR}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <Button variant="secondary" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Flag className="h-4 w-4 mr-1" />
                            Report Sighting
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Sightings Tab */}
          <TabsContent value="sightings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Recent Sightings</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Report Sighting
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lookout ID</TableHead>
                      <TableHead>Reported By</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockSightings.map((sighting) => (
                      <TableRow key={sighting.id}>
                        <TableCell>
                          <span className="font-mono text-accent">{sighting.lookoutId}</span>
                        </TableCell>
                        <TableCell>{sighting.reportedBy}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-foreground-muted" />
                            {sighting.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(sighting.time).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground-muted line-clamp-1">
                            {sighting.details}
                          </span>
                        </TableCell>
                        <TableCell>
                          {sighting.verified ? (
                            <Badge variant="success">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="warning">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canVerify && !sighting.verified && (
                              <>
                                <Button variant="ghost" size="sm">
                                  <CheckCircle className="h-4 w-4 text-success" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <XCircle className="h-4 w-4 text-error" />
                                </Button>
                              </>
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

          {/* Map Tab */}
          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Lookout & Sighting Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 bg-background-tertiary rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-foreground-muted mx-auto mb-2" />
                    <p className="text-foreground-muted">Interactive Map View</p>
                    <p className="text-sm text-foreground-muted">
                      Showing last known locations and sightings
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
