"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Car, Fuel, Gauge, Loader2, MapPin, User, Wrench } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useVehicle } from "@/hooks/use-vehicles";
import { ApiClientError } from "@/lib/api/client";
import { formatDate, formatDateTime } from "@/lib/utils";

const InteractiveMap = dynamic(() => import("@/components/ui/Map").then((mod) => mod.InteractiveMap), {
  ssr: false,
  loading: () => <div className="h-48 bg-background-tertiary rounded-lg" />,
});

const statusConfig = {
  ON_DUTY: { label: "On Duty", variant: "success" },
  AVAILABLE: { label: "Available", variant: "info" },
  MAINTENANCE: { label: "Maintenance", variant: "warning" },
  RESERVED: { label: "Reserved", variant: "secondary" },
} as const;

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-foreground-muted">{label}</p>
      <p className="text-foreground">{value ?? <span className="text-foreground-muted">Not recorded</span>}</p>
    </div>
  );
}

/**
 * Read-only view of one fleet vehicle. Allocation, return, maintenance and
 * readings are recorded from the fleet register at /vehicles.
 */
export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: vehicle, isPending, isError, error, refetch } = useVehicle(params.id);

  if (isPending) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96 gap-3 text-foreground-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading vehicle…
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiClientError && error.code === 404;
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-2">
          <AlertTriangle className="h-12 w-12 text-warning mb-2" />
          <h2 className="text-xl font-bold text-foreground">
            {notFound ? "Vehicle Not Found" : "Vehicle could not be loaded"}
          </h2>
          <p className="text-foreground-muted mb-2">
            {notFound ? "The requested vehicle does not exist." : error.message}
          </p>
          <div className="flex gap-2">
            {!notFound && (
              <Button variant="secondary" onClick={() => refetch()}>
                Try again
              </Button>
            )}
            <Link href="/vehicles">
              <Button>Back to Fleet</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[vehicle.status];
  const hasPosition = vehicle.gpsLatitude !== null && vehicle.gpsLongitude !== null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground font-mono">{vehicle.registrationNumber}</h1>
              <Badge variant={status.variant as any}>{status.label}</Badge>
            </div>
            <p className="text-foreground-muted">
              {vehicle.type} · {vehicle.make}
              {vehicle.stationName && ` · ${vehicle.stationName}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Current Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Driver"
                  value={
                    vehicle.currentDriver ? (
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4 text-foreground-muted" />
                        {vehicle.currentDriver}
                      </span>
                    ) : null
                  }
                />
                <Field label="Duty" value={vehicle.currentDuty} />
                {vehicle.status === "RESERVED" && <Field label="Reserved For" value={vehicle.reservedFor} />}
                {vehicle.status === "MAINTENANCE" && (
                  <Field
                    label="Maintenance Note"
                    value={
                      vehicle.maintenanceNote ? (
                        <span className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-warning" />
                          {vehicle.maintenanceNote}
                        </span>
                      ) : null
                    }
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Last Reported Position
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasPosition ? (
                  <InteractiveMap
                    markers={[
                      {
                        id: vehicle.id,
                        lat: vehicle.gpsLatitude!,
                        lng: vehicle.gpsLongitude!,
                        title: vehicle.registrationNumber,
                        description: vehicle.currentDuty ?? vehicle.status,
                        type: "vehicle",
                      },
                    ]}
                    center={[vehicle.gpsLatitude!, vehicle.gpsLongitude!]}
                    zoom={14}
                    height="240px"
                  />
                ) : (
                  <p className="text-foreground-muted">No position has been recorded for this vehicle.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" />
                  Readings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-foreground-muted flex items-center gap-2">
                    <Fuel className="h-4 w-4" /> Fuel
                  </p>
                  <div className="mt-1 h-2 rounded-full bg-background-tertiary overflow-hidden">
                    <div
                      className={`h-full ${vehicle.fuelLevel < 25 ? "bg-error" : vehicle.fuelLevel < 50 ? "bg-warning" : "bg-success"}`}
                      style={{ width: `${vehicle.fuelLevel}%` }}
                    />
                  </div>
                  <p className="text-foreground text-sm mt-1">{vehicle.fuelLevel}%</p>
                </div>
                <Field label="Odometer" value={`${vehicle.odometerReading.toLocaleString("en-IN")} km`} />
                <Field label="Last Service" value={formatDate(vehicle.lastService)} />
                <Field label="Record Updated" value={formatDateTime(vehicle.updatedAt)} />
              </CardContent>
            </Card>
            <Link href="/vehicles" className="block">
              <Button variant="secondary" className="w-full">
                Manage in Fleet Register
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
