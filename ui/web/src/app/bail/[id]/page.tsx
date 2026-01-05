"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Scale,
  User,
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
  DollarSign,
  Users,
  MapPin,
  Shield,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";

// Mock bail application data
const mockBailApplications = [
  {
    id: "bail-001",
    applicationNumber: "BAIL-2024-00089",
    type: "REGULAR",
    status: "PENDING",
    applicantName: "Rajesh Kumar Singh",
    applicantAge: 35,
    applicantAddress: "45, 2nd Cross, Marathahalli, Bangalore",
    caseNumber: "CASE-2024-00156",
    firNumber: "KOR/2024/00089",
    charges: ["IPC 392", "IPC 397"],
    court: "Sessions Court, Koramangala",
    judgeName: "Hon. Justice A.K. Sharma",
    applicationDate: "2024-01-25",
    hearingDate: "2024-02-05",
    lawyerName: "Adv. Suresh Menon",
    lawyerContact: "+91 98450 12345",
    sureties: [
      { name: "Mohan Kumar", relation: "Brother", address: "12, 3rd Main, Indiranagar", phone: "+91 98765 43210" },
      { name: "Priya Singh", relation: "Sister", address: "78, 5th Cross, HSR Layout", phone: "+91 87654 32109" },
    ],
    proposedBailAmount: 50000,
    conditions: [],
    prosecutionComments: "Prosecution opposes bail citing flight risk and severity of charges.",
    timeline: [
      { date: "2024-01-25", event: "Application filed", details: "Regular bail application submitted" },
      { date: "2024-01-26", event: "Notice issued", details: "Notice sent to prosecution" },
      { date: "2024-01-28", event: "Prosecution response", details: "Opposition filed by prosecution" },
    ],
  },
  {
    id: "bail-002",
    applicationNumber: "BAIL-2024-00088",
    type: "ANTICIPATORY",
    status: "GRANTED",
    applicantName: "Vijay Malhotra",
    applicantAge: 42,
    applicantAddress: "123, Palm Avenue, Whitefield, Bangalore",
    caseNumber: "CASE-2024-00150",
    firNumber: "KOR/2024/00080",
    charges: ["IPC 304A"],
    court: "Sessions Court, Koramangala",
    judgeName: "Hon. Justice P.S. Reddy",
    applicationDate: "2024-01-20",
    hearingDate: "2024-01-28",
    orderDate: "2024-01-28",
    lawyerName: "Adv. Meera Nair",
    lawyerContact: "+91 98450 54321",
    sureties: [
      { name: "Anand Malhotra", relation: "Father", address: "123, Palm Avenue, Whitefield", phone: "+91 98765 11111" },
    ],
    proposedBailAmount: 100000,
    grantedBailAmount: 100000,
    conditions: [
      "Shall not leave jurisdiction without court permission",
      "Shall surrender passport",
      "Shall report to PS Koramangala every Monday",
      "Shall not contact witnesses directly",
    ],
    orderSummary: "Anticipatory bail granted subject to conditions. Applicant to furnish bond of Rs. 1,00,000.",
    timeline: [
      { date: "2024-01-20", event: "Application filed", details: "Anticipatory bail application submitted" },
      { date: "2024-01-22", event: "Hearing scheduled", details: "Matter listed for 28th January" },
      { date: "2024-01-28", event: "Bail granted", details: "Court granted anticipatory bail with conditions" },
    ],
  },
  {
    id: "bail-003",
    applicationNumber: "BAIL-2024-00087",
    type: "REGULAR",
    status: "REJECTED",
    applicantName: "Mohammed Farooq",
    applicantAge: 38,
    applicantAddress: "Unknown",
    caseNumber: "CASE-2024-00135",
    firNumber: "KOR/2024/00060",
    charges: ["IPC 420", "IPC 406"],
    court: "Sessions Court, Koramangala",
    judgeName: "Hon. Justice A.K. Sharma",
    applicationDate: "2024-01-15",
    hearingDate: "2024-01-24",
    orderDate: "2024-01-24",
    lawyerName: "Adv. Arun Joshi",
    lawyerContact: "+91 98450 67890",
    sureties: [],
    proposedBailAmount: 200000,
    rejectionReason: "Court found accused to be flight risk. Multiple cases pending. No proper sureties presented.",
    timeline: [
      { date: "2024-01-15", event: "Application filed", details: "Regular bail application submitted" },
      { date: "2024-01-18", event: "Prosecution response", details: "Strong opposition from prosecution" },
      { date: "2024-01-24", event: "Bail rejected", details: "Application dismissed citing flight risk" },
    ],
  },
];

const bailTypes = {
  REGULAR: { label: "Regular Bail", color: "info" },
  ANTICIPATORY: { label: "Anticipatory Bail", color: "warning" },
  INTERIM: { label: "Interim Bail", color: "secondary" },
  DEFAULT: { label: "Default Bail", color: "muted" },
};

const statusConfig = {
  PENDING: { label: "Pending", color: "warning", icon: Clock },
  GRANTED: { label: "Granted", color: "success", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "error", icon: XCircle },
  CANCELLED: { label: "Cancelled", color: "muted", icon: XCircle },
};

