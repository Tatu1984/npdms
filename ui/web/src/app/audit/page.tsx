"use client";

import { useDeferredValue, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSearch, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState, PageHeader, Panel, StatTile, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { useI18n } from "@/lib/i18n";
import { useAuditLog, useAuditStats, useVerifyAuditChain } from "@/hooks/use-legacy-registers";
import { AUDIT_ACTIONS, type AuditAction, type AuditOutcome } from "@/lib/api/audit";
import { formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 50;

const L = {
  title: { en: "Audit trail", bn: "অডিট ট্রেইল" },
  description: {
    en: "Every recorded action, read from the append-only, hash-chained audit table.",
    bn: "প্রতিটি নথিভুক্ত কাজ, শুধু-সংযোজনযোগ্য হ্যাশ-শৃঙ্খলিত অডিট সারণি থেকে পড়া।",
  },
  restrictedTitle: { en: "Audit trail restricted", bn: "অডিট ট্রেইল সীমাবদ্ধ" },
  restrictedBody: { en: "The audit trail is available to officers of DSP rank and above.", bn: "অডিট ট্রেইল ডিএসপি ও ঊর্ধ্বতন পদের আধিকারিকদের জন্য।" },
  total: { en: "Entries recorded", bn: "নথিভুক্ত এন্ট্রি" },
  last24h: { en: "In the last 24 hours", bn: "গত ২৪ ঘণ্টায়" },
  failures24h: { en: "Failed or denied (24h)", bn: "ব্যর্থ বা প্রত্যাখ্যাত (২৪ ঘণ্টা)" },
  search: { en: "Search event, detail or officer…", bn: "ঘটনা, বিবরণ বা আধিকারিক খুঁজুন…" },
  allActions: { en: "All actions", bn: "সব কাজ" },
  allResources: { en: "All record types", bn: "সব নথির ধরন" },
  allOutcomes: { en: "All outcomes", bn: "সব ফলাফল" },
  from: { en: "From", bn: "থেকে" },
  to: { en: "Before", bn: "আগে" },
  clear: { en: "Clear filters", bn: "ফিল্টার সরান" },
  when: { en: "When", bn: "সময়" },
  officer: { en: "Officer", bn: "আধিকারিক" },
  action: { en: "Action", bn: "কাজ" },
  record: { en: "Record", bn: "নথি" },
  outcome: { en: "Outcome", bn: "ফলাফল" },
  detail: { en: "Detail", bn: "বিবরণ" },
  system: { en: "System", bn: "সিস্টেম" },
  loading: { en: "Loading the audit trail…", bn: "অডিট ট্রেইল লোড হচ্ছে…" },
  loadFailed: { en: "The audit trail could not be loaded", bn: "অডিট ট্রেইল লোড করা যায়নি" },
  retry: { en: "Try again", bn: "আবার চেষ্টা করুন" },
  empty: { en: "No entries match these filters", bn: "এই ফিল্টারে কোনো এন্ট্রি নেই" },
  page: { en: "Page", bn: "পৃষ্ঠা" },
  of: { en: "of", bn: "এর" },
  prev: { en: "Previous", bn: "আগের" },
  next: { en: "Next", bn: "পরের" },
  chainTitle: { en: "Hash-chain verification", bn: "হ্যাশ-শৃঙ্খল যাচাই" },
  chainDescription: {
    en: "Checks that each recent entry links to the one before it and re-computes the hash of entries that can be re-computed.",
    bn: "সাম্প্রতিক প্রতিটি এন্ট্রি আগেরটির সঙ্গে যুক্ত কিনা এবং পুনর্গণনাযোগ্য এন্ট্রির হ্যাশ মিলছে কিনা যাচাই করে।",
  },
  verify: { en: "Verify the latest", bn: "সর্বশেষ যাচাই করুন" },
  entries: { en: "entries", bn: "এন্ট্রি" },
  intact: { en: "Chain intact", bn: "শৃঙ্খল অক্ষুণ্ণ" },
  broken: { en: "Chain broken", bn: "শৃঙ্খল ভাঙা" },
  checked: { en: "Checked", bn: "যাচাই হয়েছে" },
  linkage: { en: "Linkage breaks", bn: "সংযোগ বিচ্ছেদ" },
  mismatches: { en: "Hash mismatches", bn: "হ্যাশ অমিল" },
  recomputed: { en: "Re-hashed", bn: "পুনর্গণিত" },
  legacy: { en: "Legacy (link checked only)", bn: "পুরনো (শুধু সংযোগ যাচাই)" },
  sequence: { en: "Entry", bn: "এন্ট্রি" },
  verifyFailed: { en: "Verification failed", bn: "যাচাই ব্যর্থ" },
};

const outcomeTone: Record<AuditOutcome, "success" | "danger" | "warning" | "neutral"> = {
  SUCCESS: "success",
  FAILURE: "danger",
  DENIED: "danger",
  PARTIAL: "warning",
};

/** A date input yields YYYY-MM-DD; the API filters on RFC 3339 timestamps (IST day boundaries). */
const dayStart = (day: string) => (day ? `${day}T00:00:00+05:30` : undefined);

export default function AuditPage() {
  const { user } = useAuthStore();
  const { pick } = useI18n();
  const allowed = Boolean(user && hasMinimumRole(user.role, "DSP"));

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [action, setAction] = useState<"" | AuditAction>("");
  const [resourceType, setResourceType] = useState("");
  const [outcome, setOutcome] = useState<"" | AuditOutcome>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [verifyLimit, setVerifyLimit] = useState(1000);

  const stats = useAuditStats(allowed);
  const log = useAuditLog(
    {
      page,
      pageSize: PAGE_SIZE,
      search: deferredSearch || undefined,
      action: action || undefined,
      resourceType: resourceType || undefined,
      outcome: outcome || undefined,
      from: dayStart(from),
      to: dayStart(to),
    },
    allowed,
  );
  const verify = useVerifyAuditChain();

  if (!allowed) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader title={pick(L.title)} icon={FileSearch} />
          <EmptyState icon={ShieldCheck} title={pick(L.restrictedTitle)} description={pick(L.restrictedBody)} />
        </div>
      </DashboardLayout>
    );
  }

  const rows = log.data?.data ?? [];
  const totalPages = log.data?.totalPages ?? 0;
  const selectClass = "h-10 rounded-md border border-border bg-background-secondary px-3 text-sm text-foreground";
  const clearAll = () => {
    setSearch("");
    setAction("");
    setResourceType("");
    setOutcome("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title={pick(L.title)} description={pick(L.description)} icon={FileSearch} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label={pick(L.total)} value={stats.data?.total ?? 0} />
          <StatTile label={pick(L.last24h)} value={stats.data?.last24h ?? 0} tone="info" />
          <StatTile label={pick(L.failures24h)} value={stats.data?.failures24h ?? 0} tone="danger" />
        </div>

        <Panel
          title={pick(L.chainTitle)}
          description={pick(L.chainDescription)}
          actions={
            <div className="flex items-center gap-2">
              <select
                aria-label={pick(L.entries)}
                className={selectClass}
                value={verifyLimit}
                onChange={(e) => setVerifyLimit(Number(e.target.value))}
              >
                {[200, 1000, 5000, 10000].map((n) => (
                  <option key={n} value={n}>
                    {n.toLocaleString("en-IN")} {pick(L.entries)}
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={() => verify.mutate(verifyLimit)} disabled={verify.isPending}>
                {verify.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                {pick(L.verify)}
              </Button>
            </div>
          }
        >
          {verify.isError ? (
            <p className="text-sm text-error">
              {pick(L.verifyFailed)}: {verify.error.message}
            </p>
          ) : verify.data ? (
            <div className="space-y-3" data-testid="chain-result">
              <div className="flex flex-wrap items-center gap-3">
                {verify.data.intact ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                    <CheckCircle2 className="h-4 w-4" /> {pick(L.intact)}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-error">
                    <XCircle className="h-4 w-4" /> {pick(L.broken)}
                  </span>
                )}
                <span className="text-xs text-foreground-muted">
                  {pick(L.sequence)} {verify.data.fromSequence}–{verify.data.toSequence} · {formatDateTime(verify.data.verifiedAt)}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                <div>
                  <dt className="text-xs text-foreground-subtle">{pick(L.checked)}</dt>
                  <dd>{verify.data.checked}</dd>
                </div>
                <div>
                  <dt className="text-xs text-foreground-subtle">{pick(L.linkage)}</dt>
                  <dd className={verify.data.linkageBreaks ? "text-error" : ""}>{verify.data.linkageBreaks}</dd>
                </div>
                <div>
                  <dt className="text-xs text-foreground-subtle">{pick(L.mismatches)}</dt>
                  <dd className={verify.data.hashMismatches ? "text-error" : ""}>{verify.data.hashMismatches}</dd>
                </div>
                <div>
                  <dt className="text-xs text-foreground-subtle">{pick(L.recomputed)}</dt>
                  <dd>{verify.data.recomputed}</dd>
                </div>
                <div>
                  <dt className="text-xs text-foreground-subtle">{pick(L.legacy)}</dt>
                  <dd>{verify.data.legacyEntries}</dd>
                </div>
              </dl>
              <p className="text-xs text-foreground-muted">{verify.data.method}</p>
              {verify.data.breaks.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {verify.data.breaks.map((b) => (
                    <li key={`${b.kind}-${b.sequence}`} className="flex items-center gap-2 text-error">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {pick(L.sequence)} {b.sequence} · {b.detail} · {formatDateTime(b.at)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </Panel>

        <Panel bodyClassName="space-y-4 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[16rem] flex-1">
              <Input
                placeholder={pick(L.search)}
                value={search}
                onChange={(v: string) => {
                  setSearch(v);
                  setPage(1);
                }}
              />
            </div>
            <select
              aria-label={pick(L.action)}
              className={selectClass}
              value={action}
              onChange={(e) => {
                setAction(e.target.value as "" | AuditAction);
                setPage(1);
              }}
            >
              <option value="">{pick(L.allActions)}</option>
              {AUDIT_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select
              aria-label={pick(L.record)}
              className={selectClass}
              value={resourceType}
              onChange={(e) => {
                setResourceType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{pick(L.allResources)}</option>
              {(stats.data?.resourceTypes ?? []).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              aria-label={pick(L.outcome)}
              className={selectClass}
              value={outcome}
              onChange={(e) => {
                setOutcome(e.target.value as "" | AuditOutcome);
                setPage(1);
              }}
            >
              <option value="">{pick(L.allOutcomes)}</option>
              {(["SUCCESS", "FAILURE", "DENIED", "PARTIAL"] as const).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <label className="flex flex-col gap-1 text-xs text-foreground-muted">
              {pick(L.from)}
              <input
                type="date"
                className={selectClass}
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-foreground-muted">
              {pick(L.to)}
              <input
                type="date"
                className={selectClass}
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              {pick(L.clear)}
            </Button>
          </div>

          {log.isPending ? (
            <div className="flex items-center justify-center gap-3 py-12 text-foreground-muted">
              <Loader2 className="h-5 w-5 animate-spin" /> {pick(L.loading)}
            </div>
          ) : log.isError ? (
            <EmptyState
              icon={AlertTriangle}
              title={pick(L.loadFailed)}
              description={log.error.message}
              action={
                <Button variant="secondary" onClick={() => log.refetch()}>
                  {pick(L.retry)}
                </Button>
              }
            />
          ) : rows.length === 0 ? (
            <EmptyState title={pick(L.empty)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
                    <th className="py-2 pr-3">{pick(L.when)}</th>
                    <th className="py-2 pr-3">{pick(L.officer)}</th>
                    <th className="py-2 pr-3">{pick(L.action)}</th>
                    <th className="py-2 pr-3">{pick(L.record)}</th>
                    <th className="py-2 pr-3">{pick(L.outcome)}</th>
                    <th className="py-2">{pick(L.detail)}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr key={e.id} className="border-b border-border/60 align-top">
                      <td className="whitespace-nowrap py-2 pr-3 text-foreground-muted">
                        {formatDateTime(e.timestamp)}
                        <div className="font-mono text-[0.7rem] text-foreground-subtle">#{e.sequence}</div>
                      </td>
                      <td className="py-2 pr-3">
                        {e.actorName || pick(L.system)}
                        {e.actorRole && <div className="text-xs text-foreground-subtle">{e.actorRole}</div>}
                      </td>
                      <td className="py-2 pr-3">
                        <span className="font-medium">{e.action}</span>
                        <div className="text-xs text-foreground-subtle">{e.eventType}</div>
                      </td>
                      <td className="py-2 pr-3 text-foreground-muted">{e.resourceType}</td>
                      <td className="py-2 pr-3">
                        <StatusPill tone={outcomeTone[e.outcome]}>{e.outcome}</StatusPill>
                      </td>
                      <td className="py-2 text-foreground-muted">
                        {e.detail}
                        {e.ipAddress && <div className="font-mono text-[0.7rem] text-foreground-subtle">{e.ipAddress}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-foreground-muted">
              <span>
                {pick(L.page)} {page} {pick(L.of)} {totalPages} · {log.data?.total.toLocaleString("en-IN")}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  {pick(L.prev)}
                </Button>
                <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  {pick(L.next)}
                </Button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </DashboardLayout>
  );
}
