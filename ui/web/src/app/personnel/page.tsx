"use client";

import { useState } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  UserMinus,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Award,
  Download,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore, hasMinimumRole, getRoleDisplayName } from "@/stores/authStore";

const rankOptions = [
  { value: "", label: "All Ranks" },
  { value: "CONSTABLE", label: "Constable" },
  { value: "HEAD_CONSTABLE", label: "Head Constable" },
  { value: "ASI", label: "ASI" },
  { value: "SI", label: "SI" },
  { value: "INSPECTOR", label: "Inspector" },
  { value: "SHO", label: "SHO" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "ON_DUTY", label: "On Duty" },
  { value: "OFF_DUTY", label: "Off Duty" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "TRAINING", label: "Training" },
  { value: "SUSPENDED", label: "Suspended" },
];

// Mock personnel data
const mockPersonnel = [
  {
    id: "p-001",
    name: "Ramesh Kumar",
    badgeNumber: "KAR-C-4567",
    rank: "CONSTABLE",
    status: "ON_DUTY",
    phone: "+91 9876543210",
    email: "ramesh.kumar@karpolice.gov.in",
    stationId: "station-001",
    stationName: "Koramangala PS",
    joiningDate: "2019-05-15",
    assignedCases: 3,
    currentDuty: "Patrol - Beat A",
    shift: "Day (0600-1400)",
  },
  {
    id: "p-002",
    name: "Mohan Singh",
    badgeNumber: "KAR-HC-3456",
    rank: "HEAD_CONSTABLE",
    status: "ON_DUTY",
    phone: "+91 9876543211",
    email: "mohan.singh@karpolice.gov.in",
    stationId: "station-001",
    stationName: "Koramangala PS",
    joiningDate: "2015-08-20",
    assignedCases: 5,
    currentDuty: "Armoury In-Charge",
    shift: "Day (0600-1400)",
  },
  {
    id: "p-003",
    name: "Prakash Rao",
    badgeNumber: "KAR-ASI-2345",
    rank: "ASI",
    status: "ON_LEAVE",
    phone: "+91 9876543212",
    email: "prakash.rao@karpolice.gov.in",
    stationId: "station-001",
    stationName: "Koramangala PS",
    joiningDate: "2012-03-10",
    assignedCases: 4,
    currentDuty: null,
    leaveType: "Medical Leave",
    leaveUntil: "2024-01-25",
  },
  {
    id: "p-004",
    name: "Suresh Patil",
    badgeNumber: "KAR-SI-1234",
    rank: "SI",
    status: "ON_DUTY",
    phone: "+91 9876543213",
    email: "suresh.patil@karpolice.gov.in",
    stationId: "station-001",
    stationName: "Koramangala PS",
    joiningDate: "2010-07-01",
    assignedCases: 8,
    currentDuty: "Investigation - FIR/2024/00123",
    shift: "Day (0600-1400)",
  },
  {
    id: "p-005",
    name: "Anand Reddy",
    badgeNumber: "KAR-INS-0987",
    rank: "INSPECTOR",
    status: "OFF_DUTY",
    phone: "+91 9876543214",
    email: "anand.reddy@karpolice.gov.in",
    stationId: "station-001",
    stationName: "Koramangala PS",
    joiningDate: "2005-09-15",
    assignedCases: 2,
    currentDuty: null,
    shift: "Night (2200-0600)",
  },
  {
    id: "p-006",
    name: "Insp. Sharma",
    badgeNumber: "KAR-SHO-0876",
    rank: "SHO",
    status: "ON_DUTY",
    phone: "+91 9876543215",
    email: "sharma.sho@karpolice.gov.in",
    stationId: "station-001",
    stationName: "Koramangala PS",
    joiningDate: "2000-01-10",
    assignedCases: 0,
    currentDuty: "Station Command",
    shift: "Day (0800-1700)",
  },
];

// Mock duty roster
const mockDutyRoster = [
  { shift: "Day (0600-1400)", officers: ["Ramesh Kumar", "Mohan Singh", "Suresh Patil", "Insp. Sharma"] },
  { shift: "Evening (1400-2200)", officers: ["Vijay Raj", "Kiran S", "Deepak M"] },
  { shift: "Night (2200-0600)", officers: ["Anand Reddy", "Naveen K", "Prasad B"] },
];

// Mock attendance
const mockAttendance = {
  date: "2024-01-18",
  present: 12,
  onLeave: 3,
  absent: 1,
  total: 16,
};

function getStatusBadgeVariant(status: string) {
  const variants: Record<string, string> = {
    ON_DUTY: "success",
    OFF_DUTY: "secondary",
    ON_LEAVE: "warning",
    TRAINING: "info",
    SUSPENDED: "error",
  };
  return variants[status] || "secondary";
}

