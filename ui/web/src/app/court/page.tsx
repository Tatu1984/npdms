"use client";

import { useState, useEffect } from "react";
import {
  Gavel,
  Calendar,
  Clock,
  FileText,
  Users,
  Building,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Bell,
  MapPin,
  Plus,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import { useCourtStore } from "@/stores/courtStore";
import { format, parseISO } from "date-fns";


const courts = [
  { name: "Sessions Court, Koramangala", cases: 45, pending: 12 },
  { name: "Magistrate Court, Koramangala", cases: 78, pending: 23 },
  { name: "High Court of Karnataka", cases: 5, pending: 2 },
  { name: "Family Court, Koramangala", cases: 15, pending: 8 },
];

const hearingTypes = {
  ARGUMENTS: { label: "Arguments", color: "accent" },
  EVIDENCE: { label: "Evidence", color: "info" },
  BAIL_HEARING: { label: "Bail Hearing", color: "warning" },
  REMAND_EXTENSION: { label: "Remand Extension", color: "error" },
  JUDGMENT: { label: "Judgment", color: "success" },
  CHARGESHEET: { label: "Chargesheet", color: "muted" },
};

type FilterType = "all" | "today" | "week" | "date";

export default function CourtPage() {
  const { user: _user } = useAuthStore(); // Reserved for role-based access control
  const {
    hearings,
    orders,
    selectedHearing,
    setSelectedHearing,
    selectedDate,
    setSelectedDate,
    getStats,
    loadData,
  } = useCourtStore();

  const [filterType, setFilterType] = useState<FilterType>("all");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dateInput, setDateInput] = useState("");

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = getStats();

  // Filter hearings based on filter type
  const filteredHearings = hearings.filter((h) => {
    if (filterType === "today") {
      return h.date === new Date().toISOString().split("T")[0];
    }
    if (filterType === "week") {
      const hearingDate = new Date(h.date);
      const today = new Date();
      const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return hearingDate >= today && hearingDate <= weekEnd;
    }
    if (filterType === "date" && selectedDate) {
      return h.date === selectedDate;
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Court Integration</h1>
            <p className="text-foreground-muted">
              Manage court hearings, orders, and case tracking
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => toast.success("Reminders Set", "You will be notified 24 hours before each hearing")}>
              <Bell className="h-4 w-4 mr-2" />
              Set Reminders
            </Button>
            <Button onClick={() => setShowDatePicker(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Select Date
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Hearing
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card
            className={`border-warning/30 bg-warning/5 cursor-pointer hover:shadow-lg transition-shadow ${filterType === "today" ? "ring-2 ring-warning" : ""}`}
            onClick={() => {
              setFilterType("today");
              setSelectedDate(null);
              toast.info("Filter Applied", "Showing today's hearings");
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.todayHearings}</p>
                  <p className="text-xs text-foreground-muted">Today&apos;s Hearings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer hover:shadow-lg transition-shadow ${filterType === "week" ? "ring-2 ring-accent" : ""}`}
            onClick={() => {
              setFilterType("week");
              setSelectedDate(null);
              toast.info("Filter Applied", "Showing this week's hearings");
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.thisWeekHearings}</p>
                  <p className="text-xs text-foreground-muted">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <FileText className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.pendingOrders}</p>
                  <p className="text-xs text-foreground-muted">Pending Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer hover:shadow-lg transition-shadow ${filterType === "all" ? "ring-2 ring-success" : ""}`}
            onClick={() => {
              setFilterType("all");
              setSelectedDate(null);
              toast.info("Filter Cleared", "Showing all hearings");
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Gavel className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.activeCases}</p>
                  <p className="text-xs text-foreground-muted">Active Court Cases</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Hearings */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Hearings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredHearings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-foreground-muted mx-auto mb-2" />
                    <p className="text-foreground-muted">No hearings found for the selected filter</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setFilterType("all");
                        setSelectedDate(null);
                      }}
                    >
                      Clear Filter
                    </Button>
                  </div>
                ) : (
                  filteredHearings.map((hearing) => {
                    const type = hearingTypes[hearing.type as keyof typeof hearingTypes];
                    return (
                      <div
                        key={hearing.id}
                        className="p-4 rounded-lg bg-background-tertiary hover:bg-background-secondary transition-colors cursor-pointer"
                        onClick={() => setSelectedHearing(hearing)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-foreground">
                                {hearing.caseNumber}
                              </span>
                              <Badge variant={type.color as any}>{type.label}</Badge>
                              {hearing.priority === "HIGH" && (
                                <Badge variant="error">High Priority</Badge>
                              )}
                            </div>
                            <p className="text-foreground">{hearing.title}</p>
                            <div className="flex items-center gap-4 text-sm text-foreground-muted">
                              <span className="flex items-center gap-1">
                                <Building className="h-4 w-4" />
                                {hearing.court}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {hearing.courtRoom}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-foreground-muted">
                              <Gavel className="h-4 w-4" />
                              {hearing.judge}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-foreground-muted">
                              <Users className="h-4 w-4" />
                              IO: {hearing.io}
                            </div>
                            {hearing.requiredDocuments && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {hearing.requiredDocuments.map((doc) => (
                                  <span
                                    key={doc}
                                    className="px-2 py-0.5 text-xs rounded bg-info/10 text-info"
                                  >
                                    {doc}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-accent">{hearing.date}</div>
                            <div className="text-foreground-muted">{hearing.time}</div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHearing(hearing);
                              }}
                            >
                              Details
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Court Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {orders.length === 0 ? (
                  <div className="text-center py-4">
                    <FileText className="h-8 w-8 text-foreground-muted mx-auto mb-2" />
                    <p className="text-sm text-foreground-muted">No recent court orders</p>
                  </div>
                ) : (
                  orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="p-3 rounded-lg bg-background-tertiary cursor-pointer hover:bg-background-secondary transition-colors"
                      onClick={() => toast.info("Court Order", order.summary)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground text-sm">
                          {order.caseNumber}
                        </span>
                        <span className="text-xs text-foreground-muted">
                          {format(parseISO(order.orderDate), "MMM dd, yyyy")}
                        </span>
                      </div>
                      <Badge
                        variant={
                          order.orderType === "BAIL_REJECTED"
                            ? "error"
                            : order.orderType === "BAIL_GRANTED"
                            ? "success"
                            : order.orderType === "REMAND"
                            ? "warning"
                            : "info"
                        }
                        className="mb-2"
                      >
                        {order.orderType.replace(/_/g, " ")}
                      </Badge>
                      <p className="text-sm text-foreground-muted">{order.summary}</p>
                      {order.judgeName && (
                        <p className="text-xs text-foreground-muted mt-1">
                          <Gavel className="h-3 w-3 inline mr-1" />
                          {order.judgeName}
                        </p>
                      )}
                    </div>
                  ))
                )}
                {orders.length > 5 && (
                  <Button variant="ghost" className="w-full" onClick={() => toast.info("Court Orders", "Loading complete orders list...")}>
                    View All {orders.length} Orders
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Courts Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Courts Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {courts.map((court, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-background-tertiary"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{court.name}</p>
                      <p className="text-xs text-foreground-muted">
                        {court.cases} cases | {court.pending} pending
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-foreground-muted" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
                  <div>
                    <p className="font-medium text-warning">Pending Actions</p>
                    <ul className="text-sm text-foreground-muted mt-2 space-y-1">
                      <li>• 3 chargesheet submissions due this week</li>
                      <li>• 2 FSL reports awaited</li>
                      <li>• 1 witness statement pending</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Date Picker Modal */}
        <Modal
          isOpen={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          title="Select Date"
          description="Choose a date to view hearings"
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background-tertiary text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <ModalFooter>
              <Button variant="ghost" onClick={() => setShowDatePicker(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (dateInput) {
                    setSelectedDate(dateInput);
                    setFilterType("date");
                    setShowDatePicker(false);
                    toast.success("Date Selected", `Showing hearings for ${format(parseISO(dateInput), "MMMM dd, yyyy")}`);
                  }
                }}
                disabled={!dateInput}
              >
                Apply
              </Button>
            </ModalFooter>
          </div>
        </Modal>

        {/* Hearing Details Modal */}
        <Modal
          isOpen={!!selectedHearing}
          onClose={() => setSelectedHearing(null)}
          title="Hearing Details"
          size="lg"
        >
          {selectedHearing && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant={hearingTypes[selectedHearing.type].color as any}>
                  {hearingTypes[selectedHearing.type].label}
                </Badge>
                {selectedHearing.priority === "HIGH" && (
                  <Badge variant="error">High Priority</Badge>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground">{selectedHearing.caseNumber}</h3>
                <p className="text-foreground-muted">{selectedHearing.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Date & Time</p>
                  <p className="text-foreground font-medium">
                    {format(parseISO(selectedHearing.date), "MMMM dd, yyyy")} at {selectedHearing.time}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Court</p>
                  <p className="text-foreground font-medium">{selectedHearing.court}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Court Room</p>
                  <p className="text-foreground font-medium">{selectedHearing.courtRoom}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Judge</p>
                  <p className="text-foreground font-medium">{selectedHearing.judge}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Investigating Officer</p>
                  <p className="text-foreground font-medium">{selectedHearing.io}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Priority</p>
                  <p className="text-foreground font-medium">{selectedHearing.priority}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-foreground-muted mb-2">Charges</p>
                <div className="flex flex-wrap gap-2">
                  {selectedHearing.charges.map((charge) => (
                    <Badge key={charge} variant="secondary">
                      {charge}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedHearing.requiredDocuments && selectedHearing.requiredDocuments.length > 0 && (
                <div>
                  <p className="text-sm text-foreground-muted mb-2">Required Documents</p>
                  <div className="space-y-2">
                    {selectedHearing.requiredDocuments.map((doc) => (
                      <div key={doc} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-foreground">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <ModalFooter>
                <Button variant="ghost" onClick={() => setSelectedHearing(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  toast.success("Reminder Set", `You will be notified before ${selectedHearing.caseNumber} hearing`);
                  setSelectedHearing(null);
                }}>
                  <Bell className="h-4 w-4 mr-2" />
                  Set Reminder
                </Button>
              </ModalFooter>
            </div>
          )}
        </Modal>

        {/* Create Hearing Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Hearing"
          description="Schedule a new court hearing"
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Case Number
                </label>
                <input
                  type="text"
                  placeholder="CASE-2024-00000"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-tertiary text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Hearing Type
                </label>
                <select className="w-full px-3 py-2 rounded-lg border border-border bg-background-tertiary text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
                  <option value="ARGUMENTS">Arguments</option>
                  <option value="EVIDENCE">Evidence</option>
                  <option value="BAIL_HEARING">Bail Hearing</option>
                  <option value="REMAND_EXTENSION">Remand Extension</option>
                  <option value="JUDGMENT">Judgment</option>
                  <option value="CHARGESHEET">Chargesheet</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Case Title
              </label>
              <input
                type="text"
                placeholder="State vs. Accused Name"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background-tertiary text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-tertiary text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Time
                </label>
                <input
                  type="time"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-tertiary text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Court
                </label>
                <input
                  type="text"
                  placeholder="Sessions Court, Koramangala"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-tertiary text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Court Room
                </label>
                <input
                  type="text"
                  placeholder="Court Room 1"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-tertiary text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Judge Name
                </label>
                <input
                  type="text"
                  placeholder="Hon. Justice Name"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background-tertiary text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Priority
                </label>
                <select className="w-full px-3 py-2 rounded-lg border border-border bg-background-tertiary text-foreground focus:outline-none focus:ring-2 focus:ring-accent">
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-info/10 border border-info/30">
              <p className="text-sm text-info">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                This is a simplified form. In production, you would integrate with the actual court scheduling system.
              </p>
            </div>

            <ModalFooter>
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                toast.success("Hearing Created", "Court hearing has been scheduled successfully");
                setShowCreateModal(false);
              }}>
                Create Hearing
              </Button>
            </ModalFooter>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
