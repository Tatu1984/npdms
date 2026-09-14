"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  BellRing,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  MapPin,
  Route,
  ScanFace,
  Share2,
  XCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { MISSING_PERSONS } from "@/lib/platform/mock";
import {
  Field,
  PageHeader,
  Panel,
  PhaseBadge,
  StatTile,
  StatusPill,
} from "@/components/platform/primitives";
import { AIBadge, ConfidenceMeter, AIGovernanceNotice } from "@/components/platform/governance";
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

interface Sighting {
  id: string;
  camera: string;
  place: string;
  at: string;
  confidence: number;
  state: "candidate" | "verified" | "rejected";
  note: string;
}

const SIGHTINGS: Sighting[] = [
  { id: "sg-1", camera: "KP-SLD-031", place: "Sealdah station approach", at: "2024-12-01 17:04", confidence: 0.86, state: "verified", note: "Red backpack and navy uniform consistent with the description." },
  { id: "sg-2", camera: "KMC-GRH-022", place: "Gariahat flyover south", at: "2024-12-01 18:22", confidence: 0.64, state: "candidate", note: "Partial view; clothing colour consistent, face not visible." },
  { id: "sg-3", camera: "TR-EMB-044", place: "EM Bypass, Ruby crossing", at: "2024-12-01 19:41", confidence: 0.52, state: "candidate", note: "Low confidence — similar build only." },
  { id: "sg-4", camera: "KP-ESP-014", place: "Esplanade crossing", at: "2024-12-02 08:15", confidence: 0.41, state: "rejected", note: "Verified as a different person by the reviewing officer." },
];

const CHECKLIST = [
  { id: "c1", label: "Statement of the informant recorded", done: true },
  { id: "c2", label: "Photograph and description circulated to divisions", done: true },
  { id: "c3", label: "Entry made in the missing person register", done: true },
  { id: "c4", label: "Nearby hospitals and shelters contacted", done: false },
  { id: "c5", label: "Transport hubs alerted (rail, bus terminus)", done: false },
  { id: "c6", label: "Details uploaded for national matching", done: false },
];

