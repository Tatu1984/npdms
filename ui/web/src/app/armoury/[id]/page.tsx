"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, Loader2, Shield } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState, Field, PageHeader, Panel, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { ApiClientError } from "@/lib/api/client";
import { useWeapon, useWeaponIssuances } from "@/hooks/use-armoury";
import type { WeaponCondition, WeaponStatus } from "@/lib/api/armoury";
import { formatDateTime } from "@/lib/utils";

const L = {
  register: { en: "Armoury", bn: "অস্ত্রাগার" },
  loading: { en: "Loading weapon…", bn: "অস্ত্রের তথ্য লোড হচ্ছে…" },
  notFound: { en: "Weapon not found", bn: "অস্ত্র পাওয়া যায়নি" },
  notFoundBody: { en: "No weapon with this id is registered.", bn: "এই পরিচয়ে কোনো অস্ত্র নিবন্ধিত নেই।" },
  loadFailed: { en: "Weapon could not be loaded", bn: "অস্ত্রের তথ্য লোড করা যায়নি" },
  back: { en: "Back to the armoury", bn: "অস্ত্রাগারে ফিরে যান" },
  manage: { en: "Issue, return or change state from the armoury register.", bn: "ইস্যু, ফেরত বা অবস্থা পরিবর্তন অস্ত্রাগার নিবন্ধন থেকে করুন।" },
  details: { en: "Weapon", bn: "অস্ত্র" },
  type: { en: "Type", bn: "ধরন" },
  make: { en: "Make", bn: "প্রস্তুতকারক" },
  serial: { en: "Serial number", bn: "সিরিয়াল নম্বর" },
  station: { en: "Station", bn: "থানা" },
  condition: { en: "Condition", bn: "অবস্থা" },
  maintenanceNote: { en: "Maintenance note", bn: "রক্ষণাবেক্ষণ নোট" },
  registered: { en: "Registered", bn: "নিবন্ধিত" },
  currentIssue: { en: "Currently issued", bn: "বর্তমানে ইস্যু করা" },
  issuedTo: { en: "Issued to", bn: "যাঁকে ইস্যু" },
  issuedBy: { en: "Issued by", bn: "যিনি ইস্যু করেছেন" },
  purpose: { en: "Purpose", bn: "উদ্দেশ্য" },
  rounds: { en: "Rounds issued", bn: "ইস্যু করা রাউন্ড" },
  expected: { en: "Expected back", bn: "ফেরতের প্রত্যাশিত সময়" },
  overdue: { en: "Overdue", bn: "মেয়াদোত্তীর্ণ" },
  ledger: { en: "Issue and return ledger", bn: "ইস্যু ও ফেরত খাতা" },
  noLedger: { en: "This weapon has never been issued.", bn: "এই অস্ত্রটি কখনও ইস্যু হয়নি।" },
  issued: { en: "Issued", bn: "ইস্যু" },
  returned: { en: "Returned", bn: "ফেরত" },
  stillOut: { en: "Still out", bn: "এখনও বাইরে" },
  roundsBack: { en: "Rounds back", bn: "ফেরত রাউন্ড" },
  notReturned: { en: "not returned", bn: "ফেরত আসেনি" },
  page: { en: "Page", bn: "পৃষ্ঠা" },
  prev: { en: "Previous", bn: "আগের" },
  next: { en: "Next", bn: "পরের" },
  retry: { en: "Try again", bn: "আবার চেষ্টা করুন" },
};

const STATUS: Record<WeaponStatus, { label: { en: string; bn: string }; tone: "success" | "info" | "warning" | "neutral" }> = {
  IN_ARMOURY: { label: { en: "In armoury", bn: "অস্ত্রাগারে" }, tone: "success" },
  ISSUED: { label: { en: "Issued", bn: "ইস্যু করা" }, tone: "info" },
  MAINTENANCE: { label: { en: "Maintenance", bn: "রক্ষণাবেক্ষণে" }, tone: "warning" },
  CONDEMNED: { label: { en: "Condemned", bn: "বাতিলকৃত" }, tone: "neutral" },
};

const CONDITION: Record<WeaponCondition, { en: string; bn: string }> = {
  SERVICEABLE: { en: "Serviceable", bn: "ব্যবহারযোগ্য" },
  UNDER_REPAIR: { en: "Under repair", bn: "মেরামতাধীন" },
  UNSERVICEABLE: { en: "Unserviceable", bn: "ব্যবহার অযোগ্য" },
};

