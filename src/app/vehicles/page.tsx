"use client";

import { useState } from "react";
import {
  Car,
  Search,
  Filter,
  Plus,
  Eye,
  MapPin,
  Fuel,
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Calendar,
  Download,
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

// Mock vehicles data
const mockVehicles = [
  {
    id: "v-001",
    regNumber: "KA-01-P-1234",
    type: "Patrol",
    make: "Maruti Swift",
    status: "ON_DUTY",
    driver: "HC Mohan",
    fuelLevel: 78,
    kmToday: 45,
    lastService: "2024-01-01",
    gpsLocation: "12.9352, 77.6245",
    currentBeat: "Beat A - Koramangala 4th Block",
  },
  {
    id: "v-002",
    regNumber: "KA-01-P-1235",
    type: "Patrol",
    make: "Maruti Swift",
    status: "ON_DUTY",
    driver: "Const. Ravi",
    fuelLevel: 65,
    kmToday: 32,
    lastService: "2024-01-05",
    gpsLocation: "12.9421, 77.6189",
    currentBeat: "Beat B - Koramangala 5th Block",
  },
  {
    id: "v-003",
    regNumber: "KA-01-G-5678",
    type: "Gypsy",
    make: "Mahindra Thar",
    status: "ON_DUTY",
    driver: "Const. Kumar",
    fuelLevel: 82,
    kmToday: 28,
    lastService: "2023-12-20",
    gpsLocation: "12.9156, 77.6412",
    currentBeat: "Court Escort Duty",
  },
  {
    id: "v-004",
    regNumber: "KA-01-P-9999",
    type: "PCR",
    make: "Innova",
    status: "ON_DUTY",
    driver: "ASI Sharma",
    fuelLevel: 45,
    kmToday: 67,
    lastService: "2024-01-10",
    gpsLocation: "12.9287, 77.6301",
    currentBeat: "PCR Duty - Mobile",
  },
  {
    id: "v-005",
    regNumber: "KA-01-P-1236",
    type: "Patrol",
    make: "Maruti Swift",
    status: "AVAILABLE",
    driver: null,
    fuelLevel: 90,
    kmToday: 0,
    lastService: "2024-01-08",
    gpsLocation: "Station",
  },
  {
    id: "v-006",
    regNumber: "KA-01-G-5679",
    type: "Gypsy",
    make: "Mahindra Bolero",
    status: "AVAILABLE",
    driver: null,
    fuelLevel: 95,
    kmToday: 0,
    lastService: "2024-01-12",
    gpsLocation: "Station",
  },
  {
    id: "v-007",
    regNumber: "KA-01-P-1237",
    type: "Patrol",
    make: "Maruti Swift",
    status: "MAINTENANCE",
    driver: null,
    fuelLevel: 30,
    kmToday: 0,
    lastService: "2023-11-15",
    maintenanceNote: "Engine service due",
  },
  {
    id: "v-008",
    regNumber: "KA-01-B-0001",
    type: "Bus",
    make: "Ashok Leyland",
    status: "RESERVED",
    driver: null,
    fuelLevel: 100,
    kmToday: 0,
    lastService: "2024-01-05",
    reservedFor: "Bandobast - Republic Day",
  },
];

// Mock trips data
const mockTrips = [
  {
    id: "t-001",
    tripId: "T-001",
    vehicle: "KA-01-P-1234",
    driver: "HC Mohan",
    purpose: "Patrol Beat A",
    startTime: "06:00",
    endTime: null,
    kmStart: 45678,
    kmEnd: null,
    status: "ACTIVE",
  },
  {
    id: "t-002",
    tripId: "T-002",
    vehicle: "KA-01-G-5678",
    driver: "Const. Kumar",
    purpose: "Court Escort",
    startTime: "09:00",
    endTime: "12:30",
    kmStart: 23456,
    kmEnd: 23484,
    status: "COMPLETED",
  },
  {
    id: "t-003",
    tripId: "T-003",
    vehicle: "KA-01-P-9999",
    driver: "ASI Sharma",
    purpose: "PCR Duty",
    startTime: "06:00",
    endTime: null,
    kmStart: 67890,
    kmEnd: null,
    status: "ACTIVE",
  },
];

const vehicleTypeOptions = [
  { value: "", label: "All Types" },
  { value: "Patrol", label: "Patrol" },
  { value: "Gypsy", label: "Gypsy" },
  { value: "PCR", label: "PCR" },
  { value: "Bus", label: "Bus" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "ON_DUTY", label: "On Duty" },
  { value: "AVAILABLE", label: "Available" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "RESERVED", label: "Reserved" },
];

function getStatusBadgeVariant(status: string) {
  const variants: Record<string, string> = {
    ON_DUTY: "info",
    AVAILABLE: "success",
    MAINTENANCE: "warning",
    RESERVED: "secondary",
  };
  return variants[status] || "secondary";
}

function getFuelColor(level: number) {
  if (level >= 50) return "text-success";
  if (level >= 25) return "text-warning";
  return "text-error";
}

export default function VehiclesPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("fleet");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const canAllocate = user && hasMinimumRole(user.role, "SHO");

  const filteredVehicles = mockVehicles.filter((v) => {
    if (typeFilter && v.type !== typeFilter) return false;
    if (statusFilter && v.status !== statusFilter) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        v.regNumber.toLowerCase().includes(search) ||
        v.driver?.toLowerCase().includes(search) ||
        false
      );
    }
    return true;
  });

  const stats = {
    total: mockVehicles.length,
    onDuty: mockVehicles.filter((v) => v.status === "ON_DUTY").length,
    available: mockVehicles.filter((v) => v.status === "AVAILABLE").length,
    maintenance: mockVehicles.filter((v) => v.status === "MAINTENANCE").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vehicle Management</h1>
            <p className="text-foreground-muted">
              Track fleet status, trips, and vehicle allocation
            </p>
          </div>
          {canAllocate && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Allocate Vehicle
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Total Vehicles</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Car className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">On Duty</p>
                  <p className="text-2xl font-bold text-info">{stats.onDuty}</p>
                </div>
                <Navigation className="h-8 w-8 text-info opacity-50" />
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
                <Wrench className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Map Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Vehicle Tracking
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Navigation className="h-4 w-4 mr-2" />
                Full Map
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-background-tertiary rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-foreground-muted mx-auto mb-2" />
                <p className="text-foreground-muted">Interactive Map View</p>
                <p className="text-sm text-foreground-muted">
                  {stats.onDuty} vehicles currently on patrol
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="fleet">
              <Car className="h-4 w-4 mr-2" />
              Fleet Status
            </TabsTrigger>
            <TabsTrigger value="trips">
              <Navigation className="h-4 w-4 mr-2" />
              Trip Log
            </TabsTrigger>
            <TabsTrigger value="fuel">
              <Fuel className="h-4 w-4 mr-2" />
              Fuel Log
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <Wrench className="h-4 w-4 mr-2" />
              Maintenance
            </TabsTrigger>
          </TabsList>

          {/* Fleet Status Tab */}
          <TabsContent value="fleet" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by registration number or driver..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <Select
                    options={vehicleTypeOptions}
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

            {/* Vehicles Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reg Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Current Assignment</TableHead>
                      <TableHead>Fuel</TableHead>
                      <TableHead>Km Today</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.map((vehicle) => (
                      <TableRow key={vehicle.id} className="hover:bg-background-tertiary">
                        <TableCell>
                          <span className="font-mono text-accent">{vehicle.regNumber}</span>
                        </TableCell>
                        <TableCell>{vehicle.type}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(vehicle.status) as any}>
                            {vehicle.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {vehicle.driver || (
                            <span className="text-foreground-muted">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {vehicle.currentBeat || vehicle.reservedFor || vehicle.maintenanceNote || (
                            <span className="text-foreground-muted">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Fuel className={`h-4 w-4 ${getFuelColor(vehicle.fuelLevel)}`} />
                            <span className={getFuelColor(vehicle.fuelLevel)}>
                              {vehicle.fuelLevel}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground">{vehicle.kmToday} km</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {vehicle.gpsLocation && vehicle.gpsLocation !== "Station" && (
                              <Button variant="ghost" size="sm">
                                <MapPin className="h-4 w-4" />
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

          {/* Trip Log Tab */}
          <TabsContent value="trips" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Today&apos;s Trips</h3>
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
                      <TableHead>Trip ID</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>
                          <span className="font-mono text-accent">{trip.tripId}</span>
                        </TableCell>
                        <TableCell>{trip.vehicle}</TableCell>
                        <TableCell>{trip.driver}</TableCell>
                        <TableCell>{trip.purpose}</TableCell>
                        <TableCell>{trip.startTime}</TableCell>
                        <TableCell>{trip.endTime || "-"}</TableCell>
                        <TableCell>
                          {trip.kmEnd ? `${trip.kmEnd - trip.kmStart} km` : "In Progress"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={trip.status === "ACTIVE" ? "info" : "success"}
                          >
                            {trip.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fuel Log Tab */}
          <TabsContent value="fuel" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Fuel Consumption</h3>
              <div className="flex gap-2">
                <Button variant="secondary">
                  <Plus className="h-4 w-4 mr-2" />
                  Log Fuel Entry
                </Button>
                <Button variant="secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-accent">₹12,450</p>
                  <p className="text-sm text-foreground-muted">Today&apos;s Fuel Cost</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-info">156 L</p>
                  <p className="text-sm text-foreground-muted">Fuel Consumed Today</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-success">12.5 km/L</p>
                  <p className="text-sm text-foreground-muted">Avg. Mileage</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Fuel Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Liters</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Odometer</TableHead>
                      <TableHead>Filled By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>18 Jan 2024</TableCell>
                      <TableCell>KA-01-P-1234</TableCell>
                      <TableCell>35 L</TableCell>
                      <TableCell>₹3,500</TableCell>
                      <TableCell>45,678 km</TableCell>
                      <TableCell>HC Mohan</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>18 Jan 2024</TableCell>
                      <TableCell>KA-01-P-9999</TableCell>
                      <TableCell>45 L</TableCell>
                      <TableCell>₹4,500</TableCell>
                      <TableCell>67,890 km</TableCell>
                      <TableCell>ASI Sharma</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Maintenance Schedule</h3>
              <Button variant="secondary">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Maintenance
              </Button>
            </div>

            {/* Upcoming Maintenance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Service Due
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-md bg-warning/10 border border-warning/30">
                    <div>
                      <p className="font-medium text-foreground">KA-01-P-1237</p>
                      <p className="text-sm text-foreground-muted">Engine service overdue by 15 days</p>
                    </div>
                    <Button variant="secondary" size="sm">
                      Schedule
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md bg-background-tertiary">
                    <div>
                      <p className="font-medium text-foreground">KA-01-G-5678</p>
                      <p className="text-sm text-foreground-muted">Service due in 5 days</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Schedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Maintenance History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Service Type</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>12 Jan 2024</TableCell>
                      <TableCell>KA-01-G-5679</TableCell>
                      <TableCell>Regular Service</TableCell>
                      <TableCell>₹5,500</TableCell>
                      <TableCell>Govt. Workshop</TableCell>
                      <TableCell>
                        <Badge variant="success">Completed</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>10 Jan 2024</TableCell>
                      <TableCell>KA-01-P-9999</TableCell>
                      <TableCell>Oil Change</TableCell>
                      <TableCell>₹2,200</TableCell>
                      <TableCell>Govt. Workshop</TableCell>
                      <TableCell>
                        <Badge variant="success">Completed</Badge>
                      </TableCell>
                    </TableRow>
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
