"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Car,
  User,
  MapPin,
  Calendar,
  Clock,
  Fuel,
  Wrench,
  Navigation,
  Edit,
  History,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useState } from "react";

// Mock vehicle data
const mockVehicles: Record<string, {
  id: string;
  regNumber: string;
  type: string;
  make: string;
  model: string;
  year: number;
  status: string;
  driver: string | null;
  fuelLevel: number;
  kmToday: number;
  totalKm: number;
  lastService: string;
  nextService: string;
  gpsLocation: string;
  currentBeat: string | null;
  insuranceExpiry: string;
  fitnessExpiry: string;
  condition: string;
}> = {
  "v-001": {
    id: "v-001",
    regNumber: "KA-01-P-1234",
    type: "Patrol",
    make: "Maruti Suzuki",
    model: "Swift Dzire",
    year: 2022,
    status: "ON_DUTY",
    driver: "HC Mohan",
    fuelLevel: 78,
    kmToday: 45,
    totalKm: 45678,
    lastService: "2024-01-01",
    nextService: "2024-04-01",
    gpsLocation: "12.9352, 77.6245",
    currentBeat: "Beat A - Koramangala 4th Block",
    insuranceExpiry: "2024-12-31",
    fitnessExpiry: "2025-01-15",
    condition: "GOOD",
  },
  "v-002": {
    id: "v-002",
    regNumber: "KA-01-P-1235",
    type: "Patrol",
    make: "Maruti Suzuki",
    model: "Swift Dzire",
    year: 2022,
    status: "ON_DUTY",
    driver: "Const. Ravi",
    fuelLevel: 65,
    kmToday: 32,
    totalKm: 38921,
    lastService: "2024-01-05",
    nextService: "2024-04-05",
    gpsLocation: "12.9421, 77.6189",
    currentBeat: "Beat B - Koramangala 5th Block",
    insuranceExpiry: "2024-12-31",
    fitnessExpiry: "2025-02-20",
    condition: "GOOD",
  },
};

// Mock trip history
const mockTripHistory = [
  {
    id: "t-001",
    date: "2024-01-18",
    driver: "HC Mohan",
    purpose: "Patrol Beat A",
    startTime: "06:00",
    endTime: "14:00",
    kmStart: 45633,
    kmEnd: 45678,
    fuelUsed: "5L",
  },
  {
    id: "t-002",
    date: "2024-01-17",
    driver: "Const. Ravi",
    purpose: "Court Escort",
    startTime: "09:00",
    endTime: "13:00",
    kmStart: 45598,
    kmEnd: 45633,
    fuelUsed: "4L",
  },
  {
    id: "t-003",
    date: "2024-01-16",
    driver: "HC Mohan",
    purpose: "Patrol Beat A",
    startTime: "06:00",
    endTime: "14:00",
    kmStart: 45553,
    kmEnd: 45598,
    fuelUsed: "5L",
  },
];

// Mock maintenance history
const mockMaintenanceHistory = [
  {
    id: "m-001",
    date: "2024-01-01",
    type: "Regular Service",
    description: "Oil change, filter replacement, general inspection",
    cost: 5500,
    vendor: "Govt. Workshop",
    odometer: 45000,
  },
  {
    id: "m-002",
    date: "2023-10-15",
    type: "Tyre Replacement",
    description: "Front tyres replaced",
    cost: 8000,
    vendor: "MRF Authorized",
    odometer: 42000,
  },
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

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");

  const vehicleId = params.id as string;
  const vehicle = mockVehicles[vehicleId] || mockVehicles["v-001"];

  const canEdit = user && hasMinimumRole(user.role, "SHO");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/vehicles">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Fleet
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Car className="h-6 w-6" />
                {vehicle.regNumber}
              </h1>
              <p className="text-foreground-muted">
                {vehicle.make} {vehicle.model} ({vehicle.year})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(vehicle.status) as any} className="text-sm px-3 py-1">
              {vehicle.status.replace(/_/g, " ")}
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
                  <p className="text-sm text-foreground-muted">Fuel Level</p>
                  <p className={`text-2xl font-bold ${getFuelColor(vehicle.fuelLevel)}`}>
                    {vehicle.fuelLevel}%
                  </p>
                </div>
                <Fuel className={`h-8 w-8 opacity-50 ${getFuelColor(vehicle.fuelLevel)}`} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">KM Today</p>
                  <p className="text-2xl font-bold text-foreground">{vehicle.kmToday} km</p>
                </div>
                <Navigation className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Total Odometer</p>
                  <p className="text-2xl font-bold text-foreground">{vehicle.totalKm.toLocaleString()} km</p>
                </div>
                <Clock className="h-8 w-8 text-info opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Condition</p>
                  <p className="text-2xl font-bold text-success">{vehicle.condition}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Assignment */}
        {vehicle.driver && (
          <Card className="border-accent/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <User className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Current Driver: {vehicle.driver}</p>
                    <p className="text-sm text-foreground-muted">{vehicle.currentBeat}</p>
                  </div>
                </div>
                {vehicle.gpsLocation && (
                  <div className="flex items-center gap-2 text-foreground-muted">
                    <MapPin className="h-4 w-4" />
                    <span className="font-mono text-sm">{vehicle.gpsLocation}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <Car className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="trips">
              <History className="h-4 w-4 mr-2" />
              Trip History
            </TabsTrigger>
            <TabsTrigger value="maintenance">
              <Wrench className="h-4 w-4 mr-2" />
              Maintenance
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-foreground-muted">Registration</p>
                      <p className="font-mono text-foreground">{vehicle.regNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Type</p>
                      <p className="text-foreground">{vehicle.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Make</p>
                      <p className="text-foreground">{vehicle.make}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Model</p>
                      <p className="text-foreground">{vehicle.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Year</p>
                      <p className="text-foreground">{vehicle.year}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Condition</p>
                      <Badge variant="success">{vehicle.condition}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-md bg-background-tertiary">
                    <div>
                      <p className="font-medium text-foreground">Insurance</p>
                      <p className="text-sm text-foreground-muted">
                        Expires: {new Date(vehicle.insuranceExpiry).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <Badge variant="success">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md bg-background-tertiary">
                    <div>
                      <p className="font-medium text-foreground">Fitness Certificate</p>
                      <p className="text-sm text-foreground-muted">
                        Expires: {new Date(vehicle.fitnessExpiry).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <Badge variant="success">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Valid
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-md bg-background-tertiary">
                    <div>
                      <p className="font-medium text-foreground">Next Service</p>
                      <p className="text-sm text-foreground-muted">
                        Due: {new Date(vehicle.nextService).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <Badge variant="info">
                      <Calendar className="h-3 w-3 mr-1" />
                      Scheduled
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trip History Tab */}
          <TabsContent value="trips" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Trips</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Fuel Used</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTripHistory.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>{new Date(trip.date).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell>{trip.driver}</TableCell>
                        <TableCell>{trip.purpose}</TableCell>
                        <TableCell>{trip.startTime} - {trip.endTime}</TableCell>
                        <TableCell>{trip.kmEnd - trip.kmStart} km</TableCell>
                        <TableCell>{trip.fuelUsed}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Odometer</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Vendor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockMaintenanceHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.date).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell>{record.type}</TableCell>
                        <TableCell>{record.description}</TableCell>
                        <TableCell>{record.odometer.toLocaleString()} km</TableCell>
                        <TableCell>Rs. {record.cost.toLocaleString()}</TableCell>
                        <TableCell>{record.vendor}</TableCell>
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
