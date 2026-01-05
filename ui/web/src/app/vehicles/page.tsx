"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Car,
  Search,
  Plus,
  Eye,
  MapPin,
  Fuel,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Download,
  Maximize2,
  Edit,
  Trash2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useVehiclesStore } from "@/stores/vehiclesStore";
import { useToastStore } from "@/stores/toastStore";
import { exportToCSV, exportConfigs } from "@/lib/utils/export";

// Dynamic import for map to avoid SSR issues
const VehicleTrackingMap = dynamic(
  () => import("@/components/ui/Map").then((mod) => mod.VehicleTrackingMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-background-tertiary rounded-lg flex items-center justify-center">
        <div className="text-foreground-muted">Loading map...</div>
      </div>
    )
  }
);

// Convert GPS string to coordinates
function parseGpsLocation(gps: string | undefined): { lat: number; lng: number } | undefined {
  if (!gps || gps === "Station") return undefined;
  const [lat, lng] = gps.split(",").map((s) => parseFloat(s.trim()));
  if (isNaN(lat) || isNaN(lng)) return undefined;
  return { lat, lng };
}

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
  const { vehicles, deleteVehicle, isLoading } = useVehiclesStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState("fleet");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showFullMap, setShowFullMap] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  const canAllocate = user && hasMinimumRole(user.role, "SHO");
  const canDelete = user && hasMinimumRole(user.role, "SP");

  const filteredVehicles = vehicles.filter((v) => {
    if (typeFilter && v.type !== typeFilter) return false;
    if (statusFilter && v.status !== statusFilter) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        v.registrationNumber.toLowerCase().includes(search) ||
        v.currentDriver?.toLowerCase().includes(search) ||
        false
      );
    }
    return true;
  });

  // Prepare vehicles for map
  const vehiclesForMap = vehicles
    .filter((v) => v.gpsLocation)
    .map((v) => ({
      id: v.id,
      registrationNumber: v.registrationNumber,
      type: v.type,
      status: v.status,
      gpsLocation: v.gpsLocation,
      driver: v.currentDriver,
    }));

  const stats = {
    total: vehicles.length,
    onDuty: vehicles.filter((v) => v.status === "ON_DUTY").length,
    available: vehicles.filter((v) => v.status === "AVAILABLE").length,
    maintenance: vehicles.filter((v) => v.status === "MAINTENANCE").length,
  };

  const handleExport = () => {
    exportToCSV(vehicles, "vehicles-export", exportConfigs.vehicles);
    addToast({
      type: "success",
      title: "Export Successful",
      message: `Exported ${vehicles.length} vehicles to CSV`,
    });
  };

  const handleDeleteClick = (id: string) => {
    setVehicleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (vehicleToDelete) {
      await deleteVehicle(vehicleToDelete);
      addToast({
        type: "success",
        title: "Vehicle Deleted",
        message: "Vehicle has been removed from the system",
      });
      setDeleteDialogOpen(false);
      setVehicleToDelete(null);
    }
  };

  const handleVehicleClick = (vehicleId: string) => {
    window.location.href = `/vehicles/${vehicleId}`;
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
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {canAllocate && (
              <Link href="/vehicles/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vehicle
                </Button>
              </Link>
            )}
          </div>
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
              <Button variant="ghost" size="sm" onClick={() => setShowFullMap(!showFullMap)}>
                <Maximize2 className="h-4 w-4 mr-2" />
                {showFullMap ? "Collapse" : "Expand"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <VehicleTrackingMap
              vehicles={vehiclesForMap}
              height={showFullMap ? "500px" : "300px"}
              onVehicleClick={handleVehicleClick}
            />
            <p className="text-sm text-foreground-muted mt-2 text-center">
              {stats.onDuty} vehicles currently on patrol • Click markers for details
            </p>
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
                      onChange={setSearchQuery}
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
                          <span className="font-mono text-accent">{vehicle.registrationNumber}</span>
                        </TableCell>
                        <TableCell>{vehicle.type}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(vehicle.status) as any}>
                            {vehicle.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {vehicle.currentDriver || (
                            <span className="text-foreground-muted">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {vehicle.currentDuty || (
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
                          <span className="text-foreground">{vehicle.odometerReading} km</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/vehicles/${vehicle.id}`}>
                              <Button variant="ghost" size="sm" title="View Details">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/vehicles/${vehicle.id}?edit=true`}>
                              <Button variant="ghost" size="sm" title="Edit">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete"
                                onClick={() => handleDeleteClick(vehicle.id)}
                              >
                                <Trash2 className="h-4 w-4 text-error" />
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
              <Button variant="secondary" onClick={() => addToast({ type: "success", title: "Export Complete", message: "Trip log exported to CSV" })}>
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
                <Button variant="secondary" onClick={() => addToast({ type: "info", title: "Log Fuel", message: "Fuel entry form coming soon" })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Fuel Entry
                </Button>
                <Button variant="secondary" onClick={() => addToast({ type: "success", title: "Export Complete", message: "Fuel log exported to CSV" })}>
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
              <Button variant="secondary" onClick={() => addToast({ type: "info", title: "Schedule Maintenance", message: "Maintenance scheduling form coming soon" })}>
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
                    <Button variant="secondary" size="sm" onClick={() => addToast({ type: "info", title: "Schedule Service", message: "Service scheduling form coming soon" })}>
                      Schedule
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md bg-background-tertiary">
                    <div>
                      <p className="font-medium text-foreground">KA-01-G-5678</p>
                      <p className="text-sm text-foreground-muted">Service due in 5 days</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => addToast({ type: "info", title: "Schedule Service", message: "Service scheduling form coming soon" })}>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </DashboardLayout>
  );
}