export default function WeaponDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { pick } = useI18n();
  const [page, setPage] = useState(1);
  const weapon = useWeapon(id);
  const ledger = useWeaponIssuances(id, page);

  if (weapon.isPending) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center gap-3 text-foreground-muted">
          <Loader2 className="h-5 w-5 animate-spin" /> {pick(L.loading)}
        </div>
      </DashboardLayout>
    );
  }

  if (weapon.isError) {
    // A malformed id (400) is as absent as an unknown one (404).
    const notFound = weapon.error instanceof ApiClientError && (weapon.error.code === 404 || weapon.error.code === 400);
    return (
      <DashboardLayout>
        <EmptyState
          icon={AlertTriangle}
          title={notFound ? pick(L.notFound) : pick(L.loadFailed)}
          description={notFound ? pick(L.notFoundBody) : weapon.error.message}
          action={
            <Link href="/armoury">
              <Button variant="secondary">{pick(L.back)}</Button>
            </Link>
          }
        />
      </DashboardLayout>
    );
  }

  const w = weapon.data;
  const issue = w.currentIssue;
  const rows = ledger.data?.data ?? [];
  const totalPages = ledger.data?.totalPages ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={w.weaponNumber}
          description={`${w.type} · ${w.make}`}
          icon={Shield}
          breadcrumb={[{ label: pick(L.register), href: "/armoury" }, { label: w.weaponNumber }]}
          badge={<StatusPill tone={STATUS[w.status].tone}>{pick(STATUS[w.status].label)}</StatusPill>}
          actions={
            <Link href="/armoury">
              <Button variant="secondary">{pick(L.back)}</Button>
            </Link>
          }
        />
        <p className="text-sm text-foreground-muted">{pick(L.manage)}</p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Panel title={pick(L.details)}>
            <dl className="space-y-3">
              <Field label={pick(L.type)} value={w.type} />
              <Field label={pick(L.make)} value={w.make} />
              <Field label={pick(L.serial)} value={w.serialNumber} mono />
              <Field label={pick(L.station)} value={w.stationName} />
              <Field label={pick(L.condition)} value={pick(CONDITION[w.condition])} />
              {w.maintenanceNote && w.status !== "IN_ARMOURY" && <Field label={pick(L.maintenanceNote)} value={w.maintenanceNote} />}
              <Field label={pick(L.registered)} value={formatDateTime(w.createdAt)} />
            </dl>
          </Panel>

          {issue && (
            <Panel title={pick(L.currentIssue)} className="lg:col-span-2">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={pick(L.issuedTo)} value={`${issue.issuedToName} · ${issue.issuedToBadge}`} />
                <Field label={pick(L.issuedBy)} value={issue.issuedByName} />
                <Field label={pick(L.purpose)} value={issue.purpose} />
                <Field label={pick(L.rounds)} value={issue.roundsIssued} />
                <Field label={pick(L.issued)} value={formatDateTime(issue.issuedAt)} />
                <Field
                  label={pick(L.expected)}
                  value={
                    issue.expectedReturn ? (
                      <span className={issue.overdue ? "text-error" : ""}>
                        {formatDateTime(issue.expectedReturn)}
                        {issue.overdue && ` · ${pick(L.overdue)}`}
                      </span>
                    ) : null
                  }
                />
              </dl>
            </Panel>
          )}

          <Panel title={pick(L.ledger)} className={issue ? "lg:col-span-3" : "lg:col-span-2"}>
            {ledger.isPending ? (
              <div className="flex items-center gap-3 py-6 text-foreground-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> {pick(L.loading)}
              </div>
            ) : ledger.isError ? (
              <div className="space-y-2">
                <p className="text-sm text-error">{ledger.error.message}</p>
                <Button variant="secondary" size="sm" onClick={() => ledger.refetch()}>
                  {pick(L.retry)}
                </Button>
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-foreground-muted">{pick(L.noLedger)}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-foreground-subtle">
                      <th className="py-2 pr-3">{pick(L.issued)}</th>
                      <th className="py-2 pr-3">{pick(L.issuedTo)}</th>
                      <th className="py-2 pr-3">{pick(L.purpose)}</th>
                      <th className="py-2 pr-3 text-right">{pick(L.rounds)}</th>
                      <th className="py-2 pr-3">{pick(L.returned)}</th>
                      <th className="py-2 text-right">{pick(L.roundsBack)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((i) => {
                      const short = i.roundsReturned !== null ? i.roundsIssued - i.roundsReturned : 0;
                      return (
                        <tr key={i.id} className="border-b border-border/60 align-top">
                          <td className="whitespace-nowrap py-2 pr-3 text-foreground-muted">{formatDateTime(i.issuedAt)}</td>
                          <td className="py-2 pr-3">
                            {i.issuedToName}
                            <div className="text-xs text-foreground-subtle">{i.issuedToBadge}</div>
                          </td>
                          <td className="py-2 pr-3">{i.purpose}</td>
                          <td className="py-2 pr-3 text-right">{i.roundsIssued}</td>
                          <td className="py-2 pr-3">
                            {i.returnedAt ? (
                              <>
                                {formatDateTime(i.returnedAt)}
                                <div className="text-xs text-foreground-subtle">
                                  {i.receivedByName}
                                  {i.returnCondition && ` · ${pick(CONDITION[i.returnCondition])}`}
                                </div>
                                {i.returnNote && <div className="text-xs text-foreground-muted">{i.returnNote}</div>}
                              </>
                            ) : (
                              <span className={i.overdue ? "text-error" : "text-foreground-muted"}>
                                {pick(L.stillOut)}
                                {i.overdue && ` · ${pick(L.overdue)}`}
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-right">
                            {i.roundsReturned ?? "—"}
                            {short > 0 && (
                              <div className="text-xs text-error">
                                {short} {pick(L.notReturned)}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-sm text-foreground-muted">
                <span>
                  {pick(L.page)} {page} / {totalPages}
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
      </div>
    </DashboardLayout>
  );
}
