"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Boxes } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import malkhanaApi from "@/lib/api/malkhana";
import { EmptyState } from "@/components/platform/primitives";
import { buttonVariants } from "@/components/ui/button";

/** Destination of a scanned property label: resolves the number and opens the record. */
export default function VerifyPropertyPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { number } = useParams<{ number: string }>();
  const decoded = decodeURIComponent(number ?? "");
  const lookup = useQuery({
    queryKey: ["malkhana", "by-number", decoded],
    queryFn: () => malkhanaApi.byNumber(decoded),
    enabled: Boolean(decoded),
    retry: false,
  });

  React.useEffect(() => {
    if (lookup.data) router.replace(`/malkhana/${lookup.data.id}`);
  }, [lookup.data, router]);

  return (
    <DashboardLayout>
      {lookup.isError ? (
        <EmptyState
          title={t("malkhanaScreen.item.notFound")}
          description={t("malkhanaScreen.verify.notFound", { number: decoded })}
          icon={Boxes}
          action={
            <Link href="/malkhana" className={buttonVariants({ variant: "outline" })}>
              {t("malkhanaScreen.actions.back")}
            </Link>
          }
        />
      ) : (
        <p className="text-sm text-foreground-muted">{t("malkhanaScreen.verify.looking", { number: decoded })}</p>
      )}
    </DashboardLayout>
  );
}
