"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import dynamic from "next/dynamic";
import {
  Car,
  Search,
  Plus,
  MapPin,
  Fuel,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Navigation,
  Download,
  Maximize2,
  Trash2,
  Loader2,
  UserCheck,
  Undo2,
  Gauge,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LegacySelect as Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { exportToCSV, exportConfigs } from "@/lib/utils/export";
import { formatDate } from "@/lib/utils";
import {
  useAllocateVehicle,
  useCreateVehicle,
  useDeleteVehicle,
  useReturnVehicle,
  useUpdateVehicle,
  useVehicleCounts,
  useVehicles,
} from "@/hooks/use-vehicles";
import { useQuery } from "@tanstack/react-query";
import investigationApi from "@/lib/api/investigation";
import type { Vehicle, VehicleStatus, VehicleType } from "@/lib/api/vehicles";

// Dynamic import for map to avoid SSR issues
const VehicleTrackingMap = dynamic(
  () => import("@/components/ui/Map").then((mod) => mod.VehicleTrackingMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-background-tertiary rounded-lg flex items-center justify-center">
        <div className="text-foreground-muted">Loading map...</div>
      </div>
    ),
  }
);

const PAGE_SIZE = 20;

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

/** A date input yields YYYY-MM-DD; the API's time.Time fields need RFC 3339. */
const toApiDate = (day: string) => `${day}T00:00:00Z`;
const today = () => new Date().toISOString().split("T")[0];

const errorText = (error: unknown) => (error instanceof Error ? error.message : "The server rejected the request");

const emptyVehicleForm = () => ({
  registrationNumber: "",
  type: "Patrol" as VehicleType,
  make: "",
  lastService: today(),
  fuelLevel: "100",
  odometerReading: "0",
});

