"use client";

import * as React from "react";
import { ArrowLeftRight, Check, Loader2, Send, ShieldCheck, Undo2, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { hasMinimumRole, useAuthStore } from "@/stores/authStore";
import { useForce } from "@/components/platform/force";
import { referralDestinations, forceName } from "@/lib/platform/forces";
import {
  useDecideReferral,
  useProposeReferral,
  useReferrals,
  useWithdrawReferral,
} from "@/hooks/use-referrals";
import {
  REFERRAL_RECORD_TYPES,
  type Referral,
  type ReferralRecordType,
  type ReferralStatus,
} from "@/lib/api/referrals";
import { ApiClientError } from "@/lib/api/client";
import { EmptyState, PageHeader, Panel, StatusPill } from "@/components/platform/primitives";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { toast } from "@/stores/toastStore";
import { formatDateTime } from "@/lib/utils";
import type { Role } from "@/types";

/**
 * Referrals between the four departments.
 *
 * This is the screen the boundary is for. Everywhere else an officer reads
 * their own force's records; here a record is handed over, with a reason on the
 * way out and a decision on the way back, and neither half can happen quietly.
 */

const STATUS_TONE: Record<ReferralStatus, "info" | "success" | "danger" | "neutral"> = {
  PROPOSED: "info",
  ACCEPTED: "success",
  DECLINED: "danger",
  WITHDRAWN: "neutral",
};

export default function ReferralsPage() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const { force } = useForce();
  const incoming = useReferrals({ direction: "incoming" });
  const outgoing = useReferrals({ direction: "outgoing" });
  const [proposing, setProposing] = React.useState(false);

  // The API lets the Officer-in-Charge and above propose and decide. The floor
  // is mirrored here to decide what to offer; the API's answer is the authority.
  const canAct = Boolean(user && hasMinimumRole(user.role as Role, "SHO"));

  const awaiting = (incoming.data ?? []).filter((r) => r.status === "PROPOSED").length;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("referrals.name")}
          description={t("referrals.desc")}
          icon={ArrowLeftRight}
          breadcrumb={[{ label: t("nav.knowledgeGroup") }, { label: t("referrals.name") }]}
          actions={
            canAct ? (
              <Button onClick={() => setProposing(true)} data-testid="propose-referral">
                <Send className="h-4 w-4" />
                {t("referrals.propose")}
              </Button>
            ) : undefined
          }
        />

        <Alert variant="info">
          <ArrowLeftRight />
          <div>
            <AlertDescription>{t("referrals.lead")}</AlertDescription>
          </div>
        </Alert>

        {!canAct && (
          <Alert variant="default">
            <ShieldCheck />
            <div>
              <AlertDescription>{t("referrals.needsSHO")}</AlertDescription>
            </div>
          </Alert>
        )}

        <Direction
          title={t("referrals.incoming")}
          note={awaiting > 0 ? t("referrals.awaitingYou", { n: awaiting }) : undefined}
          query={incoming}
          empty={t("referrals.incomingEmpty")}
          direction="incoming"
          canAct={canAct}
        />

        <Direction
          title={t("referrals.outgoing")}
          query={outgoing}
          empty={t("referrals.outgoingEmpty")}
          direction="outgoing"
          canAct={canAct}
        />
      </div>

      {proposing && (
        <ProposeDialog
          ownForceCode={force.code}
          onClose={() => setProposing(false)}
        />
      )}
    </DashboardLayout>
  );
}

