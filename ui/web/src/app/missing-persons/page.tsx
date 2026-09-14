"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BellRing,
  Camera,
  CheckCircle2,
  FileSearch,
  MapPin,
  Route,
  ScanFace,
  Share2,
  UserPlus,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { MISSING_PERSONS, type MissingPerson } from "@/lib/platform/mock";
import { DataTable, type Column } from "@/components/platform/data-table";
import { act, type Action } from "@/components/platform/actions";
import {
  PageHeader,
  PhaseBadge,
  StatTile,
  StatusPill,
} from "@/components/platform/primitives";
import { AIGovernanceNotice } from "@/components/platform/governance";
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

export default function MissingPersonsPage() {
  const router = useRouter();
  const { t, pick } = useI18n();

  const [registerOpen, setRegisterOpen] = React.useState(false);
  const [searchFor, setSearchFor] = React.useState<MissingPerson | null>(null);
  const [notifyFor, setNotifyFor] = React.useState<MissingPerson | null>(null);

  const active = MISSING_PERSONS.filter((p) => p.status === "active");
  const vulnerable = MISSING_PERSONS.filter((p) => p.vulnerability).length;
  const sightings = MISSING_PERSONS.reduce((s, p) => s + p.sightings, 0);
  const verified = MISSING_PERSONS.reduce((s, p) => s + p.verifiedSightings, 0);

  const columns: Column<MissingPerson>[] = [
    {
      id: "person",
      header: "Person",
      sortValue: (p) => p.name.en,
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{pick(p.name)}</p>
          <p className="mt-0.5 font-mono text-xs text-foreground-subtle">{p.refNumber}</p>
        </div>
      ),
    },
    {
      id: "profile",
      header: "Age / sex",
      hideBelow: "sm",
      sortValue: (p) => p.age,
      cell: (p) => (
        <span className="text-sm">
          {p.age} · {p.gender}
        </span>
      ),
    },
    {
      id: "lastSeen",
      header: "Last seen",
      sortValue: (p) => p.lastSeenAt,
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate text-sm">{pick(p.lastSeen)}</p>
          <p className="text-xs text-foreground-subtle">
            {new Date(p.lastSeenAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
      ),
    },
    {
      id: "station",
      header: "Station",
      hideBelow: "lg",
      sortValue: (p) => p.station,
      cell: (p) => <span className="text-sm">{p.station} PS</span>,
    },
    {
      id: "sightings",
      header: "Sightings",
      sortValue: (p) => p.sightings,
      cell: (p) => (
        <div className="flex items-center gap-1.5">
          <StatusPill tone="info">{p.sightings} candidate</StatusPill>
          {p.verifiedSightings > 0 && (
            <StatusPill tone="success">
              <CheckCircle2 className="h-3 w-3" />
              {p.verifiedSightings}
            </StatusPill>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (p) => p.status,
      cell: (p) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill tone={p.status === "traced" ? "success" : p.status === "active" ? "warning" : "neutral"}>
            {p.status}
          </StatusPill>
          {p.vulnerability && <StatusPill tone="danger">Vulnerable</StatusPill>}
        </div>
      ),
    },
  ];

  const rowActions = (p: MissingPerson): Action[] => [
    act.label("h", p.refNumber),
    act.link("open", "Open case", `/missing-persons/${p.id}`, { icon: FileSearch }),
    act.link("sightings", "Sightings", `/missing-persons/${p.id}?tab=sightings`, { icon: ScanFace }),
    act.link("route", "Movement reconstruction", `/missing-persons/${p.id}?tab=route`, { icon: Route }),
    act.sep("s1"),
    act.run("search", "Search authorised camera feeds", () => setSearchFor(p), { icon: Camera }),
    act.run("notify", "Send family update", () => setNotifyFor(p), { icon: BellRing }),
    act.sep("s2"),
    act.link("lookout", "Add to lookout register", "/lookout", { icon: Users }),
    act.link("alerts", "Broadcast to divisions", "/alerts", { icon: Share2 }),
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.missingPersons")}
          description={t("modules.missingPersonsDesc")}
          icon={FileSearch}
          badge={<PhaseBadge phase={4} />}
          breadcrumb={[
            { label: t("nav.surveillanceGroup") },
            { label: t("modules.missingPersons") },
          ]}
          actions={
            <Button onClick={() => setRegisterOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Register missing person
            </Button>
          }
          menu={[
            act.link("lookout", "Lookout register", "/lookout", { icon: Users }),
            act.link("video", "Camera network", "/video-intelligence", { icon: Camera }),
            act.link("alerts", "Broadcast alerts", "/alerts", { icon: Share2 }),
          ]}
        />

        <Alert variant="info">
          <ScanFace />
          <div>
            <AlertTitle>Matches are candidates, never confirmations</AlertTitle>
            <AlertDescription>
              Appearance similarity narrows the search; an officer verifies every candidate before it
              becomes a recorded sighting. National matching through NCRB and ICJS remains the
              authoritative channel.
            </AlertDescription>
          </div>
        </Alert>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Active cases" value={active.length} icon={FileSearch} tone="warning" />
          <StatTile label="Vulnerable persons" value={vulnerable} icon={Users} tone="danger" />
          <StatTile label="Candidate sightings" value={sightings} icon={ScanFace} tone="info" />
          <StatTile label="Verified sightings" value={verified} icon={CheckCircle2} tone="success" />
        </div>

        <AIGovernanceNotice />

        <DataTable
          rows={MISSING_PERSONS}
          columns={columns}
          rowKey={(p) => p.id}
          rowHref={(p) => `/missing-persons/${p.id}`}
          rowActions={rowActions}
          searchPlaceholder="Search by name, reference number or station…"
        />
      </div>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Register a missing person</DialogTitle>
            <DialogDescription>
              The first 24 hours checklist opens automatically once the record is created.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="mp-name">Name</Label>
              <Input id="mp-name" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mp-age">Age</Label>
              <Input id="mp-age" type="number" />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="mp-seen">Last known location</Label>
              <Input id="mp-seen" placeholder="Address or landmark" />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="mp-clothing">Clothing and distinguishing features</Label>
              <Textarea id="mp-clothing" rows={2} />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="mp-vuln">Vulnerability (where legally appropriate)</Label>
              <Input id="mp-vuln" placeholder="Medical condition, minor, other" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                setRegisterOpen(false);
                router.push(`/missing-persons/${MISSING_PERSONS[0].id}`);
              }}
            >
              Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={searchFor !== null} onOpenChange={(o) => !o && setSearchFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search authorised camera feeds</DialogTitle>
            <DialogDescription>
              {searchFor ? `${pick(searchFor.name)} · ${searchFor.refNumber}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ms-desc">Appearance</Label>
              <Input
                id="ms-desc"
                defaultValue={searchFor ? pick(searchFor.clothing) : ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ms-from">From</Label>
                <Input id="ms-from" type="datetime-local" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ms-to">To</Label>
                <Input id="ms-to" type="datetime-local" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ms-area">Search area</Label>
              <Input id="ms-area" placeholder="Division, station or radius from last sighting" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSearchFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                const target = searchFor;
                setSearchFor(null);
                if (target) router.push(`/missing-persons/${target.id}?tab=sightings`);
              }}
            >
              <Camera className="h-4 w-4" />
              Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notifyFor !== null} onOpenChange={(o) => !o && setNotifyFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send family update</DialogTitle>
            <DialogDescription>
              {notifyFor ? `${pick(notifyFor.name)} · ${notifyFor.refNumber}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="fn-status">Status to share</Label>
              <Input id="fn-status" defaultValue="Search continuing — no confirmed sighting yet" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fn-note">Message</Label>
              <Textarea id="fn-note" rows={3} placeholder="Sent in the family's chosen language" />
            </div>
            <p className="text-xs text-foreground-muted">
              Unverified candidate sightings are never shared with the family.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyFor(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => setNotifyFor(null)}>
              <BellRing className="h-4 w-4" />
              Send update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
