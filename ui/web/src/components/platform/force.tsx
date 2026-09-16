"use client";

import * as React from "react";
import { Building2, Globe2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useAuthStore } from "@/stores/authStore";
import { ApiClientError } from "@/lib/api/client";
import { forceLabel, forceOf, type Force, type ForceLabel } from "@/lib/platform/forces";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * The officer's department, read off the session.
 *
 * There is deliberately no setter. The posting decides the force; a screen that
 * could change it would make the audit trail a matter of opinion.
 */
export function useForce(): { force: Force; label: ForceLabel } {
  const user = useAuthStore((s) => s.user);
  const { isBengali } = useI18n();
  return React.useMemo(() => {
    const force = forceOf(user);
    return { force, label: forceLabel(force, isBengali) };
  }, [user, isBengali]);
}

/**
 * Which department the officer belongs to, stated beside the posting in the top
 * bar. A wing is shown with its parent — "CID · West Bengal Police" — because
 * the wing alone does not say which force an officer is under.
 */
export function ForceStatement({ className }: { className?: string }) {
  const { force, label } = useForce();
  const { t } = useI18n();

  return (
    <span
      className={cn(
        "hidden items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground-muted md:flex",
        className,
      )}
      data-testid="force-statement"
      data-force={force.code}
      title={force.remit ?? undefined}
    >
      <Building2 className="h-3.5 w-3.5 shrink-0 text-foreground-subtle" aria-hidden />
      <span className="sr-only">{t("force.yours")}: </span>
      <span className="max-w-[10rem] truncate font-medium text-foreground">{label.short}</span>
      {label.parent && (
        <>
          <span className="text-foreground-subtle">·</span>
          <span className="max-w-[10rem] truncate">{label.parent}</span>
        </>
      )}
    </span>
  );
}

/**
 * The line that says a register is state-wide.
 *
 * One short statement at the head of the screen rather than a badge on every
 * row: the officer needs to know once that this register is not their force's
 * alone, and then get on with reading it.
 */
export function SharedRegisterNote({
  variant = "register",
  className,
}: {
  /** "watchlist" marks a shared list inside a screen whose other data is not shared. */
  variant?: "register" | "watchlist";
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <Alert variant="info" className={className} data-testid="shared-register-note">
      <Globe2 />
      <div>
        <AlertTitle>{t("force.sharedTitle")}</AlertTitle>
        <AlertDescription>
          {t(variant === "watchlist" ? "force.sharedWatchlistBody" : "force.sharedBody")}
        </AlertDescription>
      </div>
    </Alert>
  );
}

/** The error codes the API uses to say a record belongs to another force. */
const OTHER_FORCE_ERRORS = new Set([
  "other_force",
  "cross_force",
  "force_scope",
  "not_your_force",
]);

export interface OtherForceRefusal {
  /** The recording force's name, when the API names it. */
  force?: string;
  /** What the API said, kept so a stated rule is not replaced by our wording. */
  message?: string;
}

/**
 * Reads a refusal that means "this record is another force's".
 *
 * A 403 alone is not enough — a rank refusal is also a 403 — so the error code
 * in the body decides. Anything else is left to the screen's own handling, and
 * in particular is never turned into an empty list.
 */
export function otherForceRefusal(error: unknown): OtherForceRefusal | null {
  if (!(error instanceof ApiClientError)) return null;
  if (!OTHER_FORCE_ERRORS.has(error.errorType)) return null;
  const named = error.details["force"] ?? error.details["forceName"];
  return {
    force: typeof named === "string" && named ? named : undefined,
    message: error.message || undefined,
  };
}

/**
 * What the officer sees in place of a record that is not their force's.
 *
 * Not an empty list, which reads as "no such record", and not an error toast,
 * which reads as a fault. The boundary is a decision the platform made on
 * purpose, so the screen states it and says how the record could reach them.
 */
export function OtherForceRecord({
  refusal,
  action,
  className,
}: {
  refusal: OtherForceRefusal;
  /** Usually a link back to the officer's own register. */
  action?: React.ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <Alert variant="warning" className={className} data-testid="other-force-record">
      <ShieldAlert />
      <div className="flex flex-col gap-3">
        <div>
          <AlertTitle>{t("force.otherTitle")}</AlertTitle>
          <AlertDescription>
            {refusal.force
              ? t("force.otherBody", { force: refusal.force })
              : t("force.otherBodyUnknown")}
          </AlertDescription>
        </div>
        {action}
      </div>
    </Alert>
  );
}
