"use client";

import * as React from "react";
import { Link2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAttachAnprRead } from "@/hooks/use-traffic-incidents";
import { toast } from "@/stores/toastStore";
import { ReadSearchForm } from "./search-panel";
import { LabeledField, errorText, inputClass } from "./shared";

/**
 * Attaches a stored ANPR read to a traffic incident's plate-read register. The
 * API keeps the read's model version and confidence and records it as an
 * AI-assisted observation, never as a measurement.
 */
export function AttachReadDialog({ incidentId, open, onOpenChange }: { incidentId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useI18n();
  const attach = useAttachAnprRead(incidentId);
  const [location, setLocation] = React.useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("anprScreen.attach.title")}</DialogTitle>
          <DialogDescription>{t("anprScreen.attach.description")}</DialogDescription>
        </DialogHeader>
        <ReadSearchForm
          compact
          renderAction={(read) => (
            <Button
              size="sm"
              variant="outline"
              disabled={attach.isPending || (!read.cameraId && location.trim() === "")}
              data-testid="attach-anpr-read"
              onClick={async () => {
                try {
                  await attach.mutateAsync({ plateReadId: read.id, location: location.trim() || undefined });
                  toast.success(t("anprScreen.attach.attached"), read.displayNumber);
                  onOpenChange(false);
                } catch (e) {
                  toast.error(read.displayNumber, errorText(e));
                }
              }}
            >
              <Link2 className="h-4 w-4" /> {t("anprScreen.attach.attach")}
            </Button>
          )}
        />
        <LabeledField label={t("anprScreen.attach.location")} htmlFor="attach-location">
          <input id="attach-location" className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
        </LabeledField>
      </DialogContent>
    </Dialog>
  );
}
