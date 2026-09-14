"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  ClipboardList,
  Gavel,
  PackagePlus,
  QrCode,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { PROPERTY_ITEMS, type PropertyItem } from "@/lib/platform/mock";
import { DataTable, type Column } from "@/components/platform/data-table";
import { act, type Action } from "@/components/platform/actions";
import {
  PageHeader,
  PhaseBadge,
  StatTile,
  StatusPill,
} from "@/components/platform/primitives";
import { ChainAnchorChip, IntegrityBadge } from "@/components/platform/governance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QrPlaceholder } from "@/components/platform/qr";

const LOCATION_TONE = {
  malkhana: "success",
  forensic: "info",
  court: "warning",
  io: "neutral",
  disposed: "neutral",
} as const;

export default function MalkhanaPage() {
  const router = useRouter();
  const { t, pick } = useI18n();

  const [registerOpen, setRegisterOpen] = React.useState(false);
  const [moveFor, setMoveFor] = React.useState<PropertyItem | null>(null);
  const [qrFor, setQrFor] = React.useState<PropertyItem | null>(null);
  const [disposeFor, setDisposeFor] = React.useState<PropertyItem | null>(null);

  const overdue = PROPERTY_ITEMS.filter((p) => p.overdueDays && p.overdueDays > 14);
  const sealBroken = PROPERTY_ITEMS.filter((p) => !p.sealIntact);
  const inMalkhana = PROPERTY_ITEMS.filter((p) => p.location === "malkhana").length;
  const atLab = PROPERTY_ITEMS.filter((p) => p.location === "forensic").length;

  const columns: Column<PropertyItem>[] = [
    {
      id: "property",
      header: "Property",
      sortValue: (p) => p.propertyId,
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{pick(p.description)}</p>
          <p className="mt-0.5 font-mono text-xs text-foreground-subtle">{p.propertyId}</p>
        </div>
      ),
    },
    {
      id: "case",
      header: "Case",
      hideBelow: "lg",
      sortValue: (p) => p.caseNumber,
      cell: (p) => <span className="font-mono text-xs">{p.caseNumber}</span>,
    },
    {
      id: "category",
      header: "Category",
      hideBelow: "sm",
      sortValue: (p) => p.category,
      cell: (p) => <StatusPill tone={p.category === "weapon" ? "danger" : "neutral"}>{p.category}</StatusPill>,
    },
    {
      id: "storage",
      header: "Storage",
      hideBelow: "md",
      sortValue: (p) => p.rack,
      cell: (p) => (
        <div>
          <p className="font-mono text-xs text-foreground">{p.rack}</p>
          <p className="font-mono text-[0.65rem] text-foreground-subtle">{p.sealNumber}</p>
        </div>
      ),
    },
    {
      id: "location",
      header: "Location",
      sortValue: (p) => p.location,
      cell: (p) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill tone={LOCATION_TONE[p.location]}>{p.location}</StatusPill>
          {!p.sealIntact && <StatusPill tone="danger">Seal broken</StatusPill>}
          {p.overdueDays && p.overdueDays > 14 && (
            <StatusPill tone="warning">{p.overdueDays} days out</StatusPill>
          )}
        </div>
      ),
    },
    {
      id: "integrity",
      header: "Ledger",
      sortValue: (p) => p.integrity,
      cell: (p) => (
        <div className="flex flex-col items-start gap-1">
          <IntegrityBadge state={p.integrity} />
          {p.block && <ChainAnchorChip block={p.block} />}
        </div>
      ),
    },
  ];

  const rowActions = (p: PropertyItem): Action[] => [
    act.label("h", p.propertyId),
    act.link("open", "Open property record", `/malkhana/${p.id}`, { icon: Boxes }),
    act.link("chain", "Custody events", `/malkhana/${p.id}?tab=custody`, { icon: ArrowLeftRight }),
    act.sep("s1"),
    act.run("move", "Record movement", () => setMoveFor(p), { icon: ArrowLeftRight }),
    act.run("qr", "Print QR label", () => setQrFor(p), { icon: QrCode }),
    act.sep("s2"),
    act.link("court", "Court production", "/court", { icon: Gavel }),
    act.link("evidence", "Linked digital evidence", "/custody", { icon: ShieldCheck }),
    act.run("dispose", "Start disposal", () => setDisposeFor(p), { icon: Trash2, destructive: true }),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.malkhana")}
          description={t("modules.malkhanaDesc")}
          icon={Boxes}
          badge={<PhaseBadge phase={14} />}
          breadcrumb={[{ label: t("nav.evidenceGroup") }, { label: t("modules.malkhana") }]}
          actions={
            <Button onClick={() => setRegisterOpen(true)}>
              <PackagePlus className="h-4 w-4" />
              Register property
            </Button>
          }
          menu={[
            act.link("custody", "Digital evidence ledger", "/custody", { icon: ShieldCheck }),
            act.link("audit", "Malkhana audit", "/audit", { icon: ClipboardList }),
            act.link("sop", "Malkhana SOP", "/knowledge", { icon: ClipboardList }),
          ]}
        />

        {(overdue.length > 0 || sealBroken.length > 0) && (
          <Alert variant="warning">
            <AlertTriangle />
            <div>
              <AlertTitle>
                {overdue.length} item{overdue.length === 1 ? "" : "s"} overdue
                {sealBroken.length > 0 && `, ${sealBroken.length} with a broken seal`}
              </AlertTitle>
              <AlertDescription>
                Items away from the malkhana beyond the permitted period, or whose seal condition has
                changed, require an explanation on the register.
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile label="Total properties" value={PROPERTY_ITEMS.length} icon={Boxes} />
          <StatTile label="In malkhana" value={inMalkhana} icon={Boxes} tone="success" />
          <StatTile label="At forensic lab" value={atLab} icon={ShieldCheck} tone="info" />
          <StatTile label="Overdue" value={overdue.length} icon={AlertTriangle} tone="warning" />
          <StatTile label="Seal broken" value={sealBroken.length} icon={AlertTriangle} tone="danger" />
        </div>

        <DataTable
          rows={PROPERTY_ITEMS}
          columns={columns}
          rowKey={(p) => p.id}
          rowHref={(p) => `/malkhana/${p.id}`}
          rowActions={rowActions}
          searchPlaceholder="Search by property ID, case number, seal or description…"
        />
      </div>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Register seized property</DialogTitle>
            <DialogDescription>
              A QR identifier is generated and the entry anchored to the custody ledger.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="pp-case">Case / FIR number</Label>
              <Input id="pp-case" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pp-cat">Category</Label>
              <Input id="pp-cat" placeholder="Weapon, electronics, currency…" />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="pp-desc">Description</Label>
              <Textarea id="pp-desc" rows={2} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pp-rack">Rack / shelf</Label>
              <Input id="pp-rack" placeholder="e.g. R-04 / S-12" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pp-seal">Seal number</Label>
              <Input id="pp-seal" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                setRegisterOpen(false);
                router.push(`/malkhana/${PROPERTY_ITEMS[0].id}`);
              }}
            >
              Register and print label
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moveFor !== null} onOpenChange={(o) => !o && setMoveFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record movement</DialogTitle>
            <DialogDescription>{moveFor?.propertyId}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="mv-to">Moving to</Label>
              <Input id="mv-to" placeholder="Forensic lab, court, investigating officer, malkhana" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mv-reason">Reason</Label>
              <Textarea id="mv-reason" rows={2} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mv-seal">Seal condition at handover</Label>
              <Input id="mv-seal" defaultValue="Intact" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                const target = moveFor;
                setMoveFor(null);
                if (target) router.push(`/malkhana/${target.id}?tab=custody`);
              }}
            >
              Sign and record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={qrFor !== null} onOpenChange={(o) => !o && setQrFor(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Property label</DialogTitle>
            <DialogDescription>{qrFor?.propertyId}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3">
            <QrPlaceholder />
            <p className="text-center font-mono text-xs text-foreground-muted">
              {qrFor?.sealNumber} · {qrFor?.rack}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrFor(null)}>
              {t("common.close")}
            </Button>
            <Button onClick={() => setQrFor(null)}>{t("common.print")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disposeFor !== null} onOpenChange={(o) => !o && setDisposeFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start disposal</DialogTitle>
            <DialogDescription>
              {disposeFor?.propertyId} — disposal requires a court order reference.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="dp-mode">Mode of disposal</Label>
              <Input id="dp-mode" placeholder="Release, return, destruction, auction, transfer" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dp-order">Court order reference</Label>
              <Input id="dp-order" placeholder="Order number and date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisposeFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                setDisposeFor(null);
                router.push("/court");
              }}
            >
              Record disposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
