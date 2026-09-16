import {
  AlertTriangle,
  Boxes,
  Brain,
  BookOpenCheck,
  Camera,
  CarFront,
  ClipboardList,
  FileSearch,
  FileText,
  Fingerprint,
  Gauge,
  Gavel,
  LayoutDashboard,
  Link2,
  MapPinned,
  Megaphone,
  Microscope,
  Radio,
  Scale,
  ScanFace,
  Search,
  ShieldCheck,
  Siren,
  Users,
  Video,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";
import { SHARED_REGISTER_MODULES } from "./forces";

/**
 * The platform is one product with phased modules, not fourteen apps.
 * `phase` is the delivery phase; `core` marks the base policing records the
 * AI modules read from. Navigation, the command palette, the module index
 * and the phase roadmap all render from this single registry.
 */

export type ModuleGroup =
  | "core"
  | "investigation"
  | "evidence"
  | "surveillance"
  | "traffic"
  | "citizen"
  | "command"
  | "knowledge";

export type ModuleStatus = "live" | "preview" | "planned";

export interface PlatformModule {
  /** Stable id, also the key used in analytics and permissions. */
  id: string;
  /** Phase number from the programme plan; core records have no phase. */
  phase?: number;
  href: string;
  group: ModuleGroup;
  icon: React.ElementType;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  status: ModuleStatus;
  /** Minimum role required, checked against the auth store. */
  minRole?: "CONSTABLE" | "ASI" | "SI" | "INSPECTOR" | "SHO" | "DSP" | "SP" | "DIG" | "IG" | "DGP";
  /** True when the screen is a command-centre surface and forces dark. */
  ops?: boolean;
  /** Marks modules whose primary value is AI-derived, for the AI governance banner. */
  aiAssisted?: boolean;
  /** Marks modules backed by the blockchain integrity ledger. */
  chainAnchored?: boolean;
}

export const GROUP_LABEL: Record<ModuleGroup, TranslationKey> = {
  core: "nav.coreGroup",
  investigation: "nav.investigationGroup",
  evidence: "nav.evidenceGroup",
  surveillance: "nav.surveillanceGroup",
  traffic: "nav.trafficGroup",
  citizen: "nav.citizenGroup",
  command: "nav.commandGroup",
  knowledge: "nav.knowledgeGroup",
};

export const GROUP_ORDER: ModuleGroup[] = [
  "core",
  "investigation",
  "evidence",
  "surveillance",
  "traffic",
  "citizen",
  "command",
  "knowledge",
];

export const DASHBOARD: PlatformModule = {
  id: "dashboard",
  href: "/dashboard",
  group: "core",
  icon: LayoutDashboard,
  nameKey: "modules.dashboard",
  descKey: "modules.dashboardDesc",
  status: "live",
};

export const MODULES: PlatformModule[] = [
  DASHBOARD,

  // ---- Core policing records the intelligence modules build on ----
  {
    id: "fir",
    href: "/fir",
    group: "core",
    icon: FileText,
    nameKey: "modules.fir",
    descKey: "modules.firDesc",
    status: "live",
  },
  {
    id: "cases",
    href: "/cases",
    group: "core",
    icon: ClipboardList,
    nameKey: "modules.cases",
    descKey: "modules.casesDesc",
    status: "live",
  },
  {
    id: "warrants",
    href: "/warrant",
    group: "core",
    icon: Scale,
    nameKey: "modules.warrants",
    descKey: "modules.warrantsDesc",
    status: "live",
  },
  {
    id: "bail",
    href: "/bail",
    group: "core",
    icon: Gavel,
    nameKey: "modules.bail",
    descKey: "modules.bailDesc",
    status: "live",
  },
  {
    id: "court",
    href: "/court",
    group: "core",
    icon: Gavel,
    nameKey: "modules.court",
    descKey: "modules.courtDesc",
    status: "live",
  },
  {
    id: "forensics",
    href: "/forensics",
    group: "core",
    icon: Microscope,
    nameKey: "modules.forensics",
    descKey: "modules.forensicsDesc",
    status: "live",
  },
  {
    id: "personnel",
    href: "/personnel",
    group: "core",
    icon: Users,
    nameKey: "modules.personnel",
    descKey: "modules.personnelDesc",
    status: "live",
    minRole: "SHO",
  },

  // ---- Phase 1-14 ----
  {
    id: "investigation",
    phase: 1,
    href: "/investigation",
    group: "investigation",
    icon: Brain,
    nameKey: "modules.investigation",
    descKey: "modules.investigationDesc",
    status: "preview",
    aiAssisted: true,
  },
  {
    id: "case-file",
    phase: 12,
    href: "/case-file",
    group: "investigation",
    icon: BookOpenCheck,
    nameKey: "modules.caseFile",
    descKey: "modules.caseFileDesc",
    status: "live",
  },
  {
    id: "cyber-intelligence",
    phase: 5,
    href: "/cyber-intelligence",
    group: "investigation",
    icon: Link2,
    nameKey: "modules.cyberIntelligence",
    descKey: "modules.cyberIntelligenceDesc",
    status: "preview",
    aiAssisted: true,
  },

  {
    id: "custody",
    phase: 2,
    href: "/custody",
    group: "evidence",
    icon: ShieldCheck,
    nameKey: "modules.custody",
    descKey: "modules.custodyDesc",
    status: "preview",
    chainAnchored: true,
  },
  {
    id: "malkhana",
    phase: 14,
    href: "/malkhana",
    group: "evidence",
    icon: Boxes,
    nameKey: "modules.malkhana",
    descKey: "modules.malkhanaDesc",
    status: "live",
  },

  {
    id: "video-intelligence",
    phase: 3,
    href: "/video-intelligence",
    group: "surveillance",
    icon: Video,
    nameKey: "modules.videoIntelligence",
    descKey: "modules.videoIntelligenceDesc",
    status: "preview",
    ops: true,
    aiAssisted: true,
  },
  {
    // AI layer A4 — not a delivery phase of its own; it builds on Phases 03 and 06.
    id: "vehicle-detection",
    href: "/vehicle-detection",
    group: "surveillance",
    icon: CarFront,
    nameKey: "modules.vehicleDetection",
    descKey: "modules.vehicleDetectionDesc",
    status: "live",
    minRole: "ASI",
    aiAssisted: true,
  },
  {
    id: "bodycam",
    phase: 13,
    href: "/bodycam",
    group: "surveillance",
    icon: Camera,
    nameKey: "modules.bodycam",
    descKey: "modules.bodycamDesc",
    status: "live",
  },
  {
    id: "missing-persons",
    phase: 4,
    href: "/missing-persons",
    group: "surveillance",
    icon: FileSearch,
    nameKey: "modules.missingPersons",
    descKey: "modules.missingPersonsDesc",
    status: "preview",
    aiAssisted: true,
  },
  {
    id: "face-match-review",
    phase: 4,
    href: "/face-recognition/review",
    group: "surveillance",
    icon: ScanFace,
    nameKey: "faceRecognitionScreen.nav.name",
    descKey: "faceRecognitionScreen.nav.desc",
    status: "preview",
    minRole: "ASI",
    aiAssisted: true,
  },

  {
    id: "accident-reconstruction",
    phase: 6,
    href: "/accident-reconstruction",
    group: "traffic",
    icon: Siren,
    nameKey: "modules.accidentReconstruction",
    descKey: "modules.accidentReconstructionDesc",
    status: "live",
    aiAssisted: false,
  },
  {
    id: "traffic-challans",
    href: "/traffic",
    group: "traffic",
    icon: ClipboardList,
    nameKey: "modules.trafficChallans",
    descKey: "modules.trafficChallansDesc",
    status: "live",
  },

  {
    id: "grievance",
    phase: 9,
    href: "/grievance",
    group: "citizen",
    icon: Megaphone,
    nameKey: "modules.grievance",
    descKey: "modules.grievanceDesc",
    status: "preview",
    aiAssisted: true,
  },
  {
    id: "risk-intelligence",
    phase: 10,
    href: "/risk-intelligence",
    group: "citizen",
    icon: MapPinned,
    nameKey: "modules.riskIntelligence",
    descKey: "modules.riskIntelligenceDesc",
    status: "live",
    aiAssisted: false,
  },

  {
    id: "dispatch",
    phase: 7,
    href: "/dispatch",
    group: "command",
    icon: Radio,
    nameKey: "modules.dispatch",
    descKey: "modules.dispatchDesc",
    status: "live",
    ops: true,
    aiAssisted: false,
  },
  {
    id: "operational-map",
    href: "/gis",
    group: "command",
    icon: MapPinned,
    nameKey: "modules.operationalMap",
    descKey: "modules.operationalMapDesc",
    status: "live",
  },
  {
    id: "workload",
    phase: 8,
    href: "/workload",
    group: "command",
    icon: Gauge,
    nameKey: "modules.workload",
    descKey: "modules.workloadDesc",
    status: "live",
    minRole: "SHO",
  },

  {
    id: "knowledge",
    phase: 11,
    href: "/knowledge",
    group: "knowledge",
    icon: Search,
    nameKey: "modules.knowledge",
    descKey: "modules.knowledgeDesc",
    status: "live",
    aiAssisted: false,
  },
  {
    id: "audit",
    href: "/audit",
    group: "knowledge",
    icon: Fingerprint,
    nameKey: "modules.audit",
    descKey: "modules.auditDesc",
    status: "live",
    minRole: "SHO",
  },
  {
    id: "ai-review",
    href: "/ai-review",
    group: "knowledge",
    icon: Brain,
    nameKey: "aiScreen.nav.review",
    descKey: "aiScreen.nav.reviewDesc",
    status: "live",
    aiAssisted: true,
  },
  {
    id: "ai-oversight",
    href: "/ai-oversight",
    group: "knowledge",
    icon: ShieldCheck,
    nameKey: "aiScreen.nav.oversight",
    descKey: "aiScreen.nav.oversightDesc",
    status: "live",
    minRole: "DSP",
    aiAssisted: true,
  },
];

/** The fourteen programme phases, in phase order, for the roadmap view. */
export const PHASED_MODULES = MODULES.filter((m) => m.phase !== undefined).sort(
  (a, b) => (a.phase ?? 0) - (b.phase ?? 0),
);

export function modulesByGroup(group: ModuleGroup) {
  return MODULES.filter((m) => m.group === group);
}

export function findModuleByPath(pathname: string) {
  // Longest href wins so /case-file beats /case on nested routes.
  return MODULES.filter(
    (m) => pathname === m.href || pathname.startsWith(`${m.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0];
}

export const ALERT_MODULE: PlatformModule = {
  id: "alerts",
  href: "/alerts",
  group: "command",
  icon: AlertTriangle,
  nameKey: "modules.dashboard",
  descKey: "modules.dashboardDesc",
  status: "live",
};

// ---------------------------------------------------------------------------
// Which modules belong to which department
// ---------------------------------------------------------------------------
//
// The starting point is that every department does police work and sees the
// whole platform. Only the exceptions are written down, and each one carries
// the reason it is an exception, so that an officer who disagrees can argue
// with the reason rather than guess at the list.
//
// The test applied to each line was not "would this department use this
// often?" — plenty of screens are rarely opened and still belong — but "does
// this work belong to this department at all?". A traffic wing keeps no
// property store because seized property goes to the police station's
// malkhana; that is a fact about how the wings are organised, not a guess
// about usage. Where the answer was uncertain the module was left visible.
//
// Kolkata Police and West Bengal Police are forces in their own right and do
// the general run of police work, so neither has an exception. A force code
// this build does not know — a fifth department added later — also gets the
// general set, because hiding work from an officer on the strength of an
// unrecognised code would be the worse mistake.
//
// The four state-wide registers are never hidden, whatever is written here;
// `modulesForForce` enforces that against SHARED_REGISTER_MODULES.

/** Module ids a force does not see, each with the reason it does not. */
export interface ForceModuleRule {
  hidden: Record<string, string>;
}

export const FORCE_MODULE_RULES: Record<string, ForceModuleRule> = {
  KP: { hidden: {} },
  WBP: { hidden: {} },

  // Kolkata Traffic Police — regulation, road accidents and prosecutions. It
  // does not investigate crime and it does not run a police station.
  TRAFFIC: {
    hidden: {
      investigation:
        "Investigating crime is the station's work; the traffic wing hands a case over rather than taking it up.",
      "case-file":
        "A case diary is kept by the investigating officer at the station that registered the case.",
      "cyber-intelligence":
        "Cyber investigation is done by the cyber cells of the two forces, not by a traffic wing.",
      forensics:
        "Forensic examination is requisitioned by the investigating officer, who is not a traffic officer.",
      custody:
        "A person arrested by a traffic sergeant is produced at the police station, which makes the custody entry.",
      malkhana:
        "The traffic wing keeps no property store; a seized vehicle or article is deposited at the station's malkhana.",
      bail: "Bail follows an arrest and a case the station holds, not a traffic prosecution.",
      warrants:
        "Warrants are issued in cases the stations investigate and are executed by them.",
      "face-match-review":
        "Face match candidates are raised against missing-person and wanted records, which the traffic wing does not work.",
    },
  },

  // CID — specialised investigation of cases referred to it. It has no
  // patrolling, no road-traffic duty and no public counter.
  CID: {
    hidden: {
      "traffic-challans":
        "Traffic prosecutions are issued by the traffic wing in its own area; CID prosecutes no road offences.",
      "accident-reconstruction":
        "Road accident scenes are worked by the traffic wing; a case reaches CID as a referred case, not as a scene.",
      dispatch:
        "Emergency calls are answered and units are sent by the city and district forces; CID runs no response control room.",
      grievance:
        "Public grievances are received at the station counter; CID takes up a matter on a referral, not on a walk-in.",
    },
  },
};

/**
 * The modules an officer of this force sees, in registry order.
 *
 * Unknown force codes get the general set. The state-wide registers are added
 * back whatever the rules say, so the shared-register promise cannot be broken
 * by an edit to the table above.
 */
export function modulesForForce(
  forceCode: string | undefined,
  modules: PlatformModule[] = MODULES,
): PlatformModule[] {
  const hidden = FORCE_MODULE_RULES[forceCode ?? ""]?.hidden;
  if (!hidden) return modules;
  return modules.filter((m) => !hidden[m.id] || m.id in SHARED_REGISTER_MODULES);
}

/** Why a module is not shown to this force, for anywhere that must explain it. */
export function moduleHiddenReason(
  forceCode: string | undefined,
  moduleId: string,
): string | undefined {
  if (moduleId in SHARED_REGISTER_MODULES) return undefined;
  return FORCE_MODULE_RULES[forceCode ?? ""]?.hidden[moduleId];
}
