"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  Boxes,
  ClipboardList,
  Gavel,
  QrCode,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { PROPERTY_ITEMS } from "@/lib/platform/mock";
import {
  Field,
  PageHeader,
  Panel,
  PhaseBadge,
  StatusPill,
} from "@/components/platform/primitives";
import { ChainAnchorChip, IntegrityBadge } from "@/components/platform/governance";
import { act } from "@/components/platform/actions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QrPlaceholder } from "@/components/platform/qr";

const MOVEMENTS = [
  { id: "mv-1", at: "2024-11-21 12:40", from: "Scene of seizure", to: "Investigating officer", by: "ASI Rituparna Ghosh", seal: "Intact", block: 184591 },
  { id: "mv-2", at: "2024-11-21 17:05", from: "Investigating officer", to: "Malkhana — Bhowanipore PS", by: "OC Debashis Roy", seal: "Intact", block: 184596 },
  { id: "mv-3", at: "2024-11-24 11:00", from: "Malkhana — Bhowanipore PS", to: "Cyber cell — Lalbazar", by: "Insp. Arindam Chatterjee", seal: "Intact", block: 184602 },
];

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { t, pick } = useI18n();

  const item = PROPERTY_ITEMS.find((p) => p.id === params.id) ?? PROPERTY_ITEMS[0];
  const [tab, setTab] = React.useState(search.get("tab") ?? "details");
  const [moveOpen, setMoveOpen] = React.useState(false);
  const [qrOpen, setQrOpen] = React.useState(false);
  const [disposeOpen, setDisposeOpen] = React.useState(false);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={pick(item.description)}
          description={`${item.propertyId} · ${item.caseNumber}`}
          icon={Boxes}
          badge={<PhaseBadge phase={14} />}
          breadcrumb={[
            { label: t("modules.malkhana"), href: "/malkhana" },
            { label: item.propertyId },
          ]}
          actions={
            <>
              <Button variant="outline" onClick={() => setQrOpen(true)}>
                <QrCode className="h-4 w-4" />
                Label
              </Button>
              <Button onClick={() => setMoveOpen(true)}>
                <ArrowLeftRight className="h-4 w-4" />
                Record movement
              </Button>
            </>
          }
          menu={[
            act.link("court", "Court production", "/court", { icon: Gavel }),
            act.link("evidence", "Linked digital evidence", "/custody", { icon: ShieldCheck }),
            act.link("case", "Investigation workspace", "/investigation", { icon: ClipboardList }),
            act.sep("s"),
            act.run("dispose", "Start disposal", () => setDisposeOpen(true), {
              icon: Trash2,
              destructive: true,
            }),
          ]}
        />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="custody">Custody events</TabsTrigger>
            <TabsTrigger value="packaging">Packaging &amp; seal</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid gap-4 lg:grid-cols-3">
              <Panel title="Property record" className="lg:col-span-2">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Field label="Property ID" value={item.propertyId} mono />
                  <Field label="Case number" value={item.caseNumber} mono />
                  <Field label="Category" value={item.category} />
                  <Field label="Seized on" value={item.seizedOn} />
                  <Field label="Seized by" value={pick(item.seizedBy)} />
                  <Field label="Storage" value={item.rack} mono />
                  <Field
                    label="Current location"
                    value={<StatusPill tone="info">{item.location}</StatusPill>}
                  />
                  <Field
                    label="Seal"
                    value={
                      <StatusPill tone={item.sealIntact ? "success" : "danger"}>
                        {item.sealNumber} · {item.sealIntact ? "intact" : "broken"}
                      </StatusPill>
                    }
                  />
                </dl>
              </Panel>

              <Panel title="Ledger">
                <div className="flex flex-col gap-3">
                  <IntegrityBadge state={item.integrity} block={item.block} />
                  {item.block && <ChainAnchorChip block={item.block} />}
                  {item.overdueDays && item.overdueDays > 14 && (
                    <p className="rounded-md border border-warning/25 bg-warning-subtle px-3 py-2 text-xs text-foreground-muted">
                      Away from the malkhana for {item.overdueDays} days. Record the reason for the
                      delay on the register.
                    </p>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setQrOpen(true)}>
                    <QrCode className="h-3.5 w-3.5" />
                    Print label
                  </Button>
                </div>
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="custody">
            <Panel
              title="Custody events"
              description="Each movement is signed and anchored"
              actions={
                <Button size="sm" onClick={() => setMoveOpen(true)}>
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Record movement
                </Button>
              }
              bodyClassName="p-0"
            >
              <ol className="divide-y divide-border">
                {MOVEMENTS.map((m, i) => (
                  <li key={m.id} className="flex gap-4 p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-xs font-semibold text-accent">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {m.from} → {m.to}
                        </p>
                        <div className="flex items-center gap-2">
                          <StatusPill tone={m.seal === "Intact" ? "success" : "danger"}>
                            Seal {m.seal.toLowerCase()}
                          </StatusPill>
                          <ChainAnchorChip block={m.block} />
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-foreground-subtle">
                        Signed by {m.by} · {m.at}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          </TabsContent>

          <TabsContent value="packaging">
            <Panel title="Packaging and seal">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Package ID" value={`PKG-${item.propertyId.split("/").pop()}`} mono />
                <Field label="Seal number" value={item.sealNumber} mono />
                <Field
                  label="Seal condition"
                  value={
                    <StatusPill tone={item.sealIntact ? "success" : "danger"}>
                      {item.sealIntact ? "Intact" : "Broken"}
                    </StatusPill>
                  }
                />
                <Field label="Last inspected" value="2024-11-24" />
              </dl>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {["Package front", "Seal close-up", "Contents"].map((label) => (
                  <div
                    key={label}
                    className="flex aspect-video flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-surface-sunken text-xs text-foreground-subtle"
                  >
                    <Boxes className="h-5 w-5" />
                    {label}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setMoveOpen(true)}>
                  Record reseal
                </Button>
                <Button variant="outline" onClick={() => router.push("/forensics")}>
                  Generate forensic transfer document
                </Button>
              </div>
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record movement</DialogTitle>
            <DialogDescription>{item.propertyId}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="pm-to">Moving to</Label>
              <Input id="pm-to" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pm-reason">Reason</Label>
              <Textarea id="pm-reason" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => { setMoveOpen(false); setTab("custody"); }}>
              Sign and record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Property label</DialogTitle>
            <DialogDescription>{item.propertyId}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3">
            <QrPlaceholder />
            <p className="text-center font-mono text-xs text-foreground-muted">
              {item.sealNumber} · {item.rack}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrOpen(false)}>
              {t("common.close")}
            </Button>
            <Button onClick={() => setQrOpen(false)}>{t("common.print")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disposeOpen} onOpenChange={setDisposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start disposal</DialogTitle>
            <DialogDescription>{item.propertyId}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="pd-mode">Mode of disposal</Label>
              <Input id="pd-mode" placeholder="Release, return, destruction, auction, transfer" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pd-order">Court order reference</Label>
              <Input id="pd-order" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisposeOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => { setDisposeOpen(false); router.push("/court"); }}>
              Record disposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