export default function BailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const application = mockBailApplications.find((b) => b.id === params.id);

  const canEdit = user && hasMinimumRole(user.role, "SI");

  if (!application) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertTriangle className="h-12 w-12 text-warning mb-4" />
          <h2 className="text-xl font-bold text-foreground">Application Not Found</h2>
          <p className="text-foreground-muted mb-4">The requested bail application does not exist.</p>
          <Link href="/bail">
            <Button>Back to Bail Applications</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const typeConfig = bailTypes[application.type as keyof typeof bailTypes];
  const status = statusConfig[application.status as keyof typeof statusConfig];
  const StatusIcon = status.icon;

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
                <h1 className="text-2xl font-bold text-foreground">{application.applicationNumber}</h1>
                <Badge variant={typeConfig.color as any}>{typeConfig.label}</Badge>
                <Badge variant={status.color as any}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              <p className="text-foreground-muted">Applicant: {application.applicantName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            {canEdit && application.status === "PENDING" && (
              <Button onClick={() => toast.info("Update Application", "Application update form opening...")}>
                <Edit className="h-4 w-4 mr-2" />
                Update Status
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applicant Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Applicant Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  <div className="h-24 w-24 bg-background-tertiary rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="h-10 w-10 text-foreground-muted" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    <div>
                      <p className="text-sm text-foreground-muted">Name</p>
                      <p className="text-foreground font-medium">{application.applicantName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-muted">Age</p>
                      <p className="text-foreground">{application.applicantAge} years</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-foreground-muted">Address</p>
                      <p className="text-foreground">{application.applicantAddress}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Charges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {application.charges.map((charge, index) => (
                    <span key={index} className="px-3 py-1 text-sm rounded-full bg-error/10 text-error">
                      {charge}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Linked Case */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Case Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-background-tertiary rounded-lg">
                    <p className="text-sm text-foreground-muted">FIR Number</p>
                    <Link href={`/fir/${application.firNumber}`} className="text-accent hover:underline font-mono">
                      {application.firNumber}
                    </Link>
                  </div>
                  <div className="p-4 bg-background-tertiary rounded-lg">
                    <p className="text-sm text-foreground-muted">Case Number</p>
                    <Link href={`/cases/${application.caseNumber}`} className="text-accent hover:underline font-mono">
                      {application.caseNumber}
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sureties */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Sureties ({application.sureties.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {application.sureties.length > 0 ? (
                  <div className="space-y-4">
                    {application.sureties.map((surety, index) => (
                      <div key={index} className="p-4 bg-background-tertiary rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">{surety.name}</span>
                          <Badge variant="secondary">{surety.relation}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-foreground-muted">
                            <MapPin className="h-4 w-4" />
                            {surety.address}
                          </div>
                          <div className="flex items-center gap-2 text-foreground-muted">
                            <Phone className="h-4 w-4" />
                            {surety.phone}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-foreground-muted py-4">No sureties provided</p>
                )}
              </CardContent>
            </Card>

            {/* Bail Conditions (if granted) */}
            {application.status === "GRANTED" && application.conditions && application.conditions.length > 0 && (
              <Card className="border-success/30 bg-success/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-5 w-5" />
                    Bail Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {application.conditions.map((condition, index) => (
                      <li key={index} className="flex items-start gap-2 text-foreground">
                        <div className="h-2 w-2 mt-2 rounded-full bg-success flex-shrink-0"></div>
                        {condition}
                      </li>
                    ))}
                  </ul>
                  {application.orderSummary && (
                    <div className="mt-4 pt-4 border-t border-success/20">
                      <p className="text-sm text-foreground-muted">Order Summary:</p>
                      <p className="text-foreground">{application.orderSummary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Rejection Reason (if rejected) */}
            {application.status === "REJECTED" && application.rejectionReason && (
              <Card className="border-error/30 bg-error/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-error">
                    <XCircle className="h-5 w-5" />
                    Rejection Reason
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{application.rejectionReason}</p>
                </CardContent>
              </Card>
            )}

            {/* Prosecution Comments */}
            {application.prosecutionComments && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    Prosecution Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground-muted">{application.prosecutionComments}</p>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Application Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border"></div>
                  <div className="space-y-6">
                    {application.timeline.map((entry, index) => (
                      <div key={index} className="relative pl-8">
                        <div className="absolute left-0 top-0 h-4 w-4 rounded-full bg-accent border-2 border-background"></div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{entry.event}</span>
                            <span className="text-xs text-foreground-muted">{entry.date}</span>
                          </div>
                          <p className="text-sm text-foreground-muted">{entry.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
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
                  <p className="text-sm text-foreground-muted">Court</p>
                  <p className="text-foreground font-medium">{application.court}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted">Judge</p>
                  <p className="text-foreground">{application.judgeName}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted">Application Date</p>
                  <p className="text-foreground">{application.applicationDate}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted">Hearing Date</p>
                  <p className="text-foreground">{application.hearingDate}</p>
                </div>
                {application.orderDate && (
                  <div>
                    <p className="text-sm text-foreground-muted">Order Date</p>
                    <p className="text-foreground">{application.orderDate}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bail Amount */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Bail Amount
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-foreground-muted">Proposed Amount</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{application.proposedBailAmount.toLocaleString()}
                  </p>
                </div>
                {application.grantedBailAmount && (
                  <div>
                    <p className="text-sm text-foreground-muted">Granted Amount</p>
                    <p className="text-2xl font-bold text-success">
                      ₹{application.grantedBailAmount.toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lawyer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Legal Counsel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium text-foreground">{application.lawyerName}</p>
                <div className="flex items-center gap-2 text-foreground-muted">
                  <Phone className="h-4 w-4" />
                  {application.lawyerContact}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {application.status === "PENDING" && (
              <Card className="border-warning/30 bg-warning/5">
                <CardHeader>
                  <CardTitle className="text-warning">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" onClick={() => toast.info("Schedule Hearing", "Hearing scheduler opening...")}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Hearing
                  </Button>
                  <Button variant="secondary" className="w-full" onClick={() => toast.info("Add Comment", "Comment form opening...")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Add IO Comment
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
