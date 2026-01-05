"use client";

import { useState } from "react";
import Link from "next/link";
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
  const { lookouts, sightings, verifySighting, reportSighting, getActiveLookouts } = useLookoutStore();
  const [activeTab, setActiveTab] = useState("notices");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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

  const handleReportSighting = async (lookout: Lookout) => {
    if (user) {
      await reportSighting({
        lookoutId: lookout.lookoutId,
        reportedBy: user.name,
        location: "Reported Location",
        details: "Sighting reported via quick action",
      });
      addToast({
        type: "success",
        title: "Sighting Reported",
        message: `Sighting for ${lookout.name} has been reported`,
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
            <Link href="/lookout/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Lookout
              </Button>
            </Link>
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
                            onClick={() => handleReportSighting(lookout)}
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
              <Button onClick={() => addToast({ type: "info", title: "Report Sighting", message: "Sighting report form coming soon" })}>
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
