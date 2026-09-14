"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
  MapPin,
  Plus,
  Search,
  Loader2,
  Pencil,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { LegacySelect as Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { toast } from "@/stores/toastStore";
import {
  useCourtHearings,
  useCourtStats,
  useCreateCourtHearing,
  useUpdateCourtHearing,
} from "@/hooks/use-court-hearings";
import { useCourtOrders, useCreateCourtOrder } from "@/hooks/use-court-orders";
import { useOfficers } from "@/hooks/use-investigation";
import { casesApi } from "@/lib/api/cases";
import type { CourtHearing, CourtOrderType, CourtPriority, HearingType } from "@/lib/api/court";
import { formatDate } from "@/lib/utils";

const HEARING_PAGE_SIZE = 10;
const ORDER_PAGE_SIZE = 5;

const hearingTypes: Record<HearingType, { label: string; color: string }> = {
  ARGUMENTS: { label: "Arguments", color: "accent" },
  EVIDENCE: { label: "Evidence", color: "info" },
  BAIL_HEARING: { label: "Bail Hearing", color: "warning" },
  REMAND_EXTENSION: { label: "Remand Extension", color: "error" },
  JUDGMENT: { label: "Judgment", color: "success" },
  CHARGESHEET: { label: "Chargesheet", color: "muted" },
};

const hearingTypeOptions = Object.entries(hearingTypes).map(([value, { label }]) => ({ value, label }));

const orderTypes: Record<CourtOrderType, { label: string; color: string }> = {
  REMAND: { label: "Remand", color: "warning" },
  BAIL_REJECTED: { label: "Bail Rejected", color: "error" },
  BAIL_GRANTED: { label: "Bail Granted", color: "success" },
  DIRECTIONS: { label: "Directions", color: "info" },
  JUDGMENT: { label: "Judgment", color: "info" },
  STAY: { label: "Stay", color: "info" },
};

const orderTypeOptions = Object.entries(orderTypes).map(([value, { label }]) => ({ value, label }));

const priorityOptions = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

/** A date input yields YYYY-MM-DD; the API's time.Time fields need RFC 3339. */
const toApiDate = (day: string) => `${day}T00:00:00Z`;
/** The API sends a calendar day as midnight UTC; the date input wants YYYY-MM-DD. */
const toInputDate = (iso: string) => iso.slice(0, 10);
const splitList = (value: string) => value.split(",").map((v) => v.trim()).filter(Boolean);

const isHighPriority = (p: CourtPriority) => p === "HIGH" || p === "CRITICAL";

interface PickedCase {
  id: string;
  label: string;
  charges: string[];
}

/** Case chosen from the case register — the API links hearings and orders by case id. */
function CasePicker({ value, onChange }: { value: PickedCase | null; onChange: (c: PickedCase | null) => void }) {
  const [search, setSearch] = useState("");
  const deferred = useDeferredValue(search.trim());
  const results = useQuery({
    queryKey: ["cases", "picker", deferred],
    queryFn: () => casesApi.list({ search: deferred || undefined, pageSize: 8 }),
    enabled: !value,
  });

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <span className="text-foreground font-mono text-sm">{value.label}</span>
        <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        label="Case *"
        placeholder="Search by case number or title"
        value={search}
        onChange={setSearch}
        icon={<Search className="h-4 w-4" />}
      />
      <div className="rounded-lg border border-border divide-y divide-border max-h-48 overflow-y-auto">
        {results.isPending ? (
          <p className="p-3 text-sm text-foreground-muted">Searching cases…</p>
        ) : results.isError ? (
          <p className="p-3 text-sm text-error">Cases could not be loaded: {results.error.message}</p>
        ) : results.data.data.length === 0 ? (
          <p className="p-3 text-sm text-foreground-muted">No matching cases</p>
        ) : (
          results.data.data.map((c) => (
            <button
              key={c.id}
              type="button"
              className="w-full text-left p-3 hover:bg-background-tertiary"
              onClick={() =>
                onChange({
                  id: c.id,
                  label: [c.caseNumber, c.title].filter(Boolean).join(" · "),
                  charges: c.ipcSections ?? [],
                })
              }
            >
              <span className="font-mono text-sm text-foreground">{c.caseNumber}</span>
              <span className="block text-xs text-foreground-muted">{c.title}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

const emptyHearingForm = () => ({
  title: "",
  type: "ARGUMENTS" as HearingType,
  priority: "MEDIUM" as CourtPriority,
  date: "",
  time: "",
  court: "",
  courtRoom: "",
  judge: "",
  ioId: "",
  charges: "",
  requiredDocuments: "",
});

const emptyOrderForm = () => ({
  orderType: "DIRECTIONS" as CourtOrderType,
  orderDate: new Date().toISOString().split("T")[0],
  court: "",
  judgeName: "",
  summary: "",
});

function Pager({
  page,
  totalPages,
  total,
  noun,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  noun: string;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm text-foreground-muted pt-2">
      <span>
        Page {page} of {totalPages} · {total} {noun}
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

export default function CourtPage() {
  const { user } = useAuthStore();
  const canRecord = user && hasMinimumRole(user.role, "SI");

  const [searchQuery, setSearchQuery] = useState("");
  const search = useDeferredValue(searchQuery.trim());
  const [filterType, setFilterType] = useState<"ALL" | HearingType>("ALL");
  const [filterPriority, setFilterPriority] = useState<"ALL" | CourtPriority>("ALL");
  const [hearingPage, setHearingPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);

  const [selectedHearing, setSelectedHearing] = useState<CourtHearing | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(emptyHearingForm);

  const [showHearingModal, setShowHearingModal] = useState(false);
  const [hearingCase, setHearingCase] = useState<PickedCase | null>(null);
  const [hearingForm, setHearingForm] = useState(emptyHearingForm);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderCase, setOrderCase] = useState<PickedCase | null>(null);
  const [orderForm, setOrderForm] = useState(emptyOrderForm);

  const hearings = useCourtHearings({
    page: hearingPage,
    pageSize: HEARING_PAGE_SIZE,
    search: search || undefined,
    type: filterType === "ALL" ? undefined : filterType,
    priority: filterPriority === "ALL" ? undefined : filterPriority,
  });
  const orders = useCourtOrders({ page: orderPage, pageSize: ORDER_PAGE_SIZE });
  const stats = useCourtStats();
  const officers = useOfficers();
  const createHearing = useCreateCourtHearing();
  const updateHearing = useUpdateCourtHearing();
  const createOrder = useCreateCourtOrder();

  const officerOptions = [
    { value: "", label: "Not assigned" },
    ...(officers.data ?? []).map((o) => ({
      value: o.id,
      label: [o.roleLabel, o.name, o.stationName && `· ${o.stationName}`].filter(Boolean).join(" "),
    })),
  ];

  const filtersActive = Boolean(search) || filterType !== "ALL" || filterPriority !== "ALL";
  const clearFilters = () => {
    setSearchQuery("");
    setFilterType("ALL");
    setFilterPriority("ALL");
    setHearingPage(1);
  };

  const closeHearingModal = () => {
    setShowHearingModal(false);
    setHearingCase(null);
    setHearingForm(emptyHearingForm());
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setOrderCase(null);
    setOrderForm(emptyOrderForm());
  };

  const openHearing = (hearing: CourtHearing) => {
    setSelectedHearing(hearing);
    setEditing(false);
  };

  const startEdit = (hearing: CourtHearing) => {
    setEditForm({
      title: hearing.title,
      type: hearing.type,
      priority: hearing.priority,
      date: toInputDate(hearing.date),
      time: hearing.time,
      court: hearing.court,
      courtRoom: hearing.courtRoom,
      judge: hearing.judge,
      ioId: hearing.ioId ?? "",
      charges: (hearing.charges ?? []).join(", "),
      requiredDocuments: (hearing.requiredDocuments ?? []).join(", "),
    });
    setEditing(true);
  };

  const handleCreateHearing = async () => {
    if (!hearingCase || !hearingForm.title || !hearingForm.date || !hearingForm.court) {
      toast.error("Validation Error", "Case, title, date and court are required");
      return;
    }
    try {
      const hearing = await createHearing.mutateAsync({
        caseId: hearingCase.id,
        title: hearingForm.title,
        type: hearingForm.type,
        priority: hearingForm.priority,
        date: toApiDate(hearingForm.date),
        time: hearingForm.time,
        court: hearingForm.court,
        courtRoom: hearingForm.courtRoom,
        judge: hearingForm.judge,
        ioId: hearingForm.ioId || null,
        charges: splitList(hearingForm.charges),
        requiredDocuments: splitList(hearingForm.requiredDocuments),
      });
      toast.success("Hearing Recorded", `${hearing.caseNumber || hearing.title} on ${formatDate(hearing.date)}`);
      closeHearingModal();
    } catch (error) {
      toast.error("Hearing not recorded", error instanceof Error ? error.message : "The server rejected the request");
    }
  };

  const handleUpdateHearing = async () => {
    if (!selectedHearing) return;
    if (!editForm.title || !editForm.date || !editForm.court) {
      toast.error("Validation Error", "Title, date and court are required");
      return;
    }
    try {
      const updated = await updateHearing.mutateAsync({
        hearing: selectedHearing,
        changes: {
          title: editForm.title,
          type: editForm.type,
          priority: editForm.priority,
          date: toApiDate(editForm.date),
          time: editForm.time,
          court: editForm.court,
          courtRoom: editForm.courtRoom,
          judge: editForm.judge,
          ioId: editForm.ioId || null,
          charges: splitList(editForm.charges),
          requiredDocuments: splitList(editForm.requiredDocuments),
        },
      });
      setSelectedHearing(updated);
      setEditing(false);
      toast.success("Hearing Updated", `${updated.caseNumber || updated.title} has been updated`);
    } catch (error) {
      toast.error("Hearing not updated", error instanceof Error ? error.message : "The server rejected the request");
    }
  };

  const handleCreateOrder = async () => {
    if (!orderCase || !orderForm.orderDate || !orderForm.court || !orderForm.summary) {
      toast.error("Validation Error", "Case, date, court and summary are required");
      return;
    }
    try {
      const order = await createOrder.mutateAsync({
        caseId: orderCase.id,
        orderType: orderForm.orderType,
        orderDate: toApiDate(orderForm.orderDate),
        court: orderForm.court,
        judgeName: orderForm.judgeName || null,
        summary: orderForm.summary,
      });
      toast.success("Order Recorded", `${orderTypes[order.orderType].label} order for ${order.caseNumber || "the case"}`);
      setOrderPage(1);
      closeOrderModal();
    } catch (error) {
      toast.error("Order not recorded", error instanceof Error ? error.message : "The server rejected the request");
    }
  };

  const statValue = (value: number | undefined) =>
    stats.isError ? "—" : value ?? <Loader2 className="h-5 w-5 animate-spin" />;

  const hearingRows = hearings.data?.data ?? [];
  const orderRows = orders.data?.data ?? [];

  const hearingFields = (
    form: ReturnType<typeof emptyHearingForm>,
    set: (form: ReturnType<typeof emptyHearingForm>) => void
  ) => (
    <>
      <Input
        label="Hearing Title *"
        placeholder="State vs. Accused Name"
        value={form.title}
        onChange={(v: string) => set({ ...form, title: v })}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Hearing Type *"
          value={form.type}
          onChange={(v: string) => set({ ...form, type: v as HearingType })}
          options={hearingTypeOptions}
        />
        <Select
          label="Priority *"
          value={form.priority}
          onChange={(v: string) => set({ ...form, priority: v as CourtPriority })}
          options={priorityOptions}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Date *" type="date" value={form.date} onChange={(v: string) => set({ ...form, date: v })} />
        <Input label="Time" type="time" value={form.time} onChange={(v: string) => set({ ...form, time: v })} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Court *"
          placeholder="City Sessions Court, Kolkata"
          value={form.court}
          onChange={(v: string) => set({ ...form, court: v })}
          icon={<Building className="h-4 w-4" />}
        />
        <Input
          label="Court Room"
          placeholder="Court Room 1"
          value={form.courtRoom}
          onChange={(v: string) => set({ ...form, courtRoom: v })}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Judge / Magistrate"
          value={form.judge}
          onChange={(v: string) => set({ ...form, judge: v })}
          icon={<Gavel className="h-4 w-4" />}
        />
        <Select
          label="Investigating Officer"
          value={form.ioId}
          onChange={(v: string) => set({ ...form, ioId: v })}
          options={officerOptions}
        />
      </div>
      <Input
        label="Charges (comma separated)"
        placeholder="BNS 309, BNS 310"
        value={form.charges}
        onChange={(v: string) => set({ ...form, charges: v })}
      />
      <Input
        label="Required Documents (comma separated)"
        placeholder="Chargesheet, FSL report"
        value={form.requiredDocuments}
        onChange={(v: string) => set({ ...form, requiredDocuments: v })}
      />
    </>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Court Integration</h1>
            <p className="text-foreground-muted">Manage court hearings, orders, and case tracking</p>
          </div>
          {canRecord && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowOrderModal(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Record Order
              </Button>
              <Button onClick={() => setShowHearingModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Hearing
              </Button>
            </div>
          )}
        </div>

        {/* Quick Stats — counts come from the server, not from the rows loaded */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{statValue(stats.data?.todayHearings)}</p>
                  <p className="text-xs text-foreground-muted">Today&apos;s Hearings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Calendar className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{statValue(stats.data?.thisWeekHearings)}</p>
                  <p className="text-xs text-foreground-muted">Next 7 Days</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <FileText className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{statValue(stats.data?.pendingOrders)}</p>
                  <p className="text-xs text-foreground-muted">Orders Recorded</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer hover:shadow-lg transition-shadow ${filtersActive ? "" : "ring-2 ring-success"}`}
            onClick={clearFilters}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Gavel className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {hearings.isError ? "—" : hearings.data?.total ?? <Loader2 className="h-5 w-5 animate-spin" />}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {filtersActive ? "Matching Hearings · clear" : "Hearings Recorded"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hearings */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Hearings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[14rem]">
                    <Input
                      placeholder="Search by hearing title or court..."
                      value={searchQuery}
                      onChange={(v: string) => {
                        setSearchQuery(v);
                        setHearingPage(1);
                      }}
                      icon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value as "ALL" | HearingType);
                      setHearingPage(1);
                    }}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="ALL">All Types</option>
                    {hearingTypeOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterPriority}
                    onChange={(e) => {
                      setFilterPriority(e.target.value as "ALL" | CourtPriority);
                      setHearingPage(1);
                    }}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="ALL">All Priorities</option>
                    {priorityOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {hearings.isPending ? (
                  <div className="flex items-center justify-center gap-3 py-8 text-foreground-muted">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading hearings…
                  </div>
                ) : hearings.isError ? (
                  <div className="text-center py-8 space-y-3">
                    <AlertTriangle className="h-12 w-12 text-error mx-auto" />
                    <p className="text-foreground">Hearings could not be loaded</p>
                    <p className="text-sm text-foreground-muted">{hearings.error.message}</p>
                    <Button variant="secondary" size="sm" onClick={() => hearings.refetch()}>
                      Try again
                    </Button>
                  </div>
                ) : hearingRows.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-foreground-muted mx-auto mb-2" />
                    <p className="text-foreground-muted">
                      {filtersActive ? "No hearings match the selected filters" : "No hearings have been recorded yet"}
                    </p>
                    {filtersActive && (
                      <Button variant="ghost" size="sm" className="mt-2" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {hearingRows.map((hearing) => {
                      const type = hearingTypes[hearing.type];
                      return (
                        <div
                          key={hearing.id}
                          className="p-4 rounded-lg bg-background-tertiary hover:bg-background-secondary transition-colors cursor-pointer"
                          onClick={() => openHearing(hearing)}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="font-bold text-foreground">
                                  {hearing.caseNumber || "No case linked"}
                                </span>
                                {type && <Badge variant={type.color as any}>{type.label}</Badge>}
                                {isHighPriority(hearing.priority) && (
                                  <Badge variant="error">
                                    {hearing.priority === "CRITICAL" ? "Critical" : "High"} Priority
                                  </Badge>
                                )}
                              </div>
                              <p className="text-foreground">{hearing.title}</p>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-muted">
                                {hearing.court && (
                                  <span className="flex items-center gap-1">
                                    <Building className="h-4 w-4" />
                                    {hearing.court}
                                  </span>
                                )}
                                {hearing.courtRoom && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {hearing.courtRoom}
                                  </span>
                                )}
                              </div>
                              {hearing.judge && (
                                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                                  <Gavel className="h-4 w-4" />
                                  {hearing.judge}
                                </div>
                              )}
                              {hearing.io && (
                                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                                  <Users className="h-4 w-4" />
                                  IO: {hearing.io}
                                </div>
                              )}
                              {hearing.requiredDocuments && hearing.requiredDocuments.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {hearing.requiredDocuments.map((doc) => (
                                    <span key={doc} className="px-2 py-0.5 text-xs rounded bg-info/10 text-info">
                                      {doc}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-accent">{formatDate(hearing.date)}</div>
                              <div className="text-foreground-muted">{hearing.time || "Time not recorded"}</div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openHearing(hearing);
                                }}
                              >
                                Details
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <Pager
                      page={hearingPage}
                      totalPages={hearings.data.totalPages}
                      total={hearings.data.total}
                      noun="hearings"
                      onPage={setHearingPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Court Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {orders.isPending ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-foreground-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading orders…
                  </div>
                ) : orders.isError ? (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-sm text-error">Orders could not be loaded: {orders.error.message}</p>
                    <Button variant="secondary" size="sm" onClick={() => orders.refetch()}>
                      Try again
                    </Button>
                  </div>
                ) : orderRows.length === 0 ? (
                  <div className="text-center py-4">
                    <FileText className="h-8 w-8 text-foreground-muted mx-auto mb-2" />
                    <p className="text-sm text-foreground-muted">No court orders recorded</p>
                  </div>
                ) : (
                  <>
                    {orderRows.map((order) => {
                      const type = orderTypes[order.orderType];
                      return (
                        <div key={order.id} className="p-3 rounded-lg bg-background-tertiary">
                          <div className="flex items-center justify-between mb-2">
                            {order.caseNumber ? (
                              <Link
                                href={`/cases/${order.caseId}`}
                                className="font-medium text-accent hover:underline text-sm"
                              >
                                {order.caseNumber}
                              </Link>
                            ) : (
                              <span className="font-medium text-foreground text-sm">Case</span>
                            )}
                            <span className="text-xs text-foreground-muted">{formatDate(order.orderDate)}</span>
                          </div>
                          {type && (
                            <Badge variant={type.color as any} className="mb-2">
                              {type.label}
                            </Badge>
                          )}
                          <p className="text-sm text-foreground-muted">{order.summary}</p>
                          <p className="text-xs text-foreground-muted mt-1">
                            <Building className="h-3 w-3 inline mr-1" />
                            {order.court}
                            {order.judgeName && ` · ${order.judgeName}`}
                          </p>
                        </div>
                      );
                    })}
                    <Pager
                      page={orderPage}
                      totalPages={orders.data.totalPages}
                      total={orders.data.total}
                      noun="orders"
                      onPage={setOrderPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hearing Details / Edit Modal */}
        <Modal
          isOpen={!!selectedHearing}
          onClose={() => {
            setSelectedHearing(null);
            setEditing(false);
          }}
          title={editing ? "Edit Hearing" : "Hearing Details"}
          size="lg"
        >
          {selectedHearing && !editing && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {hearingTypes[selectedHearing.type] && (
                  <Badge variant={hearingTypes[selectedHearing.type].color as any}>
                    {hearingTypes[selectedHearing.type].label}
                  </Badge>
                )}
                {isHighPriority(selectedHearing.priority) && (
                  <Badge variant="error">
                    {selectedHearing.priority === "CRITICAL" ? "Critical" : "High"} Priority
                  </Badge>
                )}
              </div>

              <div>
                {selectedHearing.caseId ? (
                  <Link
                    href={`/cases/${selectedHearing.caseId}`}
                    className="text-xl font-bold text-accent hover:underline"
                  >
                    {selectedHearing.caseNumber || "View case"}
                  </Link>
                ) : (
                  <h3 className="text-xl font-bold text-foreground">No case linked</h3>
                )}
                <p className="text-foreground-muted">{selectedHearing.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  [
                    "Date & Time",
                    `${formatDate(selectedHearing.date)}${selectedHearing.time ? ` at ${selectedHearing.time}` : ""}`,
                  ],
                  ["Court", selectedHearing.court],
                  ["Court Room", selectedHearing.courtRoom],
                  ["Judge", selectedHearing.judge],
                  ["Investigating Officer", selectedHearing.io],
                  ["Priority", selectedHearing.priority],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-sm text-foreground-muted mb-1">{label}</p>
                    <p className={value ? "text-foreground font-medium" : "text-foreground-muted"}>
                      {value || "Not recorded"}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm text-foreground-muted mb-2">Charges</p>
                {selectedHearing.charges && selectedHearing.charges.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedHearing.charges.map((charge) => (
                      <Badge key={charge} variant="secondary">
                        {charge}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground-muted">No charges recorded</p>
                )}
              </div>

              {selectedHearing.requiredDocuments && selectedHearing.requiredDocuments.length > 0 && (
                <div>
                  <p className="text-sm text-foreground-muted mb-2">Required Documents</p>
                  <div className="space-y-2">
                    {selectedHearing.requiredDocuments.map((doc) => (
                      <div key={doc} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-foreground-muted" />
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
                {canRecord && (
                  <Button onClick={() => startEdit(selectedHearing)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Hearing
                  </Button>
                )}
              </ModalFooter>
            </div>
          )}

          {selectedHearing && editing && (
            <div className="space-y-4">
              <p className="text-sm text-foreground-muted">
                Case: <span className="font-mono">{selectedHearing.caseNumber || "No case linked"}</span>
              </p>
              {hearingFields(editForm, setEditForm)}
              <ModalFooter>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateHearing} disabled={updateHearing.isPending}>
                  {updateHearing.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </ModalFooter>
            </div>
          )}
        </Modal>

        {/* Add Hearing Modal */}
        <Modal
          isOpen={showHearingModal}
          onClose={closeHearingModal}
          title="Add Hearing"
          description="Record a hearing listed by the court for a case"
          size="lg"
        >
          <div className="space-y-4">
            <CasePicker
              value={hearingCase}
              onChange={(c) => {
                setHearingCase(c);
                if (c && !hearingForm.charges) setHearingForm({ ...hearingForm, charges: c.charges.join(", ") });
              }}
            />
            {hearingFields(hearingForm, setHearingForm)}
            <ModalFooter>
              <Button variant="ghost" onClick={closeHearingModal}>
                Cancel
              </Button>
              <Button onClick={handleCreateHearing} disabled={createHearing.isPending}>
                {createHearing.isPending ? "Recording..." : "Add Hearing"}
              </Button>
            </ModalFooter>
          </div>
        </Modal>

        {/* Record Order Modal */}
        <Modal
          isOpen={showOrderModal}
          onClose={closeOrderModal}
          title="Record Court Order"
          description="Record an order passed by the court in a case"
          size="lg"
        >
          <div className="space-y-4">
            <CasePicker value={orderCase} onChange={setOrderCase} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Order Type *"
                value={orderForm.orderType}
                onChange={(v: string) => setOrderForm({ ...orderForm, orderType: v as CourtOrderType })}
                options={orderTypeOptions}
              />
              <Input
                label="Order Date *"
                type="date"
                value={orderForm.orderDate}
                onChange={(v: string) => setOrderForm({ ...orderForm, orderDate: v })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Court *"
                placeholder="City Sessions Court, Kolkata"
                value={orderForm.court}
                onChange={(v: string) => setOrderForm({ ...orderForm, court: v })}
                icon={<Building className="h-4 w-4" />}
              />
              <Input
                label="Judge / Magistrate"
                value={orderForm.judgeName}
                onChange={(v: string) => setOrderForm({ ...orderForm, judgeName: v })}
                icon={<Gavel className="h-4 w-4" />}
              />
            </div>
            <Textarea
              label="Order Summary *"
              placeholder="What the court ordered"
              value={orderForm.summary}
              onChange={(v: string) => setOrderForm({ ...orderForm, summary: v })}
              rows={3}
            />
            <p className="text-xs text-foreground-muted">
              A recorded order cannot be edited or deleted. Check the details against the certified copy.
            </p>
            <ModalFooter>
              <Button variant="ghost" onClick={closeOrderModal}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrder} disabled={createOrder.isPending}>
                {createOrder.isPending ? "Recording..." : "Record Order"}
              </Button>
            </ModalFooter>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
