"use client";

import * as React from "react";
import { ScanFace, ShieldCheck } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmptyState, PageHeader, Panel } from "@/components/platform/primitives";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CandidateCard } from "@/components/face-recognition/CandidateCard";
import { FRStatusBanner } from "@/components/face-recognition/FRStatusBanner";
import { useFRQueue, useFRStatus } from "@/hooks/use-face-recognition";
import { useI18n } from "@/lib/i18n";
import type { FRCandidateStatus } from "@/lib/api/face-recognition";

const selectClass =
  "h-9 rounded-md border border-border bg-background-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent";

/** City-wide queue of face match candidates for control room review. */
export default function FaceMatchReviewPage() {
  const { t } = useI18n();
  const [status, setStatus] = React.useState<FRCandidateStatus | "ALL">("PENDING");
  const [demo, setDemo] = React.useState<"" | "true" | "false">("");
  const [page, setPage] = React.useState(1);
  const frStatus = useFRStatus();
  const queue = useFRQueue({ status, demo: demo === "" ? undefined : demo === "true", page });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <PageHeader title={t("faceRecognitionScreen.queue.title")} description={t("faceRecognitionScreen.queue.description")} icon={ScanFace} />
        {frStatus.data && <FRStatusBanner status={frStatus.data} />}
        <Alert variant="info">
          <ShieldCheck />
          <AlertDescription>{t("faceRecognitionScreen.leadRule")}</AlertDescription>
        </Alert>
        <Panel
          title={`${t("faceRecognitionScreen.candidate.title")} (${queue.data?.total ?? 0})`}
          actions={
            <div className="flex gap-2">
              <select
                aria-label={t("faceRecognitionScreen.queue.filterStatus")}
                className={selectClass}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as FRCandidateStatus | "ALL");
                  setPage(1);
                }}
              >
                {(["PENDING", "CONFIRMED", "REJECTED"] as const).map((s) => (
                  <option key={s} value={s}>
                    {t(`faceRecognitionScreen.candidate.status.${s}`)}
                  </option>
                ))}
                <option value="ALL">{t("faceRecognitionScreen.queue.all")}</option>
              </select>
              <select className={selectClass} value={demo} onChange={(e) => setDemo(e.target.value as "" | "true" | "false")}>
                <option value="">{t("faceRecognitionScreen.queue.all")}</option>
                <option value="true">{t("faceRecognitionScreen.queue.demoOnly")}</option>
                <option value="false">{t("faceRecognitionScreen.queue.realOnly")}</option>
              </select>
            </div>
          }
        >
          {queue.isLoading && <Skeleton className="h-32 w-full" />}
          {queue.isError && <p className="text-sm text-danger">{queue.error instanceof Error ? queue.error.message : ""}</p>}
          {queue.data && queue.data.data.length === 0 && <EmptyState icon={ScanFace} title={t("faceRecognitionScreen.queue.empty")} />}
          <div className="flex flex-col gap-3">
            {(queue.data?.data ?? []).map((c) => (
              <CandidateCard key={c.id} c={c} showReport />
            ))}
          </div>
          {queue.data && queue.data.totalPages > 1 && (
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t("faceRecognitionScreen.queue.previous")}
              </Button>
              <span className="text-xs text-foreground-muted">
                {page} / {queue.data.totalPages}
              </span>
              <Button size="sm" variant="outline" disabled={page >= queue.data.totalPages} onClick={() => setPage((p) => p + 1)}>
                {t("faceRecognitionScreen.queue.next")}
              </Button>
            </div>
          )}
        </Panel>
      </div>
    </DashboardLayout>
  );
}
