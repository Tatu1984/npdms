"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileWarning,
  User,
  MapPin,
  Calendar,
  Clock,
  Gavel,
  Eye,
  Edit,
  Printer,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Phone,
  Share2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";

// Mock warrant data - would come from store in production
const mockWarrants = [
  {
    id: "war-001",
    warrantNumber: "WAR-2024-00045",
    type: "ARREST",
    status: "ACTIVE",
    issuedFor: "Rajesh Kumar Singh",
    age: 35,
    gender: "Male",
    address: "45, 2nd Cross, Marathahalli, Bangalore",
    caseNumber: "CASE-2024-00156",
    firNumber: "KOR/2024/00089",
    issuedBy: "Sessions Court, Koramangala",
    judgeName: "Hon. Justice A.K. Sharma",
    issuedDate: "2024-01-20",
    validUntil: "2024-04-20",
    charges: ["IPC 392 - Robbery", "IPC 397 - Robbery with attempt to cause death"],
    lastKnownLocation: "Marathahalli, Bangalore",
    priority: "HIGH",
    description: "Wanted in connection with armed robbery at jewelry store. Consider armed and dangerous.",
    identifyingMarks: "Scar on left cheek, tattoo on right arm",
    executionHistory: [
      { date: "2024-01-25", action: "Search conducted at known address", officer: "SI Ramesh Kumar", result: "Not found" },
      { date: "2024-01-28", action: "Informant tip received", officer: "HC Mohan", result: "Under investigation" },
    ],
  },
  {
    id: "war-002",
    warrantNumber: "WAR-2024-00044",
    type: "SEARCH",
    status: "EXECUTED",
    issuedFor: "Premises at 45, MG Road",
    caseNumber: "CASE-2024-00148",
    firNumber: "KOR/2024/00075",
    issuedBy: "Magistrate Court, Koramangala",
    judgeName: "Hon. Magistrate S.P. Rao",
    issuedDate: "2024-01-18",
    validUntil: "2024-01-25",
    executedDate: "2024-01-19",
    executedBy: "Inspector Venkatesh",
    charges: ["NDPS Act 20 - Possession of controlled substances"],
    priority: "MEDIUM",
    description: "Search warrant for premises suspected of being used for drug trafficking.",
    searchScope: "All rooms, storage areas, and vehicles on premises",
    itemsSeized: ["500g suspected narcotics", "Cash Rs. 2,50,000", "Mobile phones (3)"],
  },
];

const warrantTypes = {
  ARREST: { label: "Arrest Warrant", color: "error" },
  SEARCH: { label: "Search Warrant", color: "warning" },
  SUMMONS: { label: "Summons", color: "info" },
  NBW: { label: "Non-Bailable Warrant", color: "error" },
};

const statusConfig = {
  ACTIVE: { label: "Active", color: "warning", icon: Clock },
  EXECUTED: { label: "Executed", color: "success", icon: CheckCircle },
  EXPIRED: { label: "Expired", color: "muted", icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "error", icon: XCircle },
};

