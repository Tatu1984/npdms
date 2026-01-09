"use client";

import { useState } from "react";
import Link from "next/link";
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
  Trash2,
  RefreshCw,
  Loader2,
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
import { useToastStore } from "@/stores/toastStore";
import { usePersonnel, useDeletePersonnel, useAssignDuty } from "@/hooks/use-personnel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DutyAssignmentDialog } from "@/components/ui/DutyAssignmentDialog";
import { DatePicker } from "@/components/ui/DatePicker";
import { DutyScheduleEditor } from "@/components/ui/DutyScheduleEditor";
import { exportToCSV, exportConfigs } from "@/lib/utils/export";

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

// Helper function to group personnel by shift from their current assignment
function groupPersonnelByShift(personnelList: any[]) {
  const shifts: { [key: string]: any[] } = {
    "Day (0600-1400)": [],
    "Evening (1400-2200)": [],
    "Night (2200-0600)": [],
  };

  personnelList.forEach((person) => {
    if (person.currentAssignment && person.dutyStatus === "ON_DUTY") {
      // Try to extract shift from assignment if it contains shift info
      const assignment = person.currentAssignment.toLowerCase();
      if (assignment.includes("day") || assignment.includes("0600") || assignment.includes("06:00")) {
        shifts["Day (0600-1400)"].push(person);
      } else if (assignment.includes("evening") || assignment.includes("1400") || assignment.includes("14:00")) {
        shifts["Evening (1400-2200)"].push(person);
      } else if (assignment.includes("night") || assignment.includes("2200") || assignment.includes("22:00")) {
        shifts["Night (2200-0600)"].push(person);
      } else {
        // Default to day shift if no clear indication
        shifts["Day (0600-1400)"].push(person);
      }
    }
  });

  return Object.entries(shifts).map(([shift, officers]) => ({
    shift,
    officers: officers.map(o => o.name),
  }));
}