function getStatusIcon(status: string) {
  switch (status) {
    case "ON_DUTY":
      return <UserCheck className="h-4 w-4" />;
    case "OFF_DUTY":
      return <UserMinus className="h-4 w-4" />;
    case "ON_LEAVE":
      return <Calendar className="h-4 w-4" />;
    case "SUSPENDED":
      return <UserX className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
}

export default function PersonnelPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("roster");
  const [searchQuery, setSearchQuery] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const canManage = user && hasMinimumRole(user.role, "SHO");
  const canEdit = user && hasMinimumRole(user.role, "SP");

  const filteredPersonnel = mockPersonnel.filter((p) => {
    if (rankFilter && p.rank !== rankFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(search) ||
        p.badgeNumber.toLowerCase().includes(search) ||
        p.phone.includes(search)
      );
    }
    return true;
  });

  const stats = {
    total: mockPersonnel.length,
    onDuty: mockPersonnel.filter((p) => p.status === "ON_DUTY").length,
    onLeave: mockPersonnel.filter((p) => p.status === "ON_LEAVE").length,
    offDuty: mockPersonnel.filter((p) => p.status === "OFF_DUTY").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Personnel Management</h1>
            <p className="text-foreground-muted">
              Manage duty roster, attendance, and officer assignments
            </p>
          </div>
          {canEdit && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Personnel
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Total Strength</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">On Duty</p>
                  <p className="text-2xl font-bold text-success">{stats.onDuty}</p>
                </div>
                <UserCheck className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">On Leave</p>
                  <p className="text-2xl font-bold text-warning">{stats.onLeave}</p>
                </div>
                <Calendar className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground-muted">Off Duty</p>
                  <p className="text-2xl font-bold text-foreground-muted">{stats.offDuty}</p>
                </div>
                <UserMinus className="h-8 w-8 text-foreground-muted opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="roster">
              <Users className="h-4 w-4 mr-2" />
              Personnel Roster
            </TabsTrigger>
            <TabsTrigger value="duty">
              <Clock className="h-4 w-4 mr-2" />
              Duty Schedule
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <Calendar className="h-4 w-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="performance">
              <Award className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Personnel Roster Tab */}
          <TabsContent value="roster" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by name, badge number, or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <Select
                    options={rankOptions}
                    value={rankFilter}
                    onChange={setRankFilter}
                    className="w-full md:w-40"
                  />
                  <Select
                    options={statusOptions}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    className="w-full md:w-40"
                  />
                  <Button variant="secondary">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Personnel Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Officer</TableHead>
                      <TableHead>Badge Number</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Current Duty</TableHead>
                      <TableHead>Cases</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPersonnel.map((person) => (
                      <TableRow key={person.id} className="hover:bg-background-tertiary">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar fallback={person.name} size="sm" />
                            <div>
                              <p className="font-medium text-foreground">{person.name}</p>
                              <p className="text-xs text-foreground-muted">{person.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-accent">{person.badgeNumber}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground">{getRoleDisplayName(person.rank as any)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(person.status) as any}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(person.status)}
                              {person.status.replace(/_/g, " ")}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {person.currentDuty ? (
                            <span className="text-foreground">{person.currentDuty}</span>
                          ) : person.leaveType ? (
                            <span className="text-foreground-muted">
                              {person.leaveType} until {person.leaveUntil}
                            </span>
                          ) : (
                            <span className="text-foreground-muted">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-foreground">{person.assignedCases}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canManage && (
                              <Button variant="ghost" size="sm">
                                <Briefcase className="h-4 w-4" />
                              </Button>
                            )}
                            {canEdit && (
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Duty Schedule Tab */}
          <TabsContent value="duty" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Today&apos;s Duty Schedule</h3>
              {canManage && (
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Schedule
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockDutyRoster.map((shift, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {shift.shift}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {shift.officers.map((officer, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-2 rounded-md bg-background-tertiary"
                        >
                          <Avatar fallback={officer} size="sm" />
                          <span className="text-foreground">{officer}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Attendance - {new Date(mockAttendance.date).toLocaleDateString("en-IN")}
              </h3>
              <div className="flex gap-2">
                <Button variant="secondary">
                  <Calendar className="h-4 w-4 mr-2" />
                  Select Date
                </Button>
                <Button variant="secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-success">{mockAttendance.present}</p>
                  <p className="text-sm text-foreground-muted">Present</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-warning">{mockAttendance.onLeave}</p>
                  <p className="text-sm text-foreground-muted">On Leave</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-error">{mockAttendance.absent}</p>
                  <p className="text-sm text-foreground-muted">Absent</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-accent">{mockAttendance.total}</p>
                  <p className="text-sm text-foreground-muted">Total Strength</p>
                </CardContent>
              </Card>
            </div>

            {/* Attendance percentage visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-background-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success"
                    style={{ width: `${(mockAttendance.present / mockAttendance.total) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-foreground-muted mt-2">
                  {((mockAttendance.present / mockAttendance.total) * 100).toFixed(1)}% attendance rate
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Officer</TableHead>
                      <TableHead>Cases Assigned</TableHead>
                      <TableHead>Cases Closed</TableHead>
                      <TableHead>Closure Rate</TableHead>
                      <TableHead>Avg. Resolution Time</TableHead>
                      <TableHead>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPersonnel.slice(0, 5).map((person) => (
                      <TableRow key={person.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar fallback={person.name} size="sm" />
                            <span className="font-medium text-foreground">{person.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{Math.floor(Math.random() * 20) + 5}</TableCell>
                        <TableCell>{Math.floor(Math.random() * 15) + 3}</TableCell>
                        <TableCell>
                          <span className="text-success">{Math.floor(Math.random() * 30) + 60}%</span>
                        </TableCell>
                        <TableCell>{Math.floor(Math.random() * 20) + 10} days</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {"★".repeat(Math.floor(Math.random() * 2) + 3)}
                            {"☆".repeat(5 - Math.floor(Math.random() * 2) - 3)}
                          </div>
                        </TableCell>
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
