"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  AlertTriangle,
  TrendingUp,
  Clock,
  TrafficCone,
  Shield,
  Users,
  BarChart3,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";

interface Hotspot {
  id: string;
  locationName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  totalChallans: number;
  challansLast30Days: number;
  mostCommonViolation: string | null;
  peakHours: string[];
  requiresSignal: boolean;
  requiresSpeedBreaker: boolean;
  requiresPatrol: boolean;
  recommendationNotes: string | null;
  updatedAt: string;
}

export default function HotspotsPage() {
  const { user } = useAuthStore();
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  const canManage = user && hasMinimumRole(user.role, "SHO");

  useEffect(() => {
    // Simulated data - in production, fetch from API
    const loadData = () => {
      setHotspots([
      {
        id: "1",
        locationName: "MG Road Junction",
        latitude: 12.9716,
        longitude: 77.5946,
        radiusMeters: 200,
        totalChallans: 2345,
        challansLast30Days: 187,
        mostCommonViolation: "Signal Violation",
        peakHours: ["08:00-10:00", "17:00-20:00"],
        requiresSignal: false,
        requiresSpeedBreaker: false,
        requiresPatrol: true,
        recommendationNotes: "Heavy traffic during peak hours. Recommend additional traffic police deployment.",
        updatedAt: "2024-01-08T10:00:00Z",
      },
      {
        id: "2",
        locationName: "Silk Board Junction",
        latitude: 12.9172,
        longitude: 77.6227,
        radiusMeters: 300,
        totalChallans: 1987,
        challansLast30Days: 156,
        mostCommonViolation: "Over Speeding",
        peakHours: ["07:00-10:00", "16:00-21:00"],
        requiresSignal: true,
        requiresSpeedBreaker: true,
        requiresPatrol: true,
        recommendationNotes: "Multiple accidents reported. Speed breakers and signal timing adjustments needed.",
        updatedAt: "2024-01-08T10:00:00Z",
      },
      {
        id: "3",
        locationName: "Electronic City Flyover",
        latitude: 12.8456,
        longitude: 77.6603,
        radiusMeters: 250,
        totalChallans: 1654,
        challansLast30Days: 142,
        mostCommonViolation: "Lane Violation",
        peakHours: ["08:00-11:00", "17:00-20:00"],
        requiresSignal: false,
        requiresSpeedBreaker: false,
        requiresPatrol: true,
        recommendationNotes: "Lane discipline issues. Better lane markings recommended.",
        updatedAt: "2024-01-08T10:00:00Z",
      },
      {
        id: "4",
        locationName: "Marathahalli Bridge",
        latitude: 12.9591,
        longitude: 77.6971,
        radiusMeters: 200,
        totalChallans: 1432,
        challansLast30Days: 128,
        mostCommonViolation: "No Helmet",
        peakHours: ["07:00-09:00", "18:00-21:00"],
        requiresSignal: false,
        requiresSpeedBreaker: false,
        requiresPatrol: true,
        recommendationNotes: "High two-wheeler traffic. Regular helmet checks recommended.",
        updatedAt: "2024-01-08T10:00:00Z",
      },
      {
        id: "5",
        locationName: "Hebbal Flyover",
        latitude: 13.0358,
        longitude: 77.5970,
        radiusMeters: 350,
        totalChallans: 1289,
        challansLast30Days: 115,
        mostCommonViolation: "Over Speeding",
        peakHours: ["06:00-09:00", "17:00-22:00"],
        requiresSignal: false,
        requiresSpeedBreaker: true,
        requiresPatrol: true,
        recommendationNotes: "High-speed zone. Speed cameras and patrols recommended.",
        updatedAt: "2024-01-08T10:00:00Z",
      },
      {
        id: "6",
        locationName: "KR Puram Railway Crossing",
        latitude: 13.0012,
        longitude: 77.6893,
        radiusMeters: 150,
        totalChallans: 1156,
        challansLast30Days: 98,
        mostCommonViolation: "Signal Violation",
        peakHours: ["07:00-10:00", "16:00-19:00"],
        requiresSignal: true,
        requiresSpeedBreaker: false,
        requiresPatrol: true,
        recommendationNotes: "Railway crossing with frequent signal jumping. Boom barrier maintenance needed.",
        updatedAt: "2024-01-08T10:00:00Z",
      },
      ]);
      setIsLoading(false);
    };
    const timer = setTimeout(loadData, 0);
    return () => clearTimeout(timer);
  }, []);

  const getSeverityColor = (challans30Days: number) => {
    if (challans30Days > 150) return "error";
    if (challans30Days > 100) return "warning";
    return "info";
  };

  const totalStats = {
    totalHotspots: hotspots.length,
    totalChallans30Days: hotspots.reduce((sum, h) => sum + h.challansLast30Days, 0),
    needsPatrol: hotspots.filter((h) => h.requiresPatrol).length,
    needsInfrastructure: hotspots.filter((h) => h.requiresSignal || h.requiresSpeedBreaker).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Violation Hotspots</h1>
            <p className="text-foreground-muted">
              Identify and monitor high-violation areas for targeted enforcement
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-error/10">
                  <MapPin className="h-5 w-5 text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalStats.totalHotspots}</p>
                  <p className="text-xs text-foreground-muted">Active Hotspots</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalStats.totalChallans30Days}</p>
                  <p className="text-xs text-foreground-muted">Challans (30 days)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Users className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalStats.needsPatrol}</p>
                  <p className="text-xs text-foreground-muted">Needs Patrol</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <TrafficCone className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalStats.needsInfrastructure}</p>
                  <p className="text-xs text-foreground-muted">Infrastructure Needed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hotspots List */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
                </CardContent>
              </Card>
            ) : (
              hotspots.map((hotspot, index) => (
                <Card
                  key={hotspot.id}
                  className={`cursor-pointer transition-colors ${
                    selectedHotspot?.id === hotspot.id
                      ? "border-accent"
                      : "hover:border-accent/50"
                  }`}
                  onClick={() => setSelectedHotspot(hotspot)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          index < 3 ? "bg-error" : "bg-warning"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{hotspot.locationName}</span>
                            <Badge variant={getSeverityColor(hotspot.challansLast30Days) as any}>
                              {hotspot.challansLast30Days} / 30 days
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground-muted">
                            Most common: {hotspot.mostCommonViolation || "Various"}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {hotspot.requiresPatrol && (
                              <Badge variant="info">
                                <Users className="h-3 w-3 mr-1" />
                                Patrol
                              </Badge>
                            )}
                            {hotspot.requiresSignal && (
                              <Badge variant="warning">
                                <TrafficCone className="h-3 w-3 mr-1" />
                                Signal
                              </Badge>
                            )}
                            {hotspot.requiresSpeedBreaker && (
                              <Badge variant="muted">
                                <Shield className="h-3 w-3 mr-1" />
                                Speed Breaker
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">{hotspot.totalChallans.toLocaleString()}</p>
                        <p className="text-xs text-foreground-muted">Total Challans</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Detail Panel */}
          <div>
            {selectedHotspot ? (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Hotspot Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-foreground-muted">Location</p>
                    <p className="font-bold text-foreground">{selectedHotspot.locationName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-foreground-muted">Total Challans</p>
                      <p className="text-xl font-bold text-foreground">{selectedHotspot.totalChallans.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Last 30 Days</p>
                      <p className="text-xl font-bold text-error">{selectedHotspot.challansLast30Days}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-foreground-muted">Most Common Violation</p>
                    <p className="font-medium text-foreground">{selectedHotspot.mostCommonViolation || "Various"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-foreground-muted mb-2">Peak Hours</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedHotspot.peakHours.map((hours) => (
                        <Badge key={hours} variant="muted">
                          <Clock className="h-3 w-3 mr-1" />
                          {hours}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-foreground-muted mb-2">Requirements</p>
                    <div className="space-y-2">
                      <div className={`p-2 rounded flex items-center gap-2 ${selectedHotspot.requiresPatrol ? "bg-info/10 text-info" : "bg-background-tertiary text-foreground-muted"}`}>
                        <Users className="h-4 w-4" />
                        <span className="text-sm">Police Patrol</span>
                        {selectedHotspot.requiresPatrol && <Badge variant="info">Required</Badge>}
                      </div>
                      <div className={`p-2 rounded flex items-center gap-2 ${selectedHotspot.requiresSignal ? "bg-warning/10 text-warning" : "bg-background-tertiary text-foreground-muted"}`}>
                        <TrafficCone className="h-4 w-4" />
                        <span className="text-sm">Traffic Signal</span>
                        {selectedHotspot.requiresSignal && <Badge variant="warning">Required</Badge>}
                      </div>
                      <div className={`p-2 rounded flex items-center gap-2 ${selectedHotspot.requiresSpeedBreaker ? "bg-accent/10 text-accent" : "bg-background-tertiary text-foreground-muted"}`}>
                        <Shield className="h-4 w-4" />
                        <span className="text-sm">Speed Breaker</span>
                        {selectedHotspot.requiresSpeedBreaker && <Badge variant="accent">Required</Badge>}
                      </div>
                    </div>
                  </div>

                  {selectedHotspot.recommendationNotes && (
                    <div>
                      <p className="text-sm text-foreground-muted mb-1">Recommendations</p>
                      <p className="text-sm text-foreground p-3 rounded-lg bg-background-tertiary">
                        {selectedHotspot.recommendationNotes}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-foreground-muted">
                      Coordinates: {selectedHotspot.latitude.toFixed(4)}, {selectedHotspot.longitude.toFixed(4)}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      Radius: {selectedHotspot.radiusMeters}m
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <MapPin className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
                  <p className="text-foreground-muted">
                    Select a hotspot to view details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