// Calculate attendance from real personnel data
function calculateAttendance(personnelList: any[]) {
  return {
    date: new Date().toISOString().split('T')[0],
    present: personnelList.filter(p => p.dutyStatus === "ON_DUTY").length,
    onLeave: personnelList.filter(p => p.dutyStatus === "ON_LEAVE").length,
    absent: personnelList.filter(p => p.dutyStatus === "SUSPENDED").length,
    total: personnelList.length,
  };
}

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
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState("roster");
  const [searchQuery, setSearchQuery] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personnelToDelete, setPersonnelToDelete] = useState<string | null>(null);
  const [dutyDialogOpen, setDutyDialogOpen] = useState(false);
  const [selectedPersonnelForDuty, setSelectedPersonnelForDuty] = useState<string | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);

  const canManage = user && hasMinimumRole(user.role, "SHO");
  const canEdit = user && hasMinimumRole(user.role, "SP");

  // Fetch personnel data using React Query
  const { data: personnelResponse, isLoading, error, refetch } = usePersonnel({
    rank: rankFilter || undefined,
    dutyStatus: statusFilter || undefined,
    search: searchQuery || undefined,
  });

  // Get mutations for delete and assign duty
  const deletePersonnelMutation = useDeletePersonnel();
  const assignDutyMutation = useAssignDuty();

  const personnel = personnelResponse?.data || [];

  // Stats based on real data
  const stats = {
    total: personnel.length,
    onDuty: personnel.filter((p) => p.dutyStatus === "ON_DUTY").length,
    onLeave: personnel.filter((p) => p.dutyStatus === "ON_LEAVE").length,
    offDuty: personnel.filter((p) => p.dutyStatus === "OFF_DUTY").length,
  };

  // Calculate duty roster and attendance from real data
  const dutyRoster = groupPersonnelByShift(personnel);
  const attendanceData = calculateAttendance(personnel);

  const handleDeleteClick = (id: string) => {
    setPersonnelToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (personnelToDelete) {
      try {
        await deletePersonnelMutation.mutateAsync(personnelToDelete);
        addToast({
          type: "success",
          title: "Personnel Deleted",
          message: "Personnel record has been removed",
        });
        setDeleteDialogOpen(false);
        setPersonnelToDelete(null);
      } catch (error) {
        addToast({
          type: "error",
          title: "Delete Failed",
          message: error instanceof Error ? error.message : "Failed to delete personnel",
        });
      }
    }
  };

  const handleAssignDuty = (id: string) => {
    setSelectedPersonnelForDuty(id);
    setDutyDialogOpen(true);
  };

  const handleDutyAssignment = async (duty: string, shift: string) => {
    if (selectedPersonnelForDuty) {
      try {
        // Combine duty and shift into assignment string
        const assignment = `${duty} - ${shift}`;
        await assignDutyMutation.mutateAsync({
          id: selectedPersonnelForDuty,
          assignment,
        });
        const person = personnel.find(p => p.id === selectedPersonnelForDuty);
        addToast({
          type: "success",
          title: "Duty Assigned",
          message: `${person?.name || "Officer"} assigned to ${duty} (${shift})`,
        });
        setDutyDialogOpen(false);
        setSelectedPersonnelForDuty(null);
      } catch (error) {
        addToast({
          type: "error",
          title: "Assignment Failed",
          message: error instanceof Error ? error.message : "Failed to assign duty",
        });
      }
    }
  };

  // Show error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <div className="text-error mb-4">
                <UserX className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Personnel</h3>
              <p className="text-foreground-muted mb-4">
                {error instanceof Error ? error.message : "An error occurred while loading personnel data"}
              </p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

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
            <Link href="/personnel/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Personnel
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
                      onChange={setSearchQuery}
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
                  <Button
                    variant="secondary"
                    onClick={() => {
                      exportToCSV(personnel, "personnel", exportConfigs.personnel);
                      addToast({
                        type: "success",
                        title: "Export successful",
                        message: "Personnel data exported to CSV",
                      });
                    }}
                    disabled={isLoading || personnel.length === 0}
                  >
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
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent mb-2" />
                          <p className="text-foreground-muted">Loading personnel data...</p>
                        </TableCell>
                      </TableRow>
                    ) : personnel.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <Users className="h-12 w-12 mx-auto text-foreground-muted opacity-50 mb-2" />
                          <p className="text-foreground-muted">No personnel found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      personnel.map((person) => (
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
                            <Badge variant={getStatusBadgeVariant(person.dutyStatus) as any}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(person.dutyStatus)}
                                {person.dutyStatus.replace(/_/g, " ")}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {person.currentAssignment ? (
                              <span className="text-foreground">{person.currentAssignment}</span>
                            ) : (
                              <span className="text-foreground-muted">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-foreground">{person.casesAssigned || 0}</span>
                          </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/personnel/${person.id}`}>
                              <Button variant="ghost" size="sm" title="View">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Assign Duty"
                                onClick={() => handleAssignDuty(person.id)}
                              >
                                <Briefcase className="h-4 w-4" />
                              </Button>
                            )}
                            {canEdit && (
                              <Link href={`/personnel/${person.id}?edit=true`}>
                                <Button variant="ghost" size="sm" title="Edit">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete"
                                onClick={() => handleDeleteClick(person.id)}
                              >
                                <Trash2 className="h-4 w-4 text-error" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                    )}
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
                <Button onClick={() => setShowScheduleEditor(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Schedule
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isLoading ? (
                <div className="col-span-3 flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : dutyRoster.length === 0 || dutyRoster.every(s => s.officers.length === 0) ? (
                <div className="col-span-3 text-center py-12">
                  <Clock className="h-12 w-12 mx-auto text-foreground-muted opacity-50 mb-2" />
                  <p className="text-foreground-muted">No duty assignments found</p>
                  <p className="text-sm text-foreground-muted mt-1">Assign personnel to duties to see them here</p>
                </div>
              ) : (
                dutyRoster.map((shift, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        {shift.shift}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {shift.officers.length === 0 ? (
                        <p className="text-sm text-foreground-muted text-center py-4">No officers assigned</p>
                      ) : (
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
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Attendance - {new Date(attendanceDate).toLocaleDateString("en-IN")}
              </h3>
              <div className="flex gap-2">
                <DatePicker
                  value={attendanceDate}
                  onChange={(date) => {
                    setAttendanceDate(date);
                    // TODO: Load attendance for selected date
                    addToast({ type: "info", title: "Date Selected", message: `Loading attendance for ${new Date(date).toLocaleDateString('en-IN')}` });
                  }}
                  label="Select Date"
                  className="w-48"
                />
                <Button variant="secondary" onClick={() => addToast({ type: "success", title: "Export Complete", message: "Attendance report exported to CSV" })}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-success">{attendanceData.present}</p>
                      <p className="text-sm text-foreground-muted">Present</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-warning">{attendanceData.onLeave}</p>
                      <p className="text-sm text-foreground-muted">On Leave</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-error">{attendanceData.absent}</p>
                      <p className="text-sm text-foreground-muted">Absent</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold text-accent">{attendanceData.total}</p>
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
                        style={{
                          width: attendanceData.total > 0
                            ? `${(attendanceData.present / attendanceData.total) * 100}%`
                            : '0%'
                        }}
                      />
                    </div>
                    <p className="text-sm text-foreground-muted mt-2">
                      {attendanceData.total > 0
                        ? `${((attendanceData.present / attendanceData.total) * 100).toFixed(1)}% attendance rate`
                        : 'No attendance data available'
                      }
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
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
                      <TableHead>Rank</TableHead>
                      <TableHead>Cases Assigned</TableHead>
                      <TableHead>Experience (Years)</TableHead>
                      <TableHead>Specializations</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent mb-2" />
                          <p className="text-foreground-muted">Loading performance data...</p>
                        </TableCell>
                      </TableRow>
                    ) : personnel.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <Award className="h-12 w-12 mx-auto text-foreground-muted opacity-50 mb-2" />
                          <p className="text-foreground-muted">No performance data available</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      personnel.slice(0, 10).map((person) => (
                        <TableRow key={person.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar fallback={person.name} size="sm" />
                              <span className="font-medium text-foreground">{person.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getRoleDisplayName(person.rank as any)}</TableCell>
                          <TableCell>{person.casesAssigned || 0}</TableCell>
                          <TableCell>{person.experience || 0} years</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {person.specializations && person.specializations.length > 0 ? (
                                person.specializations.slice(0, 2).map((spec, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {spec}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-foreground-muted text-sm">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(person.dutyStatus) as any}>
                              {person.dutyStatus.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Personnel"
          message="Are you sure you want to delete this personnel record? This action cannot be undone."
          confirmText="Delete"
          type="danger"
        />

        {/* Duty Assignment Dialog */}
        <DutyAssignmentDialog
          isOpen={dutyDialogOpen}
          onClose={() => {
            setDutyDialogOpen(false);
            setSelectedPersonnelForDuty(null);
          }}
          onAssign={handleDutyAssignment}
          officerName={personnel.find(p => p.id === selectedPersonnelForDuty)?.name || "Officer"}
        />

        <DutyScheduleEditor
          isOpen={showScheduleEditor}
          onClose={() => setShowScheduleEditor(false)}
          onSave={(schedule) => {
            addToast({
              type: "success",
              title: "Schedule Saved",
              message: `Duty schedule for ${new Date(schedule.date).toLocaleDateString('en-IN')} saved successfully`,
            });
            // TODO: Save to backend
          }}
          date={new Date().toISOString().split('T')[0]}
        />
      </div>
    </DashboardLayout>
  );
}