function Direction({
  title,
  note,
  query,
  empty,
  direction,
  canAct,
}: {
  title: string;
  note?: string;
  query: ReturnType<typeof useReferrals>;
  empty: string;
  direction: "incoming" | "outgoing";
  canAct: boolean;
}) {
  const { t } = useI18n();
  const rows = query.data ?? [];

  return (
    <Panel title={title} description={note} bodyClassName="p-0">
      {query.isPending ? (
        <p className="flex items-center gap-2 p-6 text-sm text-foreground-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("common.loading")}
        </p>
      ) : query.isError ? (
        <div className="p-4">
          <Alert variant="danger">
            <X />
            <div>
              <AlertDescription>
                {query.error instanceof Error ? query.error.message : t("common.error")}
              </AlertDescription>
            </div>
          </Alert>
        </div>
      ) : rows.length === 0 ? (
        <div className="p-4">
          <EmptyState title={empty} icon={ArrowLeftRight} />
        </div>
      ) : (
        <ul className="divide-y divide-border" data-testid={`referrals-${direction}`}>
          {rows.map((r) => (
            <ReferralRow key={r.id} referral={r} direction={direction} canAct={canAct} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ReferralRow({
  referral,
  direction,
  canAct,
}: {
  referral: Referral;
  direction: "incoming" | "outgoing";
  canAct: boolean;
}) {
  const { t } = useI18n();
  const decide = useDecideReferral();
  const withdraw = useWithdrawReferral();
  const [deciding, setDeciding] = React.useState<"accept" | "decline" | null>(null);
  const [withdrawing, setWithdrawing] = React.useState(false);
  const [note, setNote] = React.useState("");
  // A refusal is the rule that stopped it, stated against this referral rather
  // than thrown away in a toast.
  const [refusal, setRefusal] = React.useState<string | null>(null);

  const open = referral.status === "PROPOSED";
  const other =
    direction === "incoming" ? referral.fromForceShortName : referral.toForceShortName;

  const fail = (err: unknown) => {
    // 403 and 409 here are stated rules — not yours to decide, already decided.
    if (err instanceof ApiClientError && (err.code === 403 || err.code === 409)) {
      setRefusal(err.message);
      return;
    }
    toast.error(referral.referralNumber, err instanceof Error ? err.message : t("common.error"));
  };

  const submitDecision = async () => {
    if (!deciding) return;
    setRefusal(null);
    try {
      await decide.mutateAsync({
        id: referral.id,
        input: { accept: deciding === "accept", note: note.trim() },
      });
      toast.success(t(deciding === "accept" ? "referrals.accepted" : "referrals.declined"), referral.referralNumber);
      setDeciding(null);
      setNote("");
    } catch (err) {
      setDeciding(null);
      fail(err);
    }
  };

  const submitWithdraw = async () => {
    setRefusal(null);
    try {
      await withdraw.mutateAsync(referral.id);
      toast.success(t("referrals.withdrawn"), referral.referralNumber);
      setWithdrawing(false);
    } catch (err) {
      setWithdrawing(false);
      fail(err);
    }
  };

  return (
    <li className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono text-foreground">{referral.referralNumber}</span>
            <StatusPill tone={STATUS_TONE[referral.status]}>
              {t(`referrals.status.${referral.status}` as TranslationKey)}
            </StatusPill>
            <span className="text-foreground-subtle">
              {t(`referrals.types.${referral.recordType}` as TranslationKey)}
              {referral.recordReference ? ` ${referral.recordReference}` : ""}
            </span>
          </p>
          <p className="mt-1 text-sm text-foreground-muted">
            {referral.fromForceShortName} → {referral.toForceShortName}
            {referral.referredByName && (
              <>
                {" · "}
                {t("referrals.referredBy")} {referral.referredByName}
              </>
            )}
            {" · "}
            {formatDateTime(referral.referredAt)}
          </p>
        </div>

        {open && canAct && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {direction === "incoming" ? (
              <>
                <Button size="sm" onClick={() => setDeciding("accept")} data-testid="accept-referral">
                  <Check className="h-4 w-4" />
                  {t("referrals.accept")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDeciding("decline")}>
                  <X className="h-4 w-4" />
                  {t("referrals.decline")}
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setWithdrawing(true)}>
                <Undo2 className="h-4 w-4" />
                {t("referrals.withdraw")}
              </Button>
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-foreground">{referral.reason}</p>
      {referral.authority && (
        <p className="text-xs text-foreground-subtle">
          {t("referrals.authority")}: {referral.authority}
        </p>
      )}

      {referral.decidedAt && (
        <p className="text-xs text-foreground-muted">
          {t("referrals.decidedBy")} {referral.decidedByName ?? other} ·{" "}
          {formatDateTime(referral.decidedAt)}
          {referral.decisionNote ? ` — ${referral.decisionNote}` : ""}
        </p>
      )}

      {refusal && (
        <Alert variant="info" data-testid="referral-refusal">
          <ShieldCheck />
          <div>
            <AlertTitle>{t("referrals.refusedTitle")}</AlertTitle>
            <AlertDescription>{refusal}</AlertDescription>
          </div>
        </Alert>
      )}

      {deciding && (
        <Modal
          isOpen
          onClose={() => setDeciding(null)}
          title={t("referrals.decideTitle", {
            decision: t(deciding === "accept" ? "referrals.accept" : "referrals.decline"),
            number: referral.referralNumber,
          })}
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("referrals.note")}</span>
            <textarea
              className="min-h-24 rounded-md border border-border bg-surface px-3 py-2 text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <span className="text-xs text-foreground-subtle">{t("referrals.noteHelp")}</span>
          </label>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setDeciding(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submitDecision} disabled={decide.isPending} data-testid="confirm-decision">
              {decide.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t(deciding === "accept" ? "referrals.accept" : "referrals.decline")}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {withdrawing && (
        <Modal
          isOpen
          onClose={() => setWithdrawing(false)}
          title={t("referrals.withdrawConfirm", { number: referral.referralNumber })}
        >
          <p className="text-sm text-foreground-muted">{t("referrals.withdrawBody")}</p>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setWithdrawing(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submitWithdraw} disabled={withdraw.isPending}>
              {withdraw.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("referrals.withdraw")}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </li>
  );
}

function ProposeDialog({
  ownForceCode,
  onClose,
}: {
  ownForceCode: string;
  onClose: () => void;
}) {
  const { t, isBengali } = useI18n();
  const { force } = useForce();
  const propose = useProposeReferral();
  const destinations = React.useMemo(() => referralDestinations(force), [force]);

  const [recordType, setRecordType] = React.useState<ReferralRecordType>("CASE");
  const [recordId, setRecordId] = React.useState("");
  const [toForceCode, setToForceCode] = React.useState(destinations[0]?.code ?? "");
  const [reason, setReason] = React.useState("");
  const [authority, setAuthority] = React.useState("");
  const [refusal, setRefusal] = React.useState<string | null>(null);

  const ready = recordId.trim().length > 0 && reason.trim().length > 0 && toForceCode !== ownForceCode;

  const send = async () => {
    setRefusal(null);
    try {
      const created = await propose.mutateAsync({
        recordType,
        recordId: recordId.trim(),
        toForceCode,
        reason: reason.trim(),
        authority: authority.trim() || undefined,
      });
      toast.success(t("referrals.sent"), created.referralNumber);
      onClose();
    } catch (err) {
      // A record that is not this force's, or one already out on a live
      // referral, is a rule — stated here rather than dropped into a toast.
      if (err instanceof ApiClientError && (err.code === 403 || err.code === 409)) {
        setRefusal(err.message);
        return;
      }
      toast.error(t("referrals.propose"), err instanceof Error ? err.message : t("common.error"));
    }
  };

  const fieldClass = "rounded-md border border-border bg-surface px-3 py-2 text-sm";

  return (
    <Modal isOpen onClose={onClose} title={t("referrals.proposeTitle")} description={t("referrals.proposeLead")} size="lg">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("referrals.recordType")}</span>
            <select
              className={fieldClass}
              value={recordType}
              onChange={(e) => setRecordType(e.target.value as ReferralRecordType)}
            >
              {REFERRAL_RECORD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`referrals.types.${type}` as TranslationKey)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">{t("referrals.toForce")}</span>
            <select
              className={fieldClass}
              value={toForceCode}
              onChange={(e) => setToForceCode(e.target.value)}
              data-testid="referral-to-force"
            >
              {destinations.map((d) => (
                <option key={d.code} value={d.code}>
                  {forceName(d, isBengali)}
                  {d.parentName ? ` · ${d.parentName}` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t("referrals.recordId")}</span>
          <input
            className={`${fieldClass} font-mono`}
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            data-testid="referral-record-id"
          />
          <span className="text-xs text-foreground-subtle">{t("referrals.recordIdHelp")}</span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t("referrals.reason")}</span>
          <textarea
            className={`${fieldClass} min-h-24`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            data-testid="referral-reason"
          />
          <span className="text-xs text-foreground-subtle">{t("referrals.reasonHelp")}</span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-foreground">{t("referrals.authority")}</span>
          <input className={fieldClass} value={authority} onChange={(e) => setAuthority(e.target.value)} />
          <span className="text-xs text-foreground-subtle">{t("referrals.authorityHelp")}</span>
        </label>

        {refusal && (
          <Alert variant="info" data-testid="propose-refusal">
            <ShieldCheck />
            <div>
              <AlertTitle>{t("referrals.refusedTitle")}</AlertTitle>
              <AlertDescription>{refusal}</AlertDescription>
            </div>
          </Alert>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button onClick={send} disabled={!ready || propose.isPending} data-testid="send-referral">
          {propose.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {t("referrals.send")}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
