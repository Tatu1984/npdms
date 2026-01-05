"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Calendar,
  Share2,
  Printer,
  Shield,
  Radio,
  Volume2,
  Image,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";

// Mock alerts data
const mockAlerts: Record<string, {
  id: string;
  type: string;
  scope: string;
  title: string;
  description: string;
  issuedAt: string;
  expiresAt: string;
  issuedBy: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  priority: number;
  image?: boolean;
  affectedAreas?: string[];
  relatedFIRs?: string[];
  acknowledgments?: { station: string; officer: string; time: string }[];
}> = {
  "alert-001": {
    id: "alert-001",
    type: "FLASH",
    scope: "DISTRICT",
    title: "Armed suspects spotted near MG Road",
    description:
      "Two armed suspects spotted near MG Road Metro Station. Wearing dark clothes, one has red motorcycle. Approach with caution. Suspects are believed to be connected to recent bank robbery. Height approximately 5'8\" and 5'10\". One suspect has visible tattoo on left arm.",
    issuedAt: "2024-01-18T14:30:00Z",
    expiresAt: "2024-01-18T20:30:00Z",
    issuedBy: "Control Room",
    acknowledged: false,
    priority: 1,
    affectedAreas: ["MG Road", "Trinity Circle", "Ulsoor", "Commercial Street"],
    acknowledgments: [
      { station: "Cubbon Park PS", officer: "SHO Kumar", time: "14:35" },
      { station: "Commercial Street PS", officer: "SHO Reddy", time: "14:38" },
    ],
  },
  "alert-002": {
    id: "alert-002",
    type: "URGENT",
    scope: "STATION",
    title: "VIP movement - Route diversion required",
    description:
      "Governor convoy movement expected on 80 Feet Road between 15:00-16:00 hours. Traffic diversion and security arrangements required. All personnel to be on high alert. Route: Raj Bhavan to Vidhana Soudha via 80 Feet Road.",
    issuedAt: "2024-01-18T12:00:00Z",
    expiresAt: "2024-01-18T16:00:00Z",
    issuedBy: "SP Office",
    acknowledged: true,
    acknowledgedBy: "SHO Koramangala",
    acknowledgedAt: "2024-01-18T12:15:00Z",
    priority: 2,
    affectedAreas: ["80 Feet Road", "Raj Bhavan Road"],
  },
  "alert-003": {
    id: "alert-003",
    type: "BOLO",
    scope: "STATE",
    title: "BOLO: Wanted suspect in murder case",
    description:
      "Rajan Kumar alias Raju, 32M, wanted in connection with murder case CC/2024/0045. Height: 5'8\", Dark complexion, Scar on left cheek. Last seen in Jayanagar area. Consider armed and dangerous. Known associates in Mysore and Tumkur districts.",
    issuedAt: "2024-01-17T08:00:00Z",
    expiresAt: "2024-01-24T23:59:59Z",
    issuedBy: "State Crime Branch",
    acknowledged: true,
    priority: 1,
    image: true,
    relatedFIRs: ["BLR/2024/00234", "MYS/2024/00089"],
  },
};

function getAlertBadgeVariant(type: string) {
  const variants: Record<string, string> = {
    FLASH: "error",
    URGENT: "warning",
    BOLO: "info",
    NOTICE: "secondary",
  };
  return variants[type] || "secondary";
}

