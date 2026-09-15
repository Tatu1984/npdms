import {
  AlertTriangle,
  Boxes,
  Brain,
  BookOpenCheck,
  Camera,
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
  Search,
  ShieldCheck,
  Siren,
  Users,
  Video,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n";

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
    status: "preview",
    aiAssisted: true,
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
    status: "preview",
    chainAnchored: true,
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
    id: "bodycam",
    phase: 13,
    href: "/bodycam",
    group: "surveillance",
    icon: Camera,
    nameKey: "modules.bodycam",
    descKey: "modules.bodycamDesc",
    status: "preview",
    chainAnchored: true,
    aiAssisted: true,
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
    id: "accident-reconstruction",
    phase: 6,
    href: "/accident-reconstruction",
    group: "traffic",
    icon: Siren,
    nameKey: "modules.accidentReconstruction",
    descKey: "modules.accidentReconstructionDesc",
    status: "preview",
    aiAssisted: true,
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
    status: "preview",
    aiAssisted: true,
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
    status: "preview",
    aiAssisted: true,
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
