"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LegacySelect as Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/textarea";
import type { MapMarker } from "@/components/ui/Map";

// Dynamic import for map to avoid SSR issues
const InteractiveMap = dynamic(
  () => import("@/components/ui/Map").then((mod) => mod.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 bg-background-tertiary rounded-lg flex items-center justify-center">
        <div className="text-foreground-muted">Loading map...</div>
      </div>
    )
  }
);
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useLookoutStore, Lookout, Sighting } from "@/stores/lookoutStore";
import { exportToCSV, exportConfigs } from "@/lib/utils/export";

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

// Lookout and sighting data now comes from useLookoutStore

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
  const { addToast } = useToastStore();
  const { lookouts, sightings, verifySighting, reportSighting, createLookout, getActiveLookouts } = useLookoutStore();
  const [activeTab, setActiveTab] = useState("notices");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSightingModal, setShowSightingModal] = useState(false);
  const [selectedLookoutForSighting, setSelectedLookoutForSighting] = useState<Lookout | null>(null);

  // Create Lookout form state
  const [createForm, setCreateForm] = useState({
    type: "WANTED" as Lookout["type"],
    name: "",
    description: "",
    priority: "NORMAL" as Lookout["priority"],
    linkedFIR: "",
    details: {
      age: "",
      gender: "",
      height: "",
      complexion: "",
      identifyingMarks: "",
      lastSeen: "",
      lastSeenDate: "",
    },
  });

  // Sighting form state
  const [sightingForm, setSightingForm] = useState({
    location: "",
    details: "",
    latitude: "",
    longitude: "",
  });

  const canCreate = user && hasMinimumRole(user.role, "SI");
  const canVerify = user && hasMinimumRole(user.role, "SHO");

  const filteredLookouts = lookouts.filter((lo) => {
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
    active: lookouts.filter((lo) => lo.status === "ACTIVE").length,
    wanted: lookouts.filter((lo) => lo.type === "WANTED").length,
    missing: lookouts.filter((lo) => lo.type === "MISSING").length,
    vehicles: lookouts.filter((lo) => lo.type === "STOLEN_VEHICLE").length,
  };

  const handleVerifySighting = async (sighting: Sighting, verified: boolean) => {
    if (user) {
      await verifySighting(sighting.id, user.name, verified);
      addToast({
        type: verified ? "success" : "warning",
        title: verified ? "Sighting Verified" : "Sighting Rejected",
        message: verified
          ? `Sighting at ${sighting.location} has been verified`
          : "Sighting marked as false positive",
      });
    }
  };

  const handleCreateLookout = async () => {
    if (!user) return;

    if (!createForm.name || !createForm.description) {
      addToast({
        type: "error",
        title: "Validation Error",
        message: "Please fill in all required fields",
      });
      return;
    }

    try {
      await createLookout({
        type: createForm.type,
        name: createForm.name,
        description: createForm.description,
        priority: createForm.priority,
        status: "ACTIVE",
        linkedFIR: createForm.linkedFIR || null,
        issuedBy: user.name,
        hasPhoto: false,
        details: createForm.details,
      });

      addToast({
        type: "success",
        title: "Lookout Created",
        message: `Lookout notice for ${createForm.name} has been created`,
      });

      setShowCreateModal(false);
      setCreateForm({
        type: "WANTED",
        name: "",
        description: "",
        priority: "NORMAL",
        linkedFIR: "",
        details: {
          age: "",
          gender: "",
          height: "",
          complexion: "",
          identifyingMarks: "",
          lastSeen: "",
          lastSeenDate: "",
        },
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to create lookout notice",
      });
    }
  };

  const handleOpenSightingModal = (lookout: Lookout) => {
    setSelectedLookoutForSighting(lookout);
    setShowSightingModal(true);
  };

  const handleReportSighting = async () => {
    if (!user || !selectedLookoutForSighting) return;

    if (!sightingForm.location || !sightingForm.details) {
      addToast({
        type: "error",
        title: "Validation Error",
        message: "Please fill in all required fields",
      });
      return;
    }

    try {
      const coordinates =
        sightingForm.latitude && sightingForm.longitude
          ? {
              lat: parseFloat(sightingForm.latitude),
              lng: parseFloat(sightingForm.longitude),
            }
          : undefined;

      await reportSighting({
        lookoutId: selectedLookoutForSighting.lookoutId,
        reportedBy: user.name,
        location: sightingForm.location,
        details: sightingForm.details,
        coordinates,
      });

      addToast({
        type: "success",
        title: "Sighting Reported",
        message: `Sighting for ${selectedLookoutForSighting.name} has been reported`,
      });

      setShowSightingModal(false);
      setSelectedLookoutForSighting(null);
      setSightingForm({
        location: "",
        details: "",
        latitude: "",
        longitude: "",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to report sighting",
      });
    }
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
            <Button onClick={() => setShowCreateModal(true)}>
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
                      onChange={setSearchQuery}
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
                  <Button
                    variant="secondary"
                    onClick={() => {
                      exportToCSV(filteredLookouts, "lookout-notices", exportConfigs.lookout);
                      addToast({
                        type: "success",
                        title: "Export successful",
                        message: "Lookout notices exported to CSV",
                      });
                    }}
                  >
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
                          <Link href={`/lookout/${lookout.id}`}>
                            <Button variant="secondary" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenSightingModal(lookout)}
                          >
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
              {lookouts.length > 0 && (
                <Button onClick={() => {
                  setSelectedLookoutForSighting(lookouts[0]);
                  setShowSightingModal(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Report Sighting
                </Button>
              )}
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
                    {sightings.map((sighting) => (
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
                            <Button variant="ghost" size="sm" onClick={() => addToast({ type: "info", title: "View Sighting", message: `Sighting details for ${sighting.lookoutId}` })}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canVerify && !sighting.verified && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleVerifySighting(sighting, true)}>
                                  <CheckCircle className="h-4 w-4 text-success" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleVerifySighting(sighting, false)}>
                                  <XCircle className="h-4 w-4 text-error" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sightings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-foreground-muted py-8">
                          No sightings reported yet
                        </TableCell>
                      </TableRow>
                    )}
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
                <InteractiveMap
                  markers={[
                    // Markers from lookout last known locations
                    ...lookouts
                      .filter((lo) => lo.details.lastSeen)
                      .map((lo, idx) => ({
                        id: lo.id,
                        lat: 12.934 + (idx * 0.02), // Mock coordinates based on index
                        lng: 77.625 + (idx * 0.02),
                        title: lo.name,
                        description: `${lo.type.replace(/_/g, " ")} - Last seen: ${lo.details.lastSeen}`,
                        type: "alert" as const,
                        status: lo.priority,
                      })),
                    // Markers from sightings with coordinates
                    ...sightings
                      .filter((s) => s.coordinates)
                      .map((s) => ({
                        id: s.id,
                        lat: s.coordinates!.lat,
                        lng: s.coordinates!.lng,
                        title: `Sighting: ${s.lookoutId}`,
                        description: s.location,
                        type: s.verified ? ("evidence" as const) : ("default" as const),
                        status: s.verified ? "Verified" : "Pending",
                      })),
                  ]}
                  center={[12.934, 77.625]}
                  zoom={11}
                  height="500px"
                  onMarkerClick={(marker) => {
                    const lookout = lookouts.find((lo) => lo.id === marker.id);
                    const sighting = sightings.find((s) => s.id === marker.id);
                    if (lookout) {
                      addToast({
                        type: "info",
                        title: lookout.name,
                        message: `${lookout.type.replace(/_/g, " ")} - ${lookout.description}`,
                      });
                    } else if (sighting) {
                      addToast({
                        type: "info",
                        title: "Sighting Details",
                        message: `${sighting.location} - ${sighting.details}`,
                      });
                    }
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Lookout Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Lookout Notice"
        description="Issue a new lookout notice for wanted persons, missing persons, or stolen vehicles"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              options={[
                { value: "WANTED", label: "Wanted Criminal" },
                { value: "MISSING", label: "Missing Person" },
                { value: "STOLEN_VEHICLE", label: "Stolen Vehicle" },
                { value: "SUSPECT", label: "Suspect" },
                { value: "WITNESS", label: "Witness Required" },
              ]}
              value={createForm.type}
              onChange={(value: string) => setCreateForm({ ...createForm, type: value as Lookout["type"] })}
            />
            <Select
              label="Priority"
              options={[
                { value: "LOW", label: "Low" },
                { value: "NORMAL", label: "Normal" },
                { value: "HIGH", label: "High" },
                { value: "CRITICAL", label: "Critical" },
              ]}
              value={createForm.priority}
              onChange={(value: string) => setCreateForm({ ...createForm, priority: value as Lookout["priority"] })}
            />
          </div>

          <Input
            label="Name / Identification *"
            placeholder="Enter person name or vehicle registration"
            value={createForm.name}
            onChange={(value: string) => setCreateForm({ ...createForm, name: value })}
          />

          <Textarea
            label="Description *"
            placeholder="Brief description of the lookout notice"
            value={createForm.description}
            onChange={(value: string) => setCreateForm({ ...createForm, description: value })}
            rows={3}
          />

          <Input
            label="Linked FIR"
            placeholder="e.g., KOR/2024/00123"
            value={createForm.linkedFIR}
            onChange={(value: string) => setCreateForm({ ...createForm, linkedFIR: value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Age"
              placeholder="Age or age range"
              value={createForm.details.age}
              onChange={(value: string) => setCreateForm({ ...createForm, details: { ...createForm.details, age: value } })}
            />
            <Input
              label="Gender"
              placeholder="Gender"
              value={createForm.details.gender}
              onChange={(value: string) => setCreateForm({ ...createForm, details: { ...createForm.details, gender: value } })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Height"
              placeholder="Height"
              value={createForm.details.height}
              onChange={(value: string) => setCreateForm({ ...createForm, details: { ...createForm.details, height: value } })}
            />
            <Input
              label="Complexion"
              placeholder="Complexion"
              value={createForm.details.complexion}
              onChange={(value: string) => setCreateForm({ ...createForm, details: { ...createForm.details, complexion: value } })}
            />
          </div>

          <Input
            label="Identifying Marks"
            placeholder="Scars, tattoos, etc."
            value={createForm.details.identifyingMarks}
            onChange={(value: string) => setCreateForm({ ...createForm, details: { ...createForm.details, identifyingMarks: value } })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Last Seen Location"
              placeholder="Last known location"
              value={createForm.details.lastSeen}
              onChange={(value: string) => setCreateForm({ ...createForm, details: { ...createForm.details, lastSeen: value } })}
            />
            <Input
              label="Last Seen Date"
              type="date"
              value={createForm.details.lastSeenDate}
              onChange={(value: string) => setCreateForm({ ...createForm, details: { ...createForm.details, lastSeenDate: value } })}
            />
          </div>
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateLookout}>
            <Plus className="h-4 w-4 mr-2" />
            Create Lookout
          </Button>
        </ModalFooter>
      </Modal>

      {/* Report Sighting Modal */}
      <Modal
        isOpen={showSightingModal}
        onClose={() => {
          setShowSightingModal(false);
          setSelectedLookoutForSighting(null);
          setSightingForm({
            location: "",
            details: "",
            latitude: "",
            longitude: "",
          });
        }}
        title="Report Sighting"
        description={
          selectedLookoutForSighting
            ? `Report a sighting for ${selectedLookoutForSighting.name} (${selectedLookoutForSighting.lookoutId})`
            : "Report a sighting"
        }
        size="md"
      >
        <div className="space-y-4">
          {selectedLookoutForSighting && (
            <div className="p-3 bg-background-tertiary rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={getTypeBadgeVariant(selectedLookoutForSighting.type) as any}>
                  {selectedLookoutForSighting.type.replace(/_/g, " ")}
                </Badge>
                <Badge variant={getPriorityBadgeVariant(selectedLookoutForSighting.priority) as any}>
                  {selectedLookoutForSighting.priority}
                </Badge>
              </div>
              <h4 className="font-medium text-foreground">{selectedLookoutForSighting.name}</h4>
              <p className="text-sm text-foreground-muted">{selectedLookoutForSighting.description}</p>
            </div>
          )}

          <Input
            label="Location *"
            placeholder="Where was the sighting?"
            value={sightingForm.location}
            onChange={(value: string) => setSightingForm({ ...sightingForm, location: value })}
            icon={<MapPin className="h-4 w-4" />}
          />

          <Textarea
            label="Details *"
            placeholder="Provide details about the sighting..."
            value={sightingForm.details}
            onChange={(value: string) => setSightingForm({ ...sightingForm, details: value })}
            rows={4}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Latitude (Optional)"
              placeholder="e.g., 12.9716"
              type="number"
              step="any"
              value={sightingForm.latitude}
              onChange={(value: string) => setSightingForm({ ...sightingForm, latitude: value })}
            />
            <Input
              label="Longitude (Optional)"
              placeholder="e.g., 77.5946"
              type="number"
              step="any"
              value={sightingForm.longitude}
              onChange={(value: string) => setSightingForm({ ...sightingForm, longitude: value })}
            />
          </div>

          <div className="text-xs text-foreground-muted">
            <p>Tip: Include GPS coordinates if available for accurate mapping</p>
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowSightingModal(false);
              setSelectedLookoutForSighting(null);
              setSightingForm({
                location: "",
                details: "",
                latitude: "",
                longitude: "",
              });
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleReportSighting}>
            <Flag className="h-4 w-4 mr-2" />
            Submit Sighting
          </Button>
        </ModalFooter>
      </Modal>
    </DashboardLayout>
  );
}