export default function WarrantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const warrant = mockWarrants.find((w) => w.id === params.id);

  const canEdit = user && hasMinimumRole(user.role, "SI");
  const canExecute = user && hasMinimumRole(user.role, "SI");

  if (!warrant) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertTriangle className="h-12 w-12 text-warning mb-4" />
          <h2 className="text-xl font-bold text-foreground">Warrant Not Found</h2>
          <p className="text-foreground-muted mb-4">The requested warrant does not exist.</p>
          <Link href="/warrant">
            <Button>Back to Warrants</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const typeConfig = warrantTypes[warrant.type as keyof typeof warrantTypes];
  const status = statusConfig[warrant.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

  const handleMarkExecuted = () => {
    toast.success("Warrant Executed", `Warrant ${warrant.warrantNumber} has been marked as executed`);
  };

  const handlePrint = () => {
    toast.info("Print", "Opening print dialog...");
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{warrant.warrantNumber}</h1>
                <Badge variant={typeConfig.color as any}>{typeConfig.label}</Badge>
                <Badge variant={status.color as any}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
                {warrant.priority === "HIGH" && <Badge variant="error">High Priority</Badge>}
              </div>
              <p className="text-foreground-muted">Issued for: {warrant.issuedFor}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="secondary" onClick={() => toast.success("Shared", "Warrant shared to field officers")}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            {canEdit && warrant.status === "ACTIVE" && (
              <Button onClick={handleMarkExecuted}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Executed
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Warrant Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileWarning className="h-5 w-5" />
                  Warrant Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {warrant.type === "ARREST" && (
                    <div className="flex gap-6">
                      <div className="h-32 w-24 bg-background-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="h-12 w-12 text-foreground-muted" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">{warrant.issuedFor}</h3>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-sm text-foreground-muted">Age</p>
                            <p className="text-foreground">{warrant.age} years</p>
                          </div>
                          <div>
                            <p className="text-sm text-foreground-muted">Gender</p>
                            <p className="text-foreground">{warrant.gender}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm text-foreground-muted">Address</p>
                            <p className="text-foreground">{warrant.address}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm text-foreground-muted">Identifying Marks</p>
                            <p className="text-foreground">{warrant.identifyingMarks || "None recorded"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <h4 className="font-medium text-foreground mb-2">Description</h4>
                    <p className="text-foreground-muted">{warrant.description}</p>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="font-medium text-foreground mb-2">Charges</h4>
                    <div className="flex flex-wrap gap-2">
                      {warrant.charges.map((charge, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm rounded-full bg-error/10 text-error"
                        >
                          {charge}
                        </span>
                      ))}
                    </div>
                  </div>

                  {warrant.type === "SEARCH" && warrant.searchScope && (
                    <div className="pt-4 border-t border-border">
                      <h4 className="font-medium text-foreground mb-2">Search Scope</h4>
                      <p className="text-foreground-muted">{warrant.searchScope}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Linked Case */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Linked Case Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-background-tertiary rounded-lg">
                    <p className="text-sm text-foreground-muted">FIR Number</p>
                    <Link href={`/fir/${warrant.firNumber}`} className="text-accent hover:underline font-mono">
                      {warrant.firNumber}
                    </Link>
                  </div>
                  <div className="p-4 bg-background-tertiary rounded-lg">
                    <p className="text-sm text-foreground-muted">Case Number</p>
                    <Link href={`/cases/${warrant.caseNumber}`} className="text-accent hover:underline font-mono">
                      {warrant.caseNumber}
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Execution History */}
            {warrant.executionHistory && warrant.executionHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Execution History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {warrant.executionHistory.map((entry, index) => (
                      <div key={index} className="p-4 bg-background-tertiary rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">{entry.action}</span>
                          <span className="text-sm text-foreground-muted">{entry.date}</span>
                        </div>
                        <p className="text-sm text-foreground-muted">Officer: {entry.officer}</p>
                        <Badge variant="secondary" className="mt-2">{entry.result}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Seized Items (for executed search warrants) */}
            {warrant.status === "EXECUTED" && warrant.itemsSeized && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    Items Seized
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {warrant.itemsSeized.map((item, index) => (
                      <li key={index} className="flex items-center gap-2 text-foreground">
                        <div className="h-2 w-2 rounded-full bg-success"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Court Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Court Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-foreground-muted">Issued By</p>
                  <p className="text-foreground font-medium">{warrant.issuedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted">Judge</p>
                  <p className="text-foreground">{warrant.judgeName}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted">Issue Date</p>
                  <p className="text-foreground">{warrant.issuedDate}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted">Valid Until</p>
                  <p className={`font-medium ${new Date(warrant.validUntil) < new Date() ? "text-error" : "text-foreground"}`}>
                    {warrant.validUntil}
                  </p>
                </div>
                {warrant.executedDate && (
                  <div>
                    <p className="text-sm text-foreground-muted">Executed On</p>
                    <p className="text-success font-medium">{warrant.executedDate}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Last Known Location (for arrest warrants) */}
            {warrant.type === "ARREST" && warrant.lastKnownLocation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Last Known Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground mb-3">{warrant.lastKnownLocation}</p>
                  <div className="h-32 bg-background-tertiary rounded-lg flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-foreground-muted" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            {warrant.status === "ACTIVE" && (
              <Card className="border-warning/30 bg-warning/5">
                <CardHeader>
                  <CardTitle className="text-warning">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {canExecute && (
                    <Button className="w-full" onClick={handleMarkExecuted}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Executed
                    </Button>
                  )}
                  <Button variant="secondary" className="w-full" onClick={() => toast.info("Log Activity", "Activity log form opening...")}>
                    <Clock className="h-4 w-4 mr-2" />
                    Log Activity
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => toast.info("Request Extension", "Extension request form opening...")}>
                    Request Extension
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground-muted text-sm mb-2">For warrant-related queries:</p>
                <p className="font-medium text-foreground">{warrant.issuedBy}</p>
                <p className="text-foreground-muted">+91 80-2553-0000</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
