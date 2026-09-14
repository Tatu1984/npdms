"use client";

import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { IntegrityState } from "@/lib/api/custody";
import { StatusPill } from "@/components/platform/primitives";

/**
 * Integrity is shown with three distinct states, never two. "Not yet checked"
 * must never be presented as "intact".
 */
export function IntegrityBadge({ state }: { state: IntegrityState }) {
  const { t } = useI18n();
  if (state === "verified") {
    return (
      <StatusPill tone="success">
        <ShieldCheck className="h-3 w-3" />
        {t("custodyScreen.integrity.verified")}
      </StatusPill>
    );
  }
  if (state === "broken") {
    return (
      <StatusPill tone="danger">
        <ShieldAlert className="h-3 w-3" />
        {t("custodyScreen.integrity.broken")}
      </StatusPill>
    );
  }
  return (
    <StatusPill tone="warning">
      <ShieldQuestion className="h-3 w-3" />
      {t("custodyScreen.integrity.pending")}
    </StatusPill>
  );
}

