"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  UserMinus,
  Briefcase,
  Download,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LegacySelect as Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/Avatar";
import { useAuthStore, hasMinimumRole, getRoleDisplayName } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { usePersonnel, useDeletePersonnel, useAssignDuty } from "@/hooks/use-personnel";
import type { Personnel, PersonnelRank, PersonnelStatus } from "@/lib/api/personnel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DutyAssignmentDialog } from "@/components/ui/DutyAssignmentDialog";
import { exportToCSV, exportConfigs } from "@/lib/utils/export";

const PAGE_SIZE = 20;
/** The duty board reads on-duty officers in one request; beyond this it says so. */
const DUTY_BOARD_LIMIT = 200;

const rankOptions = [
  { value: "", label: "All Ranks" },
  { value: "CONSTABLE", label: "Constable" },
  { value: "HEAD_CONSTABLE", label: "Head Constable" },
  { value: "ASI", label: "ASI" },
  { value: "SI", label: "SI" },
  { value: "INSPECTOR", label: "Inspector" },
  { value: "SHO", label: "SHO" },
  { value: "DSP", label: "DSP" },
  { value: "SP", label: "SP" },
];

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "ON_DUTY", label: "On Duty" },
  { value: "OFF_DUTY", label: "Off Duty" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "TRAINING", label: "Training" },
  { value: "SUSPENDED", label: "Suspended" },
];

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

/** Groups on-duty officers by the shift recorded on their record. Nothing is inferred from free text. */
function groupByShift(officers: Personnel[]) {
  const groups = new Map<string, Personnel[]>();
  for (const officer of officers) {
    const key = officer.shift || "No shift recorded";
    groups.set(key, [...(groups.get(key) ?? []), officer]);
  }
  return [...groups.entries()].map(([shift, list]) => ({ shift, officers: list }));
}

function StatValue({ value, isError }: { value: number | undefined; isError: boolean }) {
  if (isError) return <>—</>;
  if (value === undefined) return <Loader2 className="h-5 w-5 animate-spin" />;
  return <>{value}</>;
}

