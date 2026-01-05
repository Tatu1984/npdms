"use client";

import { useState } from "react";
import {
  MapPin,
  Navigation,
  Layers,
  Search,
  Car,
  Users,
  AlertTriangle,
  Clock,
  Radio,
  Target,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { PatrolMap } from "@/components/map";

// Mock patrol data
const mockPatrols = [
  {
    id: "patrol-001",
    vehicle: "KA-01-P-1234",
    officers: ["HC Mohan", "Const. Kumar"],
    beat: "Beat A - Koramangala 4th Block",
    status: "ON_PATROL",
    lastUpdate: "2 min ago",
    location: { lat: 12.9352, lng: 77.6245 },
  },
  {
    id: "patrol-002",
    vehicle: "KA-01-P-1235",
    officers: ["Const. Ravi"],
    beat: "Beat B - Koramangala 5th Block",
    status: "ON_PATROL",
    lastUpdate: "5 min ago",
    location: { lat: 12.9421, lng: 77.6189 },
  },
  {
    id: "patrol-003",
    vehicle: "KA-01-P-9999",
    officers: ["ASI Sharma", "Const. Vijay"],
    beat: "PCR Mobile",
    status: "RESPONDING",
    lastUpdate: "1 min ago",
    location: { lat: 12.9287, lng: 77.6301 },
    respondingTo: "Incident near MG Road",
  },
];

// Mock beat boundaries
const mockBeats = [
  { id: "beat-a", name: "Beat A", area: "Koramangala 4th Block", patrolCount: 1 },
  { id: "beat-b", name: "Beat B", area: "Koramangala 5th-8th Block", patrolCount: 1 },
  { id: "beat-c", name: "Beat C", area: "HSR Layout Sector 1-3", patrolCount: 0 },
  { id: "beat-d", name: "Beat D", area: "BTM Layout 1st Stage", patrolCount: 1 },
];

// Mock incidents
const mockIncidents = [
  {
    id: "inc-001",
    type: "THEFT",
    location: "Forum Mall",
    time: "10:30 AM",
    status: "RESPONDING",
    priority: "HIGH",
    coords: { lat: 12.9340, lng: 77.6250 },
  },
  {
    id: "inc-002",
    type: "ACCIDENT",
    location: "80 Feet Road",
    time: "09:15 AM",
    status: "RESOLVED",
    priority: "NORMAL",
    coords: { lat: 12.9380, lng: 77.6200 },
  },
  {
    id: "inc-003",
    type: "SUSPICIOUS",
    location: "HSR Layout",
    time: "11:00 AM",
    status: "PENDING",
    priority: "LOW",
    coords: { lat: 12.9156, lng: 77.6412 },
  },
];

// Mock layers
const mapLayers = [
  { id: "patrols", name: "Patrol Units", icon: Car, enabled: true },
  { id: "incidents", name: "Active Incidents", icon: AlertTriangle, enabled: true },
  { id: "beats", name: "Beat Boundaries", icon: Target, enabled: true },
  { id: "hotspots", name: "Crime Hotspots", icon: Radio, enabled: false },
  { id: "cctv", name: "CCTV Cameras", icon: Eye, enabled: false },
  { id: "checkpoints", name: "Checkpoints", icon: Crosshair, enabled: false },
];

function getStatusColor(status: string) {
  switch (status) {
    case "ON_PATROL":
      return "text-success";
    case "RESPONDING":
      return "text-warning";
    case "OFFLINE":
      return "text-error";
    default:
      return "text-foreground-muted";
  }
}

export default function GISPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState("live");
  const [searchQuery, setSearchQuery] = useState("");
  const [layers, setLayers] = useState(mapLayers);
  const [mapCenter, setMapCenter] = useState({ lat: 12.9352, lng: 77.6245 });
  const [trackedPatrolId, setTrackedPatrolId] = useState<string | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    unitId: "",
    incidentId: "",
    priority: "NORMAL",
    instructions: "",
  });

  const canDispatch = user && hasMinimumRole(user.role, "SHO");

  const toggleLayer = (layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
      )
    );
  };

  const handleTrackPatrol = (patrolId: string) => {
    const patrol = mockPatrols.find((p) => p.id === patrolId);
    if (patrol) {
      setMapCenter(patrol.location);
      setTrackedPatrolId(patrolId);
      addToast({
        type: "success",
        title: "Tracking Vehicle",
        message: `Now tracking ${patrol.vehicle} in real-time`,
      });
    }
  };

  const handleLocateIncident = (incidentId: string) => {
    const incident = mockIncidents.find((i) => i.id === incidentId);
    if (incident) {
      setMapCenter(incident.coords);
      addToast({
        type: "success",
        title: "Incident Located",
        message: `Centered map on ${incident.location}`,
      });
    }
  };

  const handleDispatchSubmit = () => {
    if (!dispatchForm.unitId || !dispatchForm.incidentId) {
      addToast({
        type: "error",
        title: "Validation Error",
        message: "Please select both a unit and an incident",
      });
      return;
    }

    const unit = mockPatrols.find((p) => p.id === dispatchForm.unitId);
    const incident = mockIncidents.find((i) => i.id === dispatchForm.incidentId);

    if (unit && incident) {
      addToast({
        type: "success",
        title: "Unit Dispatched",
        message: `${unit.vehicle} dispatched to ${incident.location}`,
      });
      setIsDispatchModalOpen(false);
      setDispatchForm({
        unitId: "",
        incidentId: "",
        priority: "NORMAL",
        instructions: "",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">GIS Mapping</h1>
            <p className="text-foreground-muted">
              Live tracking, patrol management, and crime mapping
            </p>
          </div>
          <div className="flex gap-2">
            {canDispatch && (
              <Button onClick={() => setIsDispatchModalOpen(true)}>
                <Radio className="h-4 w-4 mr-2" />
                Dispatch Unit
              </Button>
            )}
            <Button variant="secondary" onClick={() => {
              const mapElement = document.querySelector(".leaflet-container");
              if (mapElement) {
                mapElement.requestFullscreen?.();
              }
              addToast({ type: "info", title: "Full Screen", message: "Click ESC to exit full screen" });
            }}>
              <Maximize2 className="h-4 w-4 mr-2" />
              Full Screen
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-3">
            {/* Map Controls */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search location, address, or landmark..."
                      value={searchQuery}
                      onChange={setSearchQuery}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => addToast({ type: "info", title: "Zoom", message: "Use map controls to zoom in" })}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => addToast({ type: "info", title: "Zoom", message: "Use map controls to zoom out" })}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => addToast({ type: "info", title: "Navigation", message: "GPS navigation mode coming soon" })}>
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Leaflet Map */}
            <Card>
              <CardContent className="p-0">
                <div className="h-[600px] rounded-lg overflow-hidden relative">
                  <PatrolMap
                    patrols={mockPatrols}
                    incidents={mockIncidents}
                    beats={mockBeats}
                    stationLocation={mapCenter}
                    stationName={user?.stationName || "Police Station"}
                    showPatrols={layers.find((l) => l.id === "patrols")?.enabled ?? true}
                    showIncidents={layers.find((l) => l.id === "incidents")?.enabled ?? true}
                    showBeats={layers.find((l) => l.id === "beats")?.enabled ?? true}
                  />

                  {/* Map Legend */}
                  <div className="absolute bottom-4 left-4 p-3 bg-background-secondary/90 rounded-lg z-[1000]">
                    <p className="text-xs font-medium text-foreground mb-2">Legend</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-success" />
                        <span className="text-foreground-muted">On Patrol</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-warning" />
                        <span className="text-foreground-muted">Responding</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-error" />
                        <span className="text-foreground-muted">Incident</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-info" />
                        <span className="text-foreground-muted">Station</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Overlay */}
                  <div className="absolute top-4 left-4 p-3 bg-background-secondary/90 rounded-lg z-[1000]">
                    <p className="text-sm font-medium text-foreground">
                      {mockPatrols.length} units on patrol
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {mockIncidents.filter((i) => i.status !== "RESOLVED").length} active incidents
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Layers Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Map Layers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {layers.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    className={`flex items-center gap-3 w-full p-2 rounded-md transition-colors ${
                      layer.enabled
                        ? "bg-accent/10 text-accent"
                        : "bg-background-tertiary text-foreground-muted hover:text-foreground"
                    }`}
                  >
                    <layer.icon className="h-4 w-4" />
                    <span className="text-sm">{layer.name}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="live" className="flex-1">
                  Live
                </TabsTrigger>
                <TabsTrigger value="incidents" className="flex-1">
                  Incidents
                </TabsTrigger>
                <TabsTrigger value="beats" className="flex-1">
                  Beats
                </TabsTrigger>
              </TabsList>

              {/* Live Patrols Tab */}
              <TabsContent value="live" className="space-y-3 mt-4">
                {mockPatrols.map((patrol) => (
                  <Card key={patrol.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-mono text-accent text-sm">{patrol.vehicle}</span>
                          <p className="text-xs text-foreground-muted">{patrol.beat}</p>
                        </div>
                        <Badge
                          variant={
                            patrol.status === "RESPONDING" ? "warning" : "success"
                          }
                          className="text-xs"
                        >
                          {patrol.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-foreground-muted">
                        <Users className="h-3 w-3" />
                        {patrol.officers.join(", ")}
                      </div>
                      {patrol.respondingTo && (
                        <div className="mt-2 p-2 rounded bg-warning/10 text-xs text-warning">
                          Responding to: {patrol.respondingTo}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-foreground-muted">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {patrol.lastUpdate}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleTrackPatrol(patrol.id)}
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          {trackedPatrolId === patrol.id ? "Tracking" : "Track"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Incidents Tab */}
              <TabsContent value="incidents" className="space-y-3 mt-4">
                {mockIncidents.map((incident) => (
                  <Card key={incident.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Badge
                            variant={
                              incident.priority === "HIGH"
                                ? "error"
                                : incident.priority === "NORMAL"
                                ? "warning"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {incident.type}
                          </Badge>
                          <p className="text-sm text-foreground mt-1">{incident.location}</p>
                        </div>
                        <Badge
                          variant={
                            incident.status === "RESOLVED"
                              ? "success"
                              : incident.status === "RESPONDING"
                              ? "info"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {incident.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground-muted">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {incident.time}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => handleLocateIncident(incident.id)}
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Locate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Beats Tab */}
              <TabsContent value="beats" className="space-y-3 mt-4">
                {mockBeats.map((beat) => (
                  <Card key={beat.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-foreground">{beat.name}</p>
                          <p className="text-xs text-foreground-muted">{beat.area}</p>
                        </div>
                        <Badge
                          variant={beat.patrolCount > 0 ? "success" : "warning"}
                          className="text-xs"
                        >
                          {beat.patrolCount} patrol{beat.patrolCount !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => addToast({ type: "info", title: "Show Beat Area", message: `Highlighting ${beat.name} on map` })}>
                          <Target className="h-3 w-3 mr-1" />
                          Show Area
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Dispatch Modal */}
        <Modal
          isOpen={isDispatchModalOpen}
          onClose={() => setIsDispatchModalOpen(false)}
          title="Dispatch Unit"
          description="Assign a patrol unit to respond to an incident"
          size="lg"
        >
          <div className="space-y-4">
            <Select
              label="Select Patrol Unit"
              placeholder="Choose a unit to dispatch"
              options={mockPatrols.map((patrol) => ({
                value: patrol.id,
                label: `${patrol.vehicle} - ${patrol.officers.join(", ")} (${patrol.beat})`,
              }))}
              value={dispatchForm.unitId}
              onChange={(value) =>
                setDispatchForm({ ...dispatchForm, unitId: value })
              }
            />

            <Select
              label="Select Incident"
              placeholder="Choose an incident"
              options={mockIncidents
                .filter((i) => i.status !== "RESOLVED")
                .map((incident) => ({
                  value: incident.id,
                  label: `${incident.type} - ${incident.location} (${incident.priority} Priority)`,
                }))}
              value={dispatchForm.incidentId}
              onChange={(value) =>
                setDispatchForm({ ...dispatchForm, incidentId: value })
              }
            />

            <Select
              label="Priority Level"
              options={[
                { value: "LOW", label: "Low Priority" },
                { value: "NORMAL", label: "Normal Priority" },
                { value: "HIGH", label: "High Priority" },
                { value: "EMERGENCY", label: "Emergency" },
              ]}
              value={dispatchForm.priority}
              onChange={(value) =>
                setDispatchForm({ ...dispatchForm, priority: value })
              }
            />

            <div>
              <label
                htmlFor="instructions"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Dispatch Instructions
              </label>
              <textarea
                id="instructions"
                rows={3}
                className="flex w-full rounded-md border border-border bg-background-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Enter any special instructions for the responding unit..."
                value={dispatchForm.instructions}
                onChange={(e) =>
                  setDispatchForm({
                    ...dispatchForm,
                    instructions: e.target.value,
                  })
                }
              />
            </div>

            {dispatchForm.unitId && dispatchForm.incidentId && (
              <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm font-medium text-foreground mb-1">
                  Dispatch Summary
                </p>
                <p className="text-xs text-foreground-muted">
                  Unit:{" "}
                  {mockPatrols.find((p) => p.id === dispatchForm.unitId)?.vehicle}
                </p>
                <p className="text-xs text-foreground-muted">
                  Incident:{" "}
                  {
                    mockIncidents.find((i) => i.id === dispatchForm.incidentId)
                      ?.location
                  }
                </p>
                <p className="text-xs text-foreground-muted">
                  Priority: {dispatchForm.priority}
                </p>
              </div>
            )}
          </div>

          <ModalFooter>
            <Button
              variant="ghost"
              onClick={() => setIsDispatchModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDispatchSubmit}>
              <Radio className="h-4 w-4 mr-2" />
              Dispatch Unit
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
