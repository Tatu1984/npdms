"use client";

import { Suspense, useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, Loader2, Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState, PageHeader, Panel, StatusPill } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { useRecordSearch } from "@/hooks/use-legacy-registers";
import { SEARCH_MIN_LENGTH } from "@/lib/api/search";
import { SEARCH_KIND_LABEL, SEARCH_LABELS as L } from "./labels";

function SearchScreen() {
  const { pick } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const deferred = useDeferredValue(q.trim());
  const result = useRecordSearch(deferred);

  // Keep the address in step so a search can be shared or returned to.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (deferred !== current) {
      router.replace(deferred ? `/search?q=${encodeURIComponent(deferred)}` : "/search");
    }
  }, [deferred, params, router]);

  const tooShort = deferred.length < SEARCH_MIN_LENGTH;

  return (
    <div className="space-y-6">
      <PageHeader title={pick(L.title)} description={pick(L.description)} icon={Search} />

      <Panel bodyClassName="p-4">
        <Input
          autoFocus
          placeholder={pick(L.placeholder)}
          value={q}
          onChange={(v: string) => setQ(v)}
          icon={<Search className="h-4 w-4" />}
        />
        <p className="mt-2 text-xs text-foreground-muted">{pick(L.scope)}</p>
      </Panel>

      {tooShort ? (
        <EmptyState icon={Search} title={pick(L.startTitle)} description={pick(L.startBody)} />
      ) : result.isPending ? (
        <div className="flex items-center justify-center gap-3 py-12 text-foreground-muted">
          <Loader2 className="h-5 w-5 animate-spin" /> {pick(L.searching)}
        </div>
      ) : result.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title={pick(L.failed)}
          description={result.error.message}
          action={
            <Button variant="secondary" onClick={() => result.refetch()}>
              {pick(L.retry)}
            </Button>
          }
        />
      ) : result.data.groups.length === 0 ? (
        <EmptyState title={pick(L.noHits)} description={`“${result.data.query}”`} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {result.data.groups.map((g) => (
            <Panel
              key={g.kind}
              title={pick(SEARCH_KIND_LABEL[g.kind])}
              description={g.hits.length >= result.data.perGroupLimit ? pick(L.limited) : undefined}
            >
              <ul className="divide-y divide-border">
                {g.hits.map((h) => {
                  const body = (
                    <div className="flex items-center justify-between gap-3 py-2">
                      <div className="min-w-0">
                        {h.number && <p className="font-mono text-sm text-foreground">{h.number}</p>}
                        <p className="truncate text-sm text-foreground-muted">{h.title}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {h.status && <StatusPill>{h.status}</StatusPill>}
                        {h.href && <ArrowRight className="h-4 w-4 text-foreground-subtle" />}
                      </div>
                    </div>
                  );
                  return (
                    <li key={`${h.kind}-${h.id}`}>
                      {h.href ? (
                        <Link href={h.href} className="block rounded px-1 hover:bg-background-secondary">
                          {body}
                        </Link>
                      ) : (
                        <div className="px-1">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={null}>
        <SearchScreen />
      </Suspense>
    </DashboardLayout>
  );
}