export default function PersonnelPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState("roster");
  const [searchQuery, setSearchQuery] = useState("");
  const search = useDeferredValue(searchQuery.trim());
  const [rankFilter, setRankFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [personnelToDelete, setPersonnelToDelete] = useState<Personnel | null>(null);
  const [personnelForDuty, setPersonnelForDuty] = useState<Personnel | null>(null);

  // Mirrors the API: create, update and assign-duty need SHO; delete needs DSP.
  const canManage = user && hasMinimumRole(user.role, "SHO");
  const canDelete = user && hasMinimumRole(user.role, "DSP");

  const roster = usePersonnel({
    page,
    pageSize: PAGE_SIZE,
    rank: (rankFilter || undefined) as PersonnelRank | undefined,
    status: (statusFilter || undefined) as PersonnelStatus | undefined,
    search: search || undefined,
  });

  // Counts come from the server's totals, not from the page of rows loaded.
  const totalCount = usePersonnel({ pageSize: 1 });
  const onDutyCount = usePersonnel({ pageSize: 1, status: "ON_DUTY" });
  const onLeaveCount = usePersonnel({ pageSize: 1, status: "ON_LEAVE" });
  const offDutyCount = usePersonnel({ pageSize: 1, status: "OFF_DUTY" });

  const dutyBoard = usePersonnel({ pageSize: DUTY_BOARD_LIMIT, status: "ON_DUTY" });

  const deletePersonnelMutation = useDeletePersonnel();
  const assignDutyMutation = useAssignDuty();

  const personnel = roster.data?.data ?? [];
  const totalPages = roster.data?.totalPages ?? 0;
  const shifts = groupByShift(dutyBoard.data?.data ?? []);

  const handleDeleteConfirm = async () => {
    if (!personnelToDelete) return;
    try {
      await deletePersonnelMutation.mutateAsync(personnelToDelete.id);
      addToast({
        type: "success",
        title: "Personnel Record Deleted",
        message: `${personnelToDelete.name}'s service record has been removed`,
      });
      setPersonnelToDelete(null);
    } catch (error) {
      addToast({
        type: "error",
        title: "Delete Failed",
        message: error instanceof Error ? error.message : "The server rejected the request",
      });
    }
  };

  const handleDutyAssignment = async (duty: string, shift: string) => {
    if (!personnelForDuty) return;
    try {
      await assignDutyMutation.mutateAsync({ id: personnelForDuty.id, duty, shift });
      addToast({
        type: "success",
        title: "Duty Assigned",
        message: `${personnelForDuty.name} assigned to ${duty} (${shift})`,
      });
      setPersonnelForDuty(null);
    } catch (error) {
      addToast({
        type: "error",
        title: "Assignment Failed",
        message: error instanceof Error ? error.message : "The server rejected the request",
      });
    }
  };

  const statCards = [
    { label: "Total Strength", query: totalCount, icon: Users, valueClass: "text-foreground", iconClass: "text-accent" },
    { label: "On Duty", query: onDutyCount, icon: UserCheck, valueClass: "text-success", iconClass: "text-success" },
    { label: "On Leave", query: onLeaveCount, icon: Calendar, valueClass: "text-warning", iconClass: "text-warning" },
    { label: "Off Duty", query: offDutyCount, icon: UserMinus, valueClass: "text-foreground-muted", iconClass: "text-foreground-muted" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Personnel Management</h1>
            <p className="text-foreground-muted">Service records, duty assignments and current status of officers</p>
          </div>
          {canManage && (
            <Link href="/personnel/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Personnel
              </Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(({ label, query, icon: Icon, valueClass, iconClass }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground-muted">{label}</p>
                    <p className={`text-2xl font-bold ${valueClass}`}>
                      <StatValue value={query.data?.total} isError={query.isError} />
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 opacity-50 ${iconClass}`} />
                </div>
              </CardContent>
            </Card>
          ))}
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
              On Duty Now
            </TabsTrigger>
          </TabsList>

          {/* Personnel Roster Tab */}
          <TabsContent value="roster" className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by name, badge number, or phone..."
                      value={searchQuery}
                      onChange={(v: string) => {
                        setSearchQuery(v);
                        setPage(1);
                      }}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <Select
                    options={rankOptions}
                    value={rankFilter}
                    onChange={(v: string) => {
                      setRankFilter(v);
                      setPage(1);
                    }}
                    className="w-full md:w-40"
                  />
                  <Select
                    options={statusOptions}
                    value={statusFilter}
                    onChange={(v: string) => {
                      setStatusFilter(v);
                      setPage(1);
                    }}
                    className="w-full md:w-40"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      exportToCSV(personnel, "personnel", exportConfigs.personnel);
                      addToast({
                        type: "success",
                        title: "Export ready",
                        message: `${personnel.length} rows on this page exported to CSV`,
                      });
                    }}
                    disabled={roster.isPending || personnel.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Page
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Officer</TableHead>
                      <TableHead>Badge Number</TableHead>
                      <TableHead>Rank</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Current Duty</TableHead>
                      <TableHead>Station</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roster.isPending ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent mb-2" />
                          <p className="text-foreground-muted">Loading personnel…</p>
                        </TableCell>
                      </TableRow>
                    ) : roster.isError ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <UserX className="h-12 w-12 mx-auto text-error mb-2" />
                          <p className="text-foreground font-medium">Personnel could not be loaded</p>
                          <p className="text-foreground-muted mb-4">{roster.error.message}</p>
                          <Button variant="secondary" onClick={() => roster.refetch()}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try again
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : personnel.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <Users className="h-12 w-12 mx-auto text-foreground-muted opacity-50 mb-2" />
                          <p className="text-foreground-muted">
                            {search || rankFilter || statusFilter
                              ? "No personnel match these filters"
                              : "No personnel records yet"}
                          </p>
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
                                {person.phone && <p className="text-xs text-foreground-muted">{person.phone}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-accent">{person.badgeNumber}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-foreground">{getRoleDisplayName(person.rank as any) ?? person.rank}</span>
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
                              <div>
                                <span className="text-foreground">{person.currentDuty}</span>
                                {person.shift && <p className="text-xs text-foreground-muted">{person.shift}</p>}
                              </div>
                            ) : (
                              <span className="text-foreground-muted">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-foreground">{person.stationName || "-"}</span>
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
                                  onClick={() => setPersonnelForDuty(person)}
                                >
                                  <Briefcase className="h-4 w-4" />
                                </Button>
                              )}
                              {canManage && (
                                <Link href={`/personnel/${person.id}?edit=true`}>
                                  <Button variant="ghost" size="sm" title="Edit">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  title="Delete"
                                  onClick={() => setPersonnelToDelete(person)}
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-foreground-muted">
                <span>
                  Page {page} of {totalPages} · {roster.data?.total} officers
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* On Duty Tab — grouped by the shift recorded when duty was assigned */}
          <TabsContent value="duty" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Officers currently on duty, by shift</h3>
              {dutyBoard.data && dutyBoard.data.total > dutyBoard.data.data.length && (
                <p className="text-sm text-warning">
                  Showing {dutyBoard.data.data.length} of {dutyBoard.data.total} on-duty officers
                </p>
              )}
            </div>

            {dutyBoard.isPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            ) : dutyBoard.isError ? (
              <Card className="border-error/30">
                <CardContent className="p-8 text-center space-y-3">
                  <p className="text-foreground font-medium">Duty board could not be loaded</p>
                  <p className="text-foreground-muted">{dutyBoard.error.message}</p>
                  <Button variant="secondary" onClick={() => dutyBoard.refetch()}>
                    Try again
                  </Button>
                </CardContent>
              </Card>
            ) : shifts.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-foreground-muted opacity-50 mb-2" />
                <p className="text-foreground-muted">No officers are on duty</p>
                <p className="text-sm text-foreground-muted mt-1">Assign duty from the roster to see officers here</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {shifts.map((group) => (
                  <Card key={group.shift}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        {group.shift}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {group.officers.map((officer) => (
                          <Link
                            key={officer.id}
                            href={`/personnel/${officer.id}`}
                            className="flex items-center gap-3 p-2 rounded-md bg-background-tertiary hover:bg-background-secondary"
                          >
                            <Avatar fallback={officer.name} size="sm" />
                            <div>
                              <span className="text-foreground">{officer.name}</span>
                              {officer.currentDuty && (
                                <p className="text-xs text-foreground-muted">{officer.currentDuty}</p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <ConfirmDialog
          isOpen={personnelToDelete !== null}
          onClose={() => setPersonnelToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Personnel Record"
          message={`Delete the service record for ${personnelToDelete?.name ?? "this officer"}? The user account is not affected. This cannot be undone.`}
          confirmText="Delete"
          type="danger"
        />

        <DutyAssignmentDialog
          isOpen={personnelForDuty !== null}
          onClose={() => setPersonnelForDuty(null)}
          onAssign={handleDutyAssignment}
          officerName={personnelForDuty?.name || "Officer"}
        />
      </div>
    </DashboardLayout>
  );
}