function getAlertIcon(type: string) {
  switch (type) {
    case "FLASH":
      return <Radio className="h-5 w-5" />;
    case "URGENT":
      return <AlertTriangle className="h-5 w-5" />;
    case "BOLO":
      return <Shield className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
}

export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [acknowledgeNote, setAcknowledgeNote] = useState("");

  const alertId = params.id as string;
  const alert = mockAlerts[alertId] || mockAlerts["alert-001"];

  const canAcknowledge = user && hasMinimumRole(user.role, "SI");
  const isExpired = new Date(alert.expiresAt) < new Date();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/alerts">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Alerts
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="ghost" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Alert Header Card */}
        <Card className={`border-l-4 ${
          alert.type === "FLASH" ? "border-l-error bg-error/5" :
          alert.type === "URGENT" ? "border-l-warning bg-warning/5" :
          alert.type === "BOLO" ? "border-l-info bg-info/5" :
          "border-l-border"
        }`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                alert.type === "FLASH" ? "bg-error/20 text-error" :
                alert.type === "URGENT" ? "bg-warning/20 text-warning" :
                alert.type === "BOLO" ? "bg-info/20 text-info" :
                "bg-background-tertiary text-foreground"
              }`}>
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant={getAlertBadgeVariant(alert.type) as any}>
                    {alert.type}
                  </Badge>
                  <Badge variant="secondary">{alert.scope}</Badge>
                  {isExpired && (
                    <Badge variant="closed">EXPIRED</Badge>
                  )}
                  {alert.acknowledged && !isExpired && (
                    <Badge variant="success">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Acknowledged
                    </Badge>
                  )}
                </div>
                <h1 className="text-xl font-bold text-foreground mb-2">{alert.title}</h1>
                <div className="flex items-center gap-4 text-sm text-foreground-muted">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {alert.issuedBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(alert.issuedAt).toLocaleString("en-IN")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Expires: {new Date(alert.expiresAt).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{alert.description}</p>

                {alert.image && (
                  <div className="mt-4 p-4 rounded-lg bg-background-tertiary flex items-center gap-4">
                    <div className="h-24 w-24 bg-background rounded-lg flex items-center justify-center">
                      <Image className="h-8 w-8 text-foreground-muted" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Suspect Photo Attached</p>
                      <p className="text-sm text-foreground-muted">Click to view full image</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Affected Areas */}
            {alert.affectedAreas && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Affected Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {alert.affectedAreas.map((area, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related FIRs */}
            {alert.relatedFIRs && (
              <Card>
                <CardHeader>
                  <CardTitle>Related FIRs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {alert.relatedFIRs.map((fir, index) => (
                      <Link key={index} href={`/fir/${fir}`} className="block">
                        <div className="p-3 rounded-md bg-background-tertiary hover:bg-accent/10 transition-colors">
                          <span className="font-mono text-accent">{fir}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Acknowledge Form */}
            {!alert.acknowledged && canAcknowledge && !isExpired && (
              <Card className="border-accent/30">
                <CardHeader>
                  <CardTitle>Acknowledge Alert</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    label="Acknowledgment Note (Optional)"
                    placeholder="Add any notes or actions taken..."
                    value={acknowledgeNote}
                    onChange={setAcknowledgeNote}
                    rows={3}
                  />
                  <Button className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Acknowledge Alert
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-foreground-muted">Priority</p>
                  <Badge variant={alert.priority === 1 ? "error" : alert.priority === 2 ? "warning" : "secondary"}>
                    Priority {alert.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted">Issued</p>
                  <p className="text-foreground">
                    {new Date(alert.issuedAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted">Expires</p>
                  <p className={isExpired ? "text-error" : "text-foreground"}>
                    {new Date(alert.expiresAt).toLocaleString("en-IN")}
                  </p>
                </div>
                {alert.acknowledgedBy && (
                  <>
                    <div>
                      <p className="text-sm text-foreground-muted">Acknowledged By</p>
                      <p className="text-foreground">{alert.acknowledgedBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Acknowledged At</p>
                      <p className="text-foreground">
                        {new Date(alert.acknowledgedAt!).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Acknowledgments from Stations */}
            {alert.acknowledgments && (
              <Card>
                <CardHeader>
                  <CardTitle>Station Acknowledgments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alert.acknowledgments.map((ack, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-md bg-background-tertiary">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{ack.station}</p>
                          <p className="text-xs text-foreground-muted">{ack.officer} at {ack.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="secondary" className="w-full justify-start">
                  <Volume2 className="h-4 w-4 mr-2" />
                  Play Audio Broadcast
                </Button>
                <Button variant="secondary" className="w-full justify-start">
                  <Share2 className="h-4 w-4 mr-2" />
                  Forward to Station
                </Button>
                {alert.type === "BOLO" && (
                  <Button variant="secondary" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Report Sighting
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