export default function MissingPersonDetailPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { t, pick } = useI18n();

  const person = MISSING_PERSONS.find((p) => p.id === params.id) ?? MISSING_PERSONS[0];
  const [tab, setTab] = React.useState(search.get("tab") ?? "overview");
  const [sightings, setSightings] = React.useState(SIGHTINGS);
  const [notifyOpen, setNotifyOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  const decide = (id: string, state: Sighting["state"]) =>
    setSightings((prev) => prev.map((s) => (s.id === id ? { ...s, state } : s)));

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={pick(person.name)}
          description={`${person.refNumber} · ${person.station} PS · age ${person.age}`}
          icon={FileSearch}
          badge={<PhaseBadge phase={4} />}
          breadcrumb={[
            { label: t("modules.missingPersons"), href: "/missing-persons" },
            { label: person.refNumber },
          ]}
          actions={
            <>
              <Button variant="outline" onClick={() => setSearchOpen(true)}>
                <Camera className="h-4 w-4" />
                Search feeds
              </Button>
              <Button onClick={() => setNotifyOpen(true)}>
                <BellRing className="h-4 w-4" />
                Family update
              </Button>
            </>
          }
          menu={[
            act.link("lookout", "Add to lookout register", "/lookout", { icon: ScanFace }),
            act.link("broadcast", "Broadcast to divisions", "/alerts", { icon: Share2 }),
            act.link("map", "Show search area", "/gis", { icon: MapPin }),
            act.sep("s"),
            act.link("audit", "Audit trail", "/audit", { icon: ClipboardCheck }),
          ]}
        />

        {person.vulnerability && (
          <div className="rounded-md border border-danger/30 bg-danger-subtle px-3 py-2 text-sm text-foreground">
            <span className="font-semibold text-danger">Vulnerable person.</span>{" "}
            {pick(person.vulnerability)}
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sightings">Sightings ({sightings.length})</TabsTrigger>
            <TabsTrigger value="route">Movement</TabsTrigger>
            <TabsTrigger value="checklist">First 24 hours</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile label="Candidate sightings" value={person.sightings} icon={ScanFace} tone="info" />
                <StatTile label="Verified" value={person.verifiedSightings} icon={CheckCircle2} tone="success" />
                <StatTile
                  label="Hours since last seen"
                  value={Math.round(
                    (Date.now() - new Date(person.lastSeenAt).getTime()) / 3_600_000,
                  )}
                  icon={Route}
                  tone="warning"
                />
                <StatTile label="Checklist complete" value={CHECKLIST.filter((c) => c.done).length} unit={`of ${CHECKLIST.length}`} icon={ClipboardCheck} />
              </div>

              <Panel title="Profile">
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Reference" value={person.refNumber} mono />
                  <Field label="Age / sex" value={`${person.age} · ${person.gender}`} />
                  <Field label="Police station" value={`${person.station} PS`} />
                  <Field label="Last seen" value={pick(person.lastSeen)} />
                  <Field
                    label="Last seen at"
                    value={new Date(person.lastSeenAt).toLocaleString("en-IN")}
                  />
                  <Field label="Status" value={<StatusPill tone="warning">{person.status}</StatusPill>} />
                  <Field
                    label="Clothing and features"
                    value={pick(person.clothing)}
                    className="sm:col-span-2 lg:col-span-3"
                  />
                </dl>
              </Panel>
            </div>
          </TabsContent>

          <TabsContent value="sightings">
            <div className="flex flex-col gap-3">
              <AIGovernanceNotice />
              {sightings.map((s) => (
                <Panel key={s.id}>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{s.place}</p>
                        <p className="mt-0.5 font-mono text-xs text-foreground-subtle">
                          {s.camera} · {s.at}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill
                          tone={
                            s.state === "verified" ? "success" : s.state === "rejected" ? "danger" : "ai"
                          }
                        >
                          {s.state === "verified"
                            ? "Verified sighting"
                            : s.state === "rejected"
                              ? "Rejected"
                              : "Potential match"}
                        </StatusPill>
                        <AIBadge confidence={s.confidence} model="appearance-match" compact />
                      </div>
                    </div>

                    <p className="text-sm text-foreground-muted">{s.note}</p>
                    <ConfidenceMeter value={s.confidence} />

                    {s.state === "candidate" && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => decide(s.id, "rejected")}>
                          <XCircle className="h-3.5 w-3.5" />
                          Not this person
                        </Button>
                        <Button size="sm" onClick={() => decide(s.id, "verified")}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verify sighting
                        </Button>
                      </div>
                    )}
                  </div>
                </Panel>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="route">
            <Panel
              title="Movement reconstruction"
              description="Built from verified sightings only"
              menu={[act.link("map", "Open on map", "/gis", { icon: MapPin })]}
            >
              <ol className="flex flex-col gap-3">
                {sightings
                  .filter((s) => s.state === "verified")
                  .map((s, i) => (
                    <li key={s.id} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success-subtle text-xs font-semibold text-success">
                        {i + 1}
                      </span>
                      <div className="flex-1 rounded-md border border-border p-3">
                        <p className="text-sm text-foreground">{s.place}</p>
                        <p className="font-mono text-xs text-foreground-subtle">{s.at}</p>
                      </div>
                    </li>
                  ))}
                {sightings.filter((s) => s.state === "verified").length === 0 && (
                  <p className="text-sm text-foreground-muted">
                    No verified sightings yet, so no route can be drawn.
                  </p>
                )}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setSearchOpen(true)}>
                  <Camera className="h-4 w-4" />
                  Widen the camera search
                </Button>
                <Button variant="outline" onClick={() => router.push("/gis")}>
                  <MapPin className="h-4 w-4" />
                  Plot probable route
                </Button>
              </div>
            </Panel>
          </TabsContent>

          <TabsContent value="checklist">
            <Panel
              title="First 24 hours"
              description="WBP/SOP/MP/2022/11"
              menu={[act.link("sop", "Open the SOP", "/knowledge", { icon: ClipboardCheck })]}
              bodyClassName="flex flex-col gap-2"
            >
              {CHECKLIST.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 rounded-md border border-border p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    defaultChecked={item.done}
                    className="accent-[var(--accent)]"
                  />
                  <span className={item.done ? "text-foreground-muted line-through" : "text-foreground"}>
                    {item.label}
                  </span>
                </label>
              ))}
            </Panel>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send family update</DialogTitle>
            <DialogDescription>{person.refNumber}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="nf-status">Status</Label>
              <Input id="nf-status" defaultValue="Search continuing" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nf-msg">Message</Label>
              <Textarea id="nf-msg" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => setNotifyOpen(false)}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search authorised camera feeds</DialogTitle>
            <DialogDescription>{pick(person.name)}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="sf-desc">Appearance</Label>
              <Input id="sf-desc" defaultValue={pick(person.clothing)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sf-area">Search radius</Label>
              <Input id="sf-area" defaultValue="3 km from last known location" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSearchOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => { setSearchOpen(false); setTab("sightings"); }}>Search</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
