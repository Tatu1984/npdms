"use client";

import { useDeferredValue, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Globe,
  Loader2,
  LogIn,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import { useAccessLog, useAccessStats, useIPIntel } from "@/hooks/use-access-log";
import type { AccessAction, AccessOutcome } from "@/lib/api/access-log";
import { formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 50;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Access log. Sign-ins, failed sign-ins and sign-outs are recorded by the
 * server in the immutable audit trail; this page only reads them.
 */
export default function AccessLogPage() {
  const { user } = useAuthStore();
  // The route requires DSP and above; lower ranks get a statement, not a failed request.
  const allowed = Boolean(user && hasMinimumRole(user.role, "DSP"));

  const [action, setAction] = useState<"" | AccessAction>("");
  const [outcome, setOutcome] = useState<"" | AccessOutcome>("");
  const [ipQuery, setIpQuery] = useState("");
  const [userIdQuery, setUserIdQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [intelFor, setIntelFor] = useState<string | null>(null);

  const ip = useDeferredValue(ipQuery.trim());
  const userId = userIdQuery.trim();
  const userIdValid = userId === "" || UUID.test(userId);

  const query = {
    page,
    pageSize: PAGE_SIZE,
    action: action || undefined,
    outcome: outcome || undefined,
    ip: ip || undefined,
    userId: userIdValid && userId ? userId : undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(to).toISOString() : undefined,
  };
  const events = useAccessLog(query, allowed);
  const stats = useAccessStats(allowed);

  if (!allowed) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-2 text-center">
          <Lock className="h-12 w-12 text-foreground-muted mb-2" />
          <h2 className="text-xl font-bold text-foreground">Access log restricted</h2>
          <p className="text-foreground-muted max-w-md">
            Sign-in activity is available to officers of DSP rank and above.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const rows = events.data?.data ?? [];
  const totalPages = events.data?.totalPages ?? 0;
  const resetPage = () => setPage(1);

  const statCards = [
    { key: "signIns", label: "Sign-ins (24h)", value: stats.data?.signIns24h, icon: LogIn, wrap: "bg-success/10", color: "text-success" },
    { key: "failures", label: "Failed Sign-ins (24h)", value: stats.data?.failures24h, icon: XCircle, wrap: "bg-error/10", color: "text-error" },
    { key: "users", label: "Officers Signed In (24h)", value: stats.data?.activeUsers24h, icon: Users, wrap: "bg-accent/10", color: "text-accent" },
    { key: "ips", label: "Distinct Addresses (24h)", value: stats.data?.distinctIPs24h, icon: Globe, wrap: "bg-info/10", color: "text-info" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Access Log</h1>
            <p className="text-foreground-muted">
              Sign-ins, failed sign-ins and sign-outs, read from the audit trail
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              events.refetch();
              stats.refetch();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ key, label, value, icon: Icon, wrap, color }) => (
            <Card key={key}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${wrap}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.isError ? "—" : value ?? <Loader2 className="h-5 w-5 animate-spin" />}
                    </p>
                    <p className="text-xs text-foreground-muted">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className={(stats.data?.suspiciousSources.length ?? 0) > 0 ? "border-error/40" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-error" />
              Flagged Addresses
            </CardTitle>
            {stats.data && (
              <p className="text-sm text-foreground-muted">
                Rule: an address is flagged after {stats.data.suspiciousFailureThreshold} or more failed sign-ins within
                one hour. This is a stated threshold, not a model.
              </p>
            )}
          </CardHeader>
          <CardContent>
            {stats.isPending ? (
              <p className="text-foreground-muted">Loading…</p>
            ) : stats.isError ? (
              <p className="text-error">{stats.error.message}</p>
            ) : stats.data.suspiciousSources.length === 0 ? (
              <p className="text-foreground-muted">No address has met the rule in the last hour.</p>
            ) : (
              <div className="space-y-2">
                {stats.data.suspiciousSources.map((s) => (
                  <div key={s.ipAddress} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-error/5">
                    <div>
                      <p className="font-mono text-foreground">{s.ipAddress}</p>
                      <p className="text-xs text-foreground-muted">
                        {s.failures} failures against {s.accounts} account{s.accounts === 1 ? "" : "s"} · last{" "}
                        {formatDateTime(s.lastSeen)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setIpQuery(s.ipAddress);
                          setOutcome("FAILURE");
                          resetPage();
                        }}
                      >
                        Show attempts
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIntelFor(s.ipAddress)}>
                        Look up
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 items-end">
              <select
                aria-label="Event"
                value={action}
                onChange={(e) => {
                  setAction(e.target.value as "" | AccessAction);
                  resetPage();
                }}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="">All events</option>
                <option value="LOGIN">Sign-in attempts</option>
                <option value="LOGOUT">Sign-outs</option>
              </select>
              <select
                aria-label="Outcome"
                value={outcome}
                onChange={(e) => {
                  setOutcome(e.target.value as "" | AccessOutcome);
                  resetPage();
                }}
                className="px-3 py-2 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="">Any outcome</option>
                <option value="SUCCESS">Succeeded</option>
                <option value="FAILURE">Failed</option>
              </select>
              <Input
                placeholder="IP address"
                value={ipQuery}
                onChange={(v: string) => {
                  setIpQuery(v);
                  resetPage();
                }}
                icon={<Search className="h-4 w-4" />}
              />
              <Input
                placeholder="Officer user id"
                value={userIdQuery}
                error={userIdValid ? undefined : "Not a valid id"}
                onChange={(v: string) => {
                  setUserIdQuery(v);
                  resetPage();
                }}
              />
              <Input
                label="From"
                type="datetime-local"
                value={from}
                onChange={(v: string) => {
                  setFrom(v);
                  resetPage();
                }}
              />
              <Input
                label="To"
                type="datetime-local"
                value={to}
                onChange={(v: string) => {
                  setTo(v);
                  resetPage();
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Events {events.data && <span className="text-foreground-muted text-sm font-normal">({events.data.total})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {events.isPending ? (
              <div className="p-12 flex items-center justify-center gap-3 text-foreground-muted">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading events…
              </div>
            ) : events.isError ? (
              <div className="p-12 text-center space-y-3">
                <AlertTriangle className="h-10 w-10 text-error mx-auto" />
                <p className="text-foreground font-medium">The access log could not be loaded</p>
                <p className="text-foreground-muted">{events.error.message}</p>
                <Button variant="secondary" onClick={() => events.refetch()}>
                  Try again
                </Button>
              </div>
            ) : rows.length === 0 ? (
              <p className="p-12 text-center text-foreground-muted">No events match these filters</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Officer</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Client</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-sm whitespace-nowrap">{formatDateTime(e.timestamp)}</TableCell>
                        <TableCell>
                          <Badge variant={e.outcome === "SUCCESS" ? (e.action === "LOGIN" ? "success" : "secondary") : "error"}>
                            {e.action === "LOGOUT" ? "Sign-out" : e.outcome === "SUCCESS" ? "Sign-in" : "Failed sign-in"}
                          </Badge>
                          {e.detail && <p className="text-xs text-foreground-muted mt-1">{e.detail}</p>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {e.userName ? (
                            <>
                              <p className="text-foreground">{e.userName}</p>
                              <p className="text-xs text-foreground-muted">
                                {[e.userRole, e.badge, e.station].filter(Boolean).join(" · ")}
                              </p>
                            </>
                          ) : (
                            <span className="text-foreground-muted">Unknown account</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {e.ipAddress ? (
                            <button
                              type="button"
                              className="font-mono text-sm text-accent hover:underline"
                              onClick={() => setIntelFor(e.ipAddress)}
                            >
                              {e.ipAddress}
                            </button>
                          ) : (
                            <span className="text-foreground-muted text-sm">Not recorded</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-foreground-muted max-w-[18rem] truncate" title={e.userAgent}>
                          {e.userAgent || "Not recorded"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-foreground-muted">
            <span>
              Page {page} of {totalPages}
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
      </div>

      {intelFor && <IPIntelDialog ip={intelFor} onClose={() => setIntelFor(null)} />}
    </DashboardLayout>
  );
}

/**
 * Address lookup runs server-side and is audited with the stated purpose, so
 * the officer must give one before anything is queried.
 */
function IPIntelDialog({ ip, onClose }: { ip: string; onClose: () => void }) {
  const [purpose, setPurpose] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const intel = useIPIntel(submitted ? ip : null, submitted ?? "");

  return (
    <Modal isOpen onClose={onClose} title={`Address ${ip}`} description="Lookups are made by the server and recorded in the audit trail with their purpose">
      {!submitted ? (
        <div className="space-y-4">
          <Input
            label="Purpose *"
            placeholder="Case reference or reason, e.g. repeated failed sign-ins"
            value={purpose}
            onChange={(v: string) => setPurpose(v)}
          />
        </div>
      ) : intel.isPending ? (
        <p className="text-foreground-muted flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Looking up…
        </p>
      ) : intel.isError ? (
        <p className="text-error">{intel.error.message}</p>
      ) : (
        <div className="space-y-2 text-sm">
          {intel.data.isPrivate || intel.data.isLoopback ? (
            <p className="text-foreground">
              {intel.data.isLoopback ? "Loopback address" : "Private network address"} — inside the platform's own network.
            </p>
          ) : !intel.data.available ? (
            <p className="text-warning">Lookup could not be made{intel.data.note ? `: ${intel.data.note}` : ""}.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Location", [intel.data.city, intel.data.region, intel.data.country].filter(Boolean).join(", ")],
                ["Organisation", intel.data.organisation],
                ["ASN", intel.data.asn],
                ["Timezone", intel.data.timezone],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-foreground-muted">{label}</p>
                  <p className="text-foreground">{value || "Not given"}</p>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-foreground-muted">
            Source: {intel.data.source} · {intel.data.cached ? "cached" : "retrieved"} {formatDateTime(intel.data.retrievedAt)}
          </p>
        </div>
      )}
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {!submitted && (
          <Button disabled={!purpose.trim()} onClick={() => setSubmitted(purpose.trim())}>
            Look up
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