export default function VehiclesPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [searchQuery, setSearchQuery] = useState("");
  const search = useDeferredValue(searchQuery.trim());
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showFullMap, setShowFullMap] = useState(false);

  const vehicles = useVehicles({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    type: (typeFilter || undefined) as VehicleType | undefined,
    status: (statusFilter || undefined) as VehicleStatus | undefined,
  });
  const counts = useVehicleCounts();

  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const allocateVehicle = useAllocateVehicle();
  const returnVehicle = useReturnVehicle();
  const deleteVehicle = useDeleteVehicle();

  // Dialog state — each holds the vehicle it acts on
  const [addOpen, setAddOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [allocating, setAllocating] = useState<Vehicle | null>(null);
  const [driverSearch, setDriverSearch] = useState("");
  const deferredDriverSearch = useDeferredValue(driverSearch.trim());
  const [driver, setDriver] = useState<{ id: string; label: string } | null>(null);
  const [duty, setDuty] = useState("");
  const [returning, setReturning] = useState<Vehicle | null>(null);
  const [maintaining, setMaintaining] = useState<Vehicle | null>(null);
  const [maintenanceNote, setMaintenanceNote] = useState("");
  const [readingsFor, setReadingsFor] = useState<Vehicle | null>(null);
  const [readings, setReadings] = useState({ fuelLevel: "", odometerReading: "", lastService: "" });
  const [deleting, setDeleting] = useState<Vehicle | null>(null);

  // The officer directory is only fetched while a vehicle is being allocated.
  const officers = useQuery({
    queryKey: ["investigation", "officers", deferredDriverSearch, ""],
    queryFn: () => investigationApi.officers(deferredDriverSearch || undefined).then((r) => r.data),
    enabled: allocating !== null,
    staleTime: 5 * 60 * 1000,
  });

  // Creating, editing and allocating are SHO and above on the server; deleting is DSP and above.
  const canManage = user && hasMinimumRole(user.role, "SHO");
  const canDelete = user && hasMinimumRole(user.role, "DSP");

  const rows = vehicles.data?.data ?? [];
  const totalPages = vehicles.data?.totalPages ?? 0;

  // Only vehicles with a stored position are placed on the map — nothing is inferred.
  const vehiclesForMap = rows
    .filter((v) => v.gpsLatitude !== null && v.gpsLongitude !== null)
    .map((v) => ({
      id: v.id,
      registrationNumber: v.registrationNumber,
      type: v.type,
      status: v.status,
      gpsLocation: { lat: v.gpsLatitude!, lng: v.gpsLongitude! },
      driver: v.currentDriver ?? undefined,
    }));

  const notify = (type: "success" | "error", title: string, message: string) => addToast({ type, title, message });

  const handleExport = () => {
    exportToCSV(
      rows.map((v) => ({ ...v, currentDriver: v.currentDriver ?? "", currentDuty: v.currentDuty ?? "" })),
      "vehicles-export",
      exportConfigs.vehicles
    );
    notify("success", "Export Successful", `Exported ${rows.length} vehicles shown on this page to CSV`);
  };

  const setFilter = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  /* ------------------------------ add vehicle ------------------------------ */

  const handleCreate = async () => {
    const fuel = Number(vehicleForm.fuelLevel);
    const odometer = Number(vehicleForm.odometerReading);
    if (!vehicleForm.registrationNumber.trim() || !vehicleForm.make.trim() || !vehicleForm.lastService) {
      notify("error", "Validation Error", "Please fill in all required fields");
      return;
    }
    if (!Number.isInteger(fuel) || fuel < 0 || fuel > 100 || !Number.isInteger(odometer) || odometer < 0) {
      notify("error", "Validation Error", "Fuel must be a whole number from 0 to 100 and odometer cannot be negative");
      return;
    }
    if (!user?.stationId) {
      notify("error", "No station", "Your account is not attached to a station, so the vehicle cannot be registered");
      return;
    }
    try {
      const created = await createVehicle.mutateAsync({
        registrationNumber: vehicleForm.registrationNumber.trim().toUpperCase(),
        type: vehicleForm.type,
        make: vehicleForm.make.trim(),
        lastService: toApiDate(vehicleForm.lastService),
        fuelLevel: fuel,
        odometerReading: odometer,
        stationId: user.stationId,
      });
      notify("success", "Vehicle Added", `${created.registrationNumber} has been registered`);
      setAddOpen(false);
      setVehicleForm(emptyVehicleForm());
    } catch (error) {
      notify("error", "Vehicle not added", errorText(error));
    }
  };

  /* -------------------------------- allocate ------------------------------- */

  const closeAllocate = () => {
    setAllocating(null);
    setDriver(null);
    setDriverSearch("");
    setDuty("");
  };

  const handleAllocate = async () => {
    if (!allocating || !driver || !duty.trim()) {
      notify("error", "Validation Error", "Choose a driver and state the duty");
      return;
    }
    try {
      const updated = await allocateVehicle.mutateAsync({ id: allocating.id, driverId: driver.id, duty: duty.trim() });
      notify("success", "Vehicle Allocated", `${updated.registrationNumber} is on duty with ${updated.currentDriver ?? driver.label}`);
      closeAllocate();
    } catch (error) {
      notify("error", "Vehicle not allocated", errorText(error));
    }
  };

  /* ------------------------------ return, delete ---------------------------- */

  const handleReturn = async () => {
    if (!returning) return;
    try {
      const updated = await returnVehicle.mutateAsync(returning.id);
      notify("success", "Vehicle Returned", `${updated.registrationNumber} is available`);
      setReturning(null);
    } catch (error) {
      notify("error", "Vehicle not returned", errorText(error));
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteVehicle.mutateAsync(deleting.id);
      notify("success", "Vehicle Deleted", `${deleting.registrationNumber} has been removed from the fleet register`);
      setDeleting(null);
    } catch (error) {
      notify("error", "Vehicle not deleted", errorText(error));
    }
  };

  /* ------------------------------- maintenance ------------------------------ */

  const handleSendToMaintenance = async () => {
    if (!maintaining || !maintenanceNote.trim()) {
      notify("error", "Validation Error", "Record what the maintenance is for");
      return;
    }
    try {
      await updateVehicle.mutateAsync({
        vehicle: maintaining,
        changes: { status: "MAINTENANCE", maintenanceNote: maintenanceNote.trim() },
      });
      notify("success", "Sent to Maintenance", `${maintaining.registrationNumber} is out of service`);
      setMaintaining(null);
      setMaintenanceNote("");
    } catch (error) {
      notify("error", "Status not changed", errorText(error));
    }
  };

  const handleBackInService = async (vehicle: Vehicle) => {
    try {
      await updateVehicle.mutateAsync({
        vehicle,
        changes: { status: "AVAILABLE", maintenanceNote: null },
      });
      notify("success", "Back in Service", `${vehicle.registrationNumber} is available`);
    } catch (error) {
      notify("error", "Status not changed", errorText(error));
    }
  };

  /* -------------------------------- readings -------------------------------- */

  const openReadings = (vehicle: Vehicle) => {
    setReadingsFor(vehicle);
    setReadings({
      fuelLevel: String(vehicle.fuelLevel),
      odometerReading: String(vehicle.odometerReading),
      lastService: vehicle.lastService.split("T")[0],
    });
  };

  const handleReadings = async () => {
    if (!readingsFor) return;
    const fuel = Number(readings.fuelLevel);
    const odometer = Number(readings.odometerReading);
    if (!Number.isInteger(fuel) || fuel < 0 || fuel > 100 || !Number.isInteger(odometer) || !readings.lastService) {
      notify("error", "Validation Error", "Fuel must be a whole number from 0 to 100 and every reading is required");
      return;
    }
    if (odometer < readingsFor.odometerReading) {
      notify("error", "Validation Error", `Odometer cannot go below the recorded ${readingsFor.odometerReading} km`);
      return;
    }
    try {
      await updateVehicle.mutateAsync({
        vehicle: readingsFor,
        changes: { fuelLevel: fuel, odometerReading: odometer, lastService: toApiDate(readings.lastService) },
      });
      notify("success", "Readings Updated", `${readingsFor.registrationNumber} has been updated`);
      setReadingsFor(null);
    } catch (error) {
      notify("error", "Readings not updated", errorText(error));
    }
  };

  const statCards = [
    { label: "Total Vehicles", value: counts.data?.total, icon: Car, valueClass: "text-foreground", iconClass: "text-accent", filter: "" },
    { label: "On Duty", value: counts.data?.ON_DUTY, icon: Navigation, valueClass: "text-info", iconClass: "text-info", filter: "ON_DUTY" },
    { label: "Available", value: counts.data?.AVAILABLE, icon: CheckCircle, valueClass: "text-success", iconClass: "text-success", filter: "AVAILABLE" },
    { label: "Maintenance", value: counts.data?.MAINTENANCE, icon: Wrench, valueClass: "text-warning", iconClass: "text-warning", filter: "MAINTENANCE" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vehicle Management</h1>
            <p className="text-foreground-muted">Track fleet status and vehicle allocation</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport} disabled={rows.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {canManage && (
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vehicle
              </Button>
            )}
          </div>
        </div>

        {/* Stats — whole-fleet counts from the server, not the rows on this page */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, valueClass, iconClass, filter }) => (
            <Card
              key={label}
              className={`cursor-pointer transition-all hover:border-accent/50 ${
                statusFilter === filter ? "border-accent ring-1 ring-accent" : ""
              }`}
              onClick={() => setFilter(setStatusFilter)(statusFilter === filter ? "" : filter)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground-muted">{label}</p>
                    <p className={`text-2xl font-bold ${valueClass}`}>
                      {counts.isError ? "—" : value ?? <Loader2 className="h-5 w-5 animate-spin" />}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 opacity-50 ${iconClass}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Map — only when vehicles on this page have a recorded position */}
        {vehiclesForMap.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Last Recorded Positions
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowFullMap(!showFullMap)}>
                <Maximize2 className="h-4 w-4 mr-2" />
                {showFullMap ? "Collapse" : "Expand"}
              </Button>
            </CardHeader>
            <CardContent>
              <VehicleTrackingMap vehicles={vehiclesForMap} height={showFullMap ? "500px" : "300px"} />
              <p className="text-sm text-foreground-muted mt-2 text-center">
                {vehiclesForMap.length} of {rows.length} vehicles on this page have a recorded position
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 min-w-[16rem]">
                <Input
                  placeholder="Search by registration number or make..."
                  value={searchQuery}
                  onChange={setFilter(setSearchQuery)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <Select options={vehicleTypeOptions} value={typeFilter} onChange={setFilter(setTypeFilter)} className="w-full md:w-40" />
              <Select options={statusOptions} value={statusFilter} onChange={setFilter(setStatusFilter)} className="w-full md:w-40" />
            </div>
          </CardContent>
        </Card>

        {/* Vehicles Table */}
        <Card>
          <CardContent className="p-0">
            {vehicles.isPending ? (
              <div className="p-12 flex items-center justify-center gap-3 text-foreground-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading vehicles…
              </div>
            ) : vehicles.isError ? (
              <div className="p-12 text-center space-y-3">
                <AlertTriangle className="h-12 w-12 text-error mx-auto" />
                <h3 className="text-lg font-medium text-foreground">Vehicles could not be loaded</h3>
                <p className="text-foreground-muted">{vehicles.error.message}</p>
                <Button variant="secondary" onClick={() => vehicles.refetch()}>
                  Try again
                </Button>
              </div>
            ) : rows.length === 0 ? (
              <div className="p-12 text-center">
                <Car className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">No vehicles found</h3>
                <p className="text-foreground-muted">
                  {search || typeFilter || statusFilter
                    ? "Try adjusting your search or filter criteria"
                    : "No vehicles have been registered yet"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reg Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Current Assignment</TableHead>
                      <TableHead>Fuel</TableHead>
                      <TableHead>Odometer</TableHead>
                      <TableHead>Last Service</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((vehicle) => (
                      <TableRow key={vehicle.id} className="hover:bg-background-tertiary">
                        <TableCell>
                          <Link href={`/vehicles/${vehicle.id}`} className="font-mono text-accent hover:underline">{vehicle.registrationNumber}</Link>
                          <span className="block text-xs text-foreground-muted">
                            {vehicle.make}
                            {vehicle.stationName && ` · ${vehicle.stationName}`}
                          </span>
                        </TableCell>
                        <TableCell>{vehicle.type}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(vehicle.status) as any}>
                            {vehicle.status.replace(/_/g, " ")}
                          </Badge>
                          {vehicle.status === "MAINTENANCE" && vehicle.maintenanceNote && (
                            <span className="block text-xs text-foreground-muted mt-1">{vehicle.maintenanceNote}</span>
                          )}
                          {vehicle.status === "RESERVED" && vehicle.reservedFor && (
                            <span className="block text-xs text-foreground-muted mt-1">{vehicle.reservedFor}</span>
                          )}
                        </TableCell>
                        <TableCell>{vehicle.currentDriver || <span className="text-foreground-muted">-</span>}</TableCell>
                        <TableCell>{vehicle.currentDuty || <span className="text-foreground-muted">-</span>}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Fuel className={`h-4 w-4 ${getFuelColor(vehicle.fuelLevel)}`} />
                            <span className={getFuelColor(vehicle.fuelLevel)}>{vehicle.fuelLevel}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground">{vehicle.odometerReading.toLocaleString("en-IN")} km</span>
                        </TableCell>
                        <TableCell>{formatDate(vehicle.lastService)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canManage && (vehicle.status === "AVAILABLE" || vehicle.status === "RESERVED") && (
                              <Button variant="ghost" size="sm" title="Allocate" onClick={() => setAllocating(vehicle)}>
                                <UserCheck className="h-4 w-4 mr-1" />
                                Allocate
                              </Button>
                            )}
                            {vehicle.status === "ON_DUTY" && (
                              <Button variant="ghost" size="sm" title="Return" onClick={() => setReturning(vehicle)}>
                                <Undo2 className="h-4 w-4 mr-1" />
                                Return
                              </Button>
                            )}
                            {canManage && vehicle.status === "MAINTENANCE" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Back in service"
                                disabled={updateVehicle.isPending}
                                onClick={() => handleBackInService(vehicle)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Back in Service
                              </Button>
                            )}
                            {canManage && (vehicle.status === "AVAILABLE" || vehicle.status === "RESERVED") && (
                              <Button variant="ghost" size="sm" title="Send to maintenance" onClick={() => setMaintaining(vehicle)}>
                                <Wrench className="h-4 w-4" />
                              </Button>
                            )}
                            {canManage && (
                              <Button variant="ghost" size="sm" title="Update readings" onClick={() => openReadings(vehicle)}>
                                <Gauge className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && vehicle.status !== "ON_DUTY" && (
                              <Button variant="ghost" size="sm" title="Delete" onClick={() => setDeleting(vehicle)}>
                                <Trash2 className="h-4 w-4 text-error" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-foreground-muted">
            <span>
              Page {page} of {totalPages} · {vehicles.data?.total} vehicles
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Vehicle */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Vehicle" description="Register a vehicle to the fleet" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Registration Number *"
              placeholder="WB-01-AB-1234"
              value={vehicleForm.registrationNumber}
              onChange={(v: string) => setVehicleForm({ ...vehicleForm, registrationNumber: v })}
            />
            <Select
              label="Type *"
              options={vehicleTypeOptions.slice(1)}
              value={vehicleForm.type}
              onChange={(v: string) => setVehicleForm({ ...vehicleForm, type: v as VehicleType })}
            />
          </div>
          <Input
            label="Make / Model *"
            placeholder="Mahindra Bolero"
            value={vehicleForm.make}
            onChange={(v: string) => setVehicleForm({ ...vehicleForm, make: v })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Fuel Level (%) *"
              type="number"
              value={vehicleForm.fuelLevel}
              onChange={(v: string) => setVehicleForm({ ...vehicleForm, fuelLevel: v })}
            />
            <Input
              label="Odometer (km) *"
              type="number"
              value={vehicleForm.odometerReading}
              onChange={(v: string) => setVehicleForm({ ...vehicleForm, odometerReading: v })}
            />
            <Input
              label="Last Service *"
              type="date"
              value={vehicleForm.lastService}
              onChange={(v: string) => setVehicleForm({ ...vehicleForm, lastService: v })}
            />
          </div>
          <p className="text-sm text-foreground-muted">
            Station: {user?.stationName || "your account has no station"}
          </p>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setAddOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={createVehicle.isPending}>
            {createVehicle.isPending ? "Adding..." : "Add Vehicle"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Allocate */}
      <Modal
        isOpen={allocating !== null}
        onClose={closeAllocate}
        title={`Allocate ${allocating?.registrationNumber ?? ""}`}
        description="Assign a driver and duty. The vehicle goes on duty."
        size="lg"
      >
        <div className="space-y-4">
          {driver ? (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-foreground text-sm">{driver.label}</span>
              <Button variant="ghost" size="sm" onClick={() => setDriver(null)}>
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                label="Driver *"
                placeholder="Search officers by name or badge"
                value={driverSearch}
                onChange={setDriverSearch}
                icon={<Search className="h-4 w-4" />}
              />
              <div className="rounded-lg border border-border divide-y divide-border max-h-48 overflow-y-auto">
                {officers.isPending ? (
                  <p className="p-3 text-sm text-foreground-muted">Loading officers…</p>
                ) : officers.isError ? (
                  <p className="p-3 text-sm text-error">Officers could not be loaded: {officers.error.message}</p>
                ) : officers.data.length === 0 ? (
                  <p className="p-3 text-sm text-foreground-muted">No matching officers</p>
                ) : (
                  officers.data.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className="w-full text-left p-3 hover:bg-background-tertiary"
                      onClick={() => setDriver({ id: o.id, label: `${o.roleLabel} ${o.name}${o.badgeNumber ? ` (${o.badgeNumber})` : ""}` })}
                    >
                      <span className="text-sm text-foreground">
                        {o.roleLabel} {o.name}
                      </span>
                      <span className="block text-xs text-foreground-muted">
                        {[o.badgeNumber, o.stationName].filter(Boolean).join(" · ")}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
          <Input label="Duty *" placeholder="Patrol, Beat 4 — Park Street" value={duty} onChange={setDuty} />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={closeAllocate}>
            Cancel
          </Button>
          <Button onClick={handleAllocate} disabled={allocateVehicle.isPending}>
            {allocateVehicle.isPending ? "Allocating..." : "Allocate"}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Send to maintenance */}
      <Modal
        isOpen={maintaining !== null}
        onClose={() => setMaintaining(null)}
        title={`Send ${maintaining?.registrationNumber ?? ""} to maintenance`}
        description="The vehicle is marked out of service until it is brought back."
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Reason <span className="text-error">*</span>
          </label>
          <textarea
            className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-md text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent"
            rows={3}
            placeholder="Brake service at Govt. Workshop"
            value={maintenanceNote}
            onChange={(e) => setMaintenanceNote(e.target.value)}
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setMaintaining(null)}>
            Cancel
          </Button>
          <Button onClick={handleSendToMaintenance} disabled={updateVehicle.isPending}>
            <Wrench className="h-4 w-4 mr-2" />
            Send to Maintenance
          </Button>
        </ModalFooter>
      </Modal>

      {/* Update readings */}
      <Modal
        isOpen={readingsFor !== null}
        onClose={() => setReadingsFor(null)}
        title={`Update readings — ${readingsFor?.registrationNumber ?? ""}`}
        description="Record the current fuel level, odometer and last service date."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Fuel Level (%)"
            type="number"
            value={readings.fuelLevel}
            onChange={(v: string) => setReadings({ ...readings, fuelLevel: v })}
          />
          <Input
            label="Odometer (km)"
            type="number"
            value={readings.odometerReading}
            onChange={(v: string) => setReadings({ ...readings, odometerReading: v })}
          />
          <Input
            label="Last Service"
            type="date"
            value={readings.lastService}
            onChange={(v: string) => setReadings({ ...readings, lastService: v })}
          />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setReadingsFor(null)}>
            Cancel
          </Button>
          <Button onClick={handleReadings} disabled={updateVehicle.isPending}>
            Save Readings
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        isOpen={returning !== null}
        onClose={() => setReturning(null)}
        onConfirm={handleReturn}
        title="Return Vehicle"
        message={`Return ${returning?.registrationNumber ?? ""}? The driver, duty and recorded position are cleared and the vehicle becomes available.`}
        confirmText="Return"
        type="warning"
        isLoading={returnVehicle.isPending}
      />

      <ConfirmDialog
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message={`Delete ${deleting?.registrationNumber ?? ""} from the fleet register? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={deleteVehicle.isPending}
      />
    </DashboardLayout>
  );
}
