"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CircleSlash,
  Clapperboard,
  Filter,
  MapPin,
  Route,
  ScanSearch,
  Sparkles,
  Video,
  VideoOff,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useI18n } from "@/lib/i18n";
import { CAMERAS, VIDEO_EVENTS, type CameraFeed, type VideoEvent } from "@/lib/platform/mock";
import {
  EmptyState,
  Field,
  PageHeader,
  Panel,
  PhaseBadge,
  SeverityBadge,
  StatTile,
  StatusPill,
} from "@/components/platform/primitives";
import { AIBadge, AIGovernanceNotice, ConfidenceMeter } from "@/components/platform/governance";
import { act, ActionMenu, type Action } from "@/components/platform/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AnimatedList, AnimatedListItem, PulseDot } from "@/components/reactbits";

export default function VideoIntelligencePage() {
  const router = useRouter();
  const { t, pick } = useI18n();

  const [searchOpen, setSearchOpen] = React.useState(false);
  const [trackOpen, setTrackOpen] = React.useState(false);
  const [cameraSheet, setCameraSheet] = React.useState<CameraFeed | null>(null);
  const [eventSheet, setEventSheet] = React.useState<VideoEvent | null>(null);
  const [events, setEvents] = React.useState(VIDEO_EVENTS);

  const decide = (id: string, status: VideoEvent["status"]) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));

  const online = CAMERAS.filter((c) => c.status === "online").length;
  const offline = CAMERAS.filter((c) => c.status === "offline").length;
  const newEvents = events.filter((e) => e.status === "new").length;

  const cameraActions = (c: CameraFeed): Action[] => [
    act.label("h", c.code),
    act.run("open", "Open live feed", () => setCameraSheet(c), { icon: Video }),
    act.run("search", "Search this camera", () => setSearchOpen(true), { icon: ScanSearch }),
    act.run("track", "Start multi-camera track", () => setTrackOpen(true), { icon: Route }),
    act.sep("s"),
    act.link("map", "Show on map", "/gis", { icon: MapPin }),
    act.link("incident", "Attach to an incident", "/dispatch", { icon: Clapperboard }),
  ];

  return (
    <DashboardLayout ops>
      <div className="flex flex-col gap-5">
        <PageHeader
          title={t("modules.videoIntelligence")}
          description={t("modules.videoIntelligenceDesc")}
          icon={Video}
          badge={<PhaseBadge phase={3} />}
          breadcrumb={[
            { label: t("nav.surveillanceGroup") },
            { label: t("modules.videoIntelligence") },
          ]}
          actions={
            <>
              <Button variant="outline" onClick={() => setTrackOpen(true)}>
                <Route className="h-4 w-4" />
                Multi-camera track
              </Button>
              <Button onClick={() => setSearchOpen(true)}>
                <Sparkles className="h-4 w-4" />
                Natural-language search
              </Button>
            </>
          }
          menu={[
            act.link("cameras", "Camera register", "/gis", { icon: MapPin }),
            act.link("dispatch", "Dispatch console", "/dispatch", { icon: Clapperboard }),
            act.link("accident", "Accident reconstruction", "/accident-reconstruction", {
              icon: Route,
            }),
            act.sep("s"),
            act.link("audit", "Purpose-based search log", "/audit", { icon: ScanSearch }),
          ]}
        />

        <AIGovernanceNotice />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Cameras integrated" value={CAMERAS.length} icon={Camera} />
          <StatTile label="Online" value={online} icon={Video} tone="success" />
          <StatTile label="Offline" value={offline} icon={VideoOff} tone="danger" />
          <StatTile label="Unreviewed events" value={newEvents} icon={ScanSearch} tone="warning" />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <Panel
            title="Camera wall"
            description="Feeds from KP, KMC, Traffic and integrated private cameras"
            actions={<PulseDot label="Live" />}
            bodyClassName="grid gap-3 sm:grid-cols-2"
          >
            {CAMERAS.map((c) => (
              <div
                key={c.id}
                className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface-sunken"
              >
                <button
                  type="button"
                  onClick={() => setCameraSheet(c)}
                  className="relative aspect-video w-full overflow-hidden ops-grid text-left"
                >
                  <span className="absolute inset-0 flex items-center justify-center">
                    {c.status === "offline" ? (
                      <VideoOff className="h-7 w-7 text-foreground-subtle" />
                    ) : (
                      <Camera className="h-7 w-7 text-foreground-subtle transition-transform group-hover:scale-110" />
                    )}
                  </span>
                  <span className="absolute left-2 top-2">
                    <StatusPill
                      tone={
                        c.status === "online" ? "success" : c.status === "degraded" ? "warning" : "danger"
                      }
                    >
                      {c.status}
                    </StatusPill>
                  </span>
                  <span className="absolute bottom-2 left-2 font-mono text-[0.65rem] text-foreground-muted">
                    {c.code}
                  </span>
                </button>

                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{pick(c.name)}</p>
                    <p className="truncate text-xs text-foreground-subtle">
                      {c.owner} · {c.analytics.join(", ")}
                    </p>
                  </div>
                  <ActionMenu size="sm" actions={cameraActions(c)} />
                </div>
              </div>
            ))}
          </Panel>

          <Panel
            title="AI event feed"
            description="Prioritised by the risk engine — confirm or dismiss each event"
            menu={[
              act.link("all", "Open alerts register", "/alerts", { icon: Filter }),
              act.link("dispatch", "Dispatch console", "/dispatch", { icon: Clapperboard }),
            ]}
            bodyClassName="p-0"
          >
            {events.length === 0 ? (
              <EmptyState title="No events" description="Nothing has been detected in this window." />
            ) : (
              <AnimatedList className="divide-y divide-border">
                {events.map((e) => (
                  <AnimatedListItem key={e.id}>
                    <div className="flex flex-col gap-2 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setEventSheet(e)}
                          className="min-w-0 text-left"
                        >
                          <p className="truncate text-sm font-medium text-foreground hover:text-accent">
                            {pick(e.type)}
                          </p>
                          <p className="truncate text-xs text-foreground-subtle">
                            {e.camera} · {e.at}
                          </p>
                        </button>
                        <SeverityBadge level={e.severity} />
                      </div>

                      <p className="text-xs text-foreground-muted">{pick(e.reason)}</p>
                      <ConfidenceMeter value={e.confidence} />

                      {e.status === "new" ? (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => decide(e.id, "dismissed")}>
                            <CircleSlash className="h-3.5 w-3.5" />
                            Dismiss
                          </Button>
                          <Button size="sm" onClick={() => decide(e.id, "confirmed")}>
                            Confirm
                          </Button>
                          <ActionMenu
                            size="sm"
                            actions={[
                              act.run("view", "Open event", () => setEventSheet(e), { icon: Video }),
                              act.run("track", "Track subject across cameras", () => setTrackOpen(true), {
                                icon: Route,
                              }),
                              act.link("dispatch", "Raise dispatch incident", "/dispatch", {
                                icon: Clapperboard,
                              }),
                            ]}
                          />
                        </div>
                      ) : (
                        <StatusPill tone={e.status === "confirmed" ? "success" : "neutral"}>
                          {e.status === "confirmed" ? "Confirmed by operator" : "Dismissed"}
                        </StatusPill>
                      )}
                    </div>
                  </AnimatedListItem>
                ))}
              </AnimatedList>
            )}
          </Panel>
        </div>
      </div>

      {/* natural-language search */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Natural-language video search</DialogTitle>
            <DialogDescription>
              Searches indexed video metadata, not raw footage. Every search is logged against a
              stated purpose.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="nl-q">Query</Label>
              <Input
                id="nl-q"
                defaultValue="White SUV through Park Street between 8 PM and 10 PM"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="nl-from">From</Label>
                <Input id="nl-from" type="datetime-local" defaultValue="2024-12-02T20:00" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="nl-to">To</Label>
                <Input id="nl-to" type="datetime-local" defaultValue="2024-12-02T22:00" />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nl-purpose">Purpose of search</Label>
              <Input id="nl-purpose" placeholder="Case number or authorisation reference" />
            </div>
            <p className="rounded-md border border-warning/25 bg-warning-subtle px-3 py-2 text-xs text-foreground-muted">
              Person search is restricted to cases with a recorded authorisation. The purpose you
              enter is written to the audit trail with your badge number.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSearchOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => { setSearchOpen(false); setTrackOpen(true); }}>
              <ScanSearch className="h-4 w-4" />
              Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* multi-camera track */}
      <Dialog open={trackOpen} onOpenChange={setTrackOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Multi-camera track</DialogTitle>
            <DialogDescription>
              Candidate sightings of the same subject across adjacent cameras. Each is a candidate
              until an operator confirms it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {[
              { cam: "TR-PKS-007", place: "Park Street / Camac Street", at: "20:14:22", conf: 0.91 },
              { cam: "KP-ESP-014", place: "Esplanade crossing", at: "20:21:05", conf: 0.84 },
              { cam: "KMC-GRH-022", place: "Gariahat flyover south", at: "20:33:47", conf: 0.62 },
            ].map((hop, i) => (
              <div key={hop.cam} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-xs font-semibold text-accent">
                  {i + 1}
                </span>
                <div className="flex flex-1 flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">{hop.place}</p>
                    <p className="font-mono text-xs text-foreground-subtle">
                      {hop.cam} · {hop.at}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ConfidenceMeter value={hop.conf} showLabel={false} />
                    <AIBadge compact />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrackOpen(false)}>
              {t("common.close")}
            </Button>
            <Button onClick={() => { setTrackOpen(false); router.push("/investigation"); }}>
              Attach to investigation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* camera sheet */}
      <Sheet open={cameraSheet !== null} onOpenChange={(o) => !o && setCameraSheet(null)}>
        <SheetContent className="w-[30rem]">
          {cameraSheet && (
            <>
              <SheetHeader>
                <SheetTitle>{pick(cameraSheet.name)}</SheetTitle>
                <SheetDescription>
                  {cameraSheet.code} · {cameraSheet.owner}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
                <div className="relative flex aspect-video items-center justify-center rounded-lg border border-border ops-grid">
                  {cameraSheet.status === "offline" ? (
                    <div className="flex flex-col items-center gap-1 text-foreground-subtle">
                      <VideoOff className="h-8 w-8" />
                      <span className="text-xs">Feed unavailable</span>
                    </div>
                  ) : (
                    <Camera className="h-8 w-8 text-foreground-subtle" />
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-3">
                  <Field label="Status" value={cameraSheet.status} />
                  <Field label="Owner" value={cameraSheet.owner} />
                  <Field label="Location" value={pick(cameraSheet.location)} />
                  <Field label="Last event" value={cameraSheet.lastEvent ?? "—"} />
                  <Field
                    label="Analytics enabled"
                    value={cameraSheet.analytics.join(", ")}
                    className="col-span-2"
                  />
                </dl>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => { setCameraSheet(null); setSearchOpen(true); }}>
                    <ScanSearch className="h-4 w-4" />
                    Search this camera
                  </Button>
                  <Button variant="outline" onClick={() => { setCameraSheet(null); setTrackOpen(true); }}>
                    <Route className="h-4 w-4" />
                    Start multi-camera track
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/gis")}>
                    <MapPin className="h-4 w-4" />
                    Show on map
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* event sheet */}
      <Sheet open={eventSheet !== null} onOpenChange={(o) => !o && setEventSheet(null)}>
        <SheetContent className="w-[30rem]">
          {eventSheet && (
            <>
              <SheetHeader>
                <SheetTitle>{pick(eventSheet.type)}</SheetTitle>
                <SheetDescription>
                  {eventSheet.camera} · {eventSheet.at}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-5">
                <div className="flex aspect-video items-center justify-center rounded-lg border border-border ops-grid">
                  <Clapperboard className="h-8 w-8 text-foreground-subtle" />
                </div>
                <div className="flex items-center justify-between">
                  <SeverityBadge level={eventSheet.severity} />
                  <AIBadge confidence={eventSheet.confidence} model="event-engine" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground-subtle">
                    Why this was flagged
                  </p>
                  <p className="mt-1 text-sm text-foreground-muted">{pick(eventSheet.reason)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => { decide(eventSheet.id, "confirmed"); setEventSheet(null); }}>
                    Confirm event
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { decide(eventSheet.id, "dismissed"); setEventSheet(null); }}
                  >
                    <CircleSlash className="h-4 w-4" />
                    Dismiss as false positive
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/dispatch")}>
                    <Clapperboard className="h-4 w-4" />
                    Raise dispatch incident
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
