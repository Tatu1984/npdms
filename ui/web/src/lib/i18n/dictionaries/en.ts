import { custodyEn } from "./custody.en";
import { riskEn } from "./risk.en";

/**
 * English dictionary — the source of truth for translation keys.
 *
 * The shape of this object defines `TranslationKey`; bn.ts must mirror it.
 * Keys are grouped by area, flattened to dot paths at lookup time.
 */
export const en = {
  custodyScreen: custodyEn,
  riskScreen: riskEn,

  common: {
    appName: "Kolkata Police Digital Intelligence Platform",
    appNameShort: "KP Intelligence",
    search: "Search",
    searchPlaceholder: "Search cases, people, vehicles, evidence…",
    filter: "Filter",
    clear: "Clear",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    confirm: "Confirm",
    approve: "Approve",
    reject: "Reject",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    viewAll: "View all",
    export: "Export",
    print: "Print",
    upload: "Upload",
    download: "Download",
    refresh: "Refresh",
    loading: "Loading…",
    noData: "No records found",
    error: "Something went wrong",
    retry: "Retry",
    back: "Back",
    next: "Next",
    previous: "Previous",
    showing: "Showing",
    of: "of",
    results: "results",
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This week",
    thisMonth: "This month",
    lastDays: "Last {n} days",
    status: "Status",
    priority: "Priority",
    assignedTo: "Assigned to",
    createdOn: "Created on",
    updatedOn: "Updated on",
    dueBy: "Due by",
    overdue: "Overdue",
    pending: "Pending",
    completed: "Completed",
    inProgress: "In progress",
    all: "All",
    none: "None",
    yes: "Yes",
    no: "No",
    more: "More",
    details: "Details",
    summary: "Summary",
    timeline: "Timeline",
    location: "Location",
    officer: "Officer",
    verified: "Verified",
    unverified: "Unverified",
  },

  nav: {
    coreGroup: "Core policing",
    investigationGroup: "Investigation intelligence",
    evidenceGroup: "Evidence & custody",
    surveillanceGroup: "Surveillance & video",
    trafficGroup: "Traffic",
    citizenGroup: "Citizen & public safety",
    commandGroup: "Command & operations",
    knowledgeGroup: "Knowledge & administration",
    collapse: "Collapse sidebar",
    expand: "Expand sidebar",
  },

  modules: {
    dashboard: "Dashboard",
    dashboardDesc: "Operational overview for your station and division",

    fir: "FIR & GD",
    firDesc: "Register and track First Information Reports and General Diary entries",
    cases: "Case register",
    casesDesc: "Investigations, case status and supervisory oversight",
    warrants: "Warrants & summons",
    warrantsDesc: "Arrest, search, summons and non-bailable warrants",
    bail: "Bail",
    bailDesc: "Bail applications, conditions and surety tracking",
    court: "Court diary",
    courtDesc: "Hearing dates, orders and court correspondence",
    forensics: "Forensics",
    forensicsDesc: "Laboratory requests, reports and turnaround",
    personnel: "Personnel",
    personnelDesc: "Officer records, postings and duty assignment",

    investigation: "Investigation Copilot",
    investigationDesc:
      "AI-assisted case workspace: evidence ingestion, entity extraction, timeline, contradictions and gaps",
    custody: "Evidence & Chain of Custody",
    custodyDesc:
      "Tamper-evident digital evidence: SHA-256 taken on storage, re-verified on demand, and a signed, append-only chain of custody",
    videoIntelligence: "Video Intelligence",
    videoIntelligenceDesc:
      "AI layer over existing CCTV: event detection, natural-language search and multi-camera tracking",
    missingPersons: "Missing Persons",
    missingPersonsDesc:
      "Missing and vulnerable person cases with sighting correlation and movement reconstruction",
    cyberIntelligence: "Cyber & Financial Fraud",
    cyberIntelligenceDesc:
      "Fraud network graphs, money trails, mule account detection and victim clustering",
    accidentReconstruction: "Accident Reconstruction",
    accidentReconstructionDesc:
      "Traffic incident reconstruction from CCTV, ANPR and signal data",
    dispatch: "Dispatch & Response",
    dispatchDesc:
      "Incident intake, severity scoring, unit recommendation and escalation",
    workload: "Station Performance",
    workloadDesc:
      "Workload, investigation backlog, SLA monitoring and bottleneck detection",
    grievance: "Citizen Grievance",
    grievanceDesc:
      "Multi-channel complaint intake with Bengali support, triage and jurisdiction routing",
    riskIntelligence: "Public Safety Risk",
    riskIntelligenceDesc:
      "Area risk scoring with transparent contributing factors and patrol recommendations",
    knowledge: "Knowledge Assistant",
    knowledgeDesc:
      "Source-cited answers over SOPs, circulars and BNS/BNSS/BSA provisions",
    caseFile: "Case File & Court Readiness",
    caseFileDesc:
      "Case file assembly, evidence and witness matrices, completeness checks and submission packs",
    bodycam: "Body-Worn Camera",
    bodycamDesc:
      "Bodycam device management, secure upload, transcription and evidence association",
    malkhana: "Malkhana",
    malkhanaDesc:
      "Seized property register with QR tracking and blockchain-anchored custody events",

    audit: "Audit trail",
    auditDesc: "Who did what, when, and from where",
    settings: "Settings",
    settingsDesc: "Platform configuration and preferences",
  },

  ai: {
    label: "AI",
    assisted: "AI-assisted",
    suggestion: "AI suggestion",
    confidence: "Confidence",
    source: "Source",
    sources: "Sources",
    viewSource: "View source",
    model: "Model",
    generatedAt: "Generated",
    advisory: "Advisory only — an officer must verify before this is acted on",
    awaitingReview: "Awaiting officer review",
    approvedBy: "Approved by",
    rejectedBy: "Rejected by",
    approveFinding: "Accept finding",
    rejectFinding: "Reject finding",
    noSource: "No authoritative source found",
    noSourceBody:
      "The assistant could not find an authoritative document for this question. It will not answer without one.",
    explainTitle: "Why this result",
    humanInLoop: "AI recommends · officer decides",
  },

  chain: {
    label: "Integrity",
    verified: "Hash verified",
    pending: "Anchor pending",
    broken: "Integrity mismatch",
    anchored: "Anchored on-chain",
    hash: "Hash",
    blockHeight: "Block",
    anchoredAt: "Anchored at",
    verify: "Verify integrity",
    custodyChain: "Chain of custody",
    transferredTo: "Transferred to",
    sealIntact: "Seal intact",
    sealBroken: "Seal broken",
  },

  severity: {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  },

  auth: {
    signIn: "Sign in",
    signOut: "Sign out",
    username: "Username",
    password: "Password",
    badgeNumber: "Badge number",
    rememberMe: "Keep me signed in on this device",
    signingIn: "Signing in…",
    invalidCredentials: "Invalid username or password",
    officialUseOnly: "Authorised use only. All activity is logged and audited.",
  },

  agency: {
    label: "Agency",
    kp: "Kolkata Police",
    wbp: "West Bengal Police",
    cid: "CID West Bengal",
    traffic: "Traffic Police",
    division: "Division",
    station: "Police station",
    allStations: "All stations",
  },

  settings: {
    language: "Language",
    theme: "Appearance",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
  },
} as const;

/** Widens the literal types from `as const` so translations can differ. */
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof en>;
