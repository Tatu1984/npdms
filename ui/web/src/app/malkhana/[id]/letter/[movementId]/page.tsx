"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import malkhanaApi from "@/lib/api/malkhana";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDay, officerMessage } from "../../../parts";

/**
 * Printable forwarding letter for exhibits sent for forensic examination,
 * assembled from the register: every item sent to the same laboratory under the
 * same memo on the same day.
 */
export default function ForwardingLetterPage() {
  const { t } = useI18n();
  const { id, movementId } = useParams<{ id: string; movementId: string }>();
  const letter = useQuery({
    queryKey: ["malkhana", "item", id, "letter", movementId],
    queryFn: () => malkhanaApi.forwardingLetter(id, movementId),
    enabled: Boolean(id && movementId),
  });
  const l = letter.data;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 bg-background p-6 print:max-w-none print:p-0">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Link href={`/malkhana/${id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ArrowLeft className="h-4 w-4" />
          {t("malkhanaScreen.actions.back")}
        </Link>
        <Button size="sm" onClick={() => window.print()} disabled={!l}>
          <Printer className="h-4 w-4" />
          {t("malkhanaScreen.actions.print")}
        </Button>
      </div>

      {letter.isLoading ? (
        <p className="text-sm text-foreground-muted">…</p>
      ) : letter.isError || !l ? (
        <p className="text-sm text-danger">
          {t("malkhanaScreen.letter.loadFailed")}: {officerMessage(letter.error)}
        </p>
      ) : (
        <article className="flex flex-col gap-4 bg-white p-8 text-sm leading-relaxed text-black" data-testid="forwarding-letter">
          <header className="text-center">
            <p className="font-semibold uppercase">Kolkata Police</p>
            <p>{l.stationName}{l.stationCode ? ` (${l.stationCode})` : ""}</p>
          </header>
          <div className="flex justify-between gap-4">
            <p>{t("malkhanaScreen.letter.ref")} <span className="font-mono">{l.reference}</span></p>
            <p>{t("malkhanaScreen.letter.dated")} {formatDay(l.date)}</p>
          </div>
          <div>
            <p>{t("malkhanaScreen.letter.to")},</p>
            <p>{t("malkhanaScreen.letter.director")},</p>
            <p>{l.laboratory}</p>
          </div>
          <p className="font-semibold">{t("malkhanaScreen.letter.subject")}</p>
          <p>{t("malkhanaScreen.letter.caseLine", { case: l.caseNumber || "—", fir: l.firNumber || "—", station: l.stationName })}</p>
          <p>{t("malkhanaScreen.letter.body")}</p>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {["exhibit", "description", "quantity", "seal", "memo"].map((k) => (
                  <th key={k} className="border border-black px-2 py-1 text-left">
                    {t(`malkhanaScreen.letter.${k as "exhibit"}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {l.items.map((it) => (
                <tr key={it.propertyNumber}>
                  <td className="border border-black px-2 py-1 font-mono">{it.propertyNumber}</td>
                  <td className="border border-black px-2 py-1">{it.description}</td>
                  <td className="border border-black px-2 py-1">
                    {it.quantity} {it.unit}
                    {it.weightGrams ? ` · ${it.weightGrams} g` : ""}
                  </td>
                  <td className="border border-black px-2 py-1 font-mono">{it.sealNumber}</td>
                  <td className="border border-black px-2 py-1 font-mono">{it.seizureMemoRef}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>{t("malkhanaScreen.letter.purpose")}: {l.purpose}</p>
          <p>{t("malkhanaScreen.letter.carrier")}: {l.handedTo}</p>
          <div className="mt-8 self-end text-right">
            <p className="border-t border-black pt-1">{t("malkhanaScreen.letter.signature")}</p>
            <p>{l.signedByName}{l.signedByRank ? `, ${l.signedByRank}` : ""}</p>
          </div>
          <p className="text-[0.65rem] text-gray-600 print:hidden">{t("malkhanaScreen.letter.note")}</p>
        </article>
      )}
    </main>
  );
}
