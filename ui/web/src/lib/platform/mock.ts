/**
 * Demonstration data for the module screens.
 *
 * Localised to Kolkata Police jurisdiction: WB registration marks, Kolkata
 * police stations and courts, BNS/BNSS provisions, Bengali names in both
 * scripts. Deterministic — no random generation — so screenshots, demos and
 * tests stay stable.
 *
 * Everything here is fictional. Replace with API data as each phase lands.
 */

import type { Severity } from "@/components/platform/primitives";
import type { EvidenceSource, IntegrityState, ReviewState } from "@/components/platform/governance";

export type Bilingual = { en: string; bn: string };

/* ------------------------------------------------- 01 Investigation Copilot */

export interface Workspace {
  id: string;
  caseNumber: string;
  firNumber: string;
  title: Bilingual;
  station: string;
  offence: Bilingual;
  sections: string[];
  io: Bilingual;
  supervisor: Bilingual;
  status: "active" | "chargesheet" | "supervisory-review" | "closed";
  priority: Severity;
  registeredOn: string;
  nextCourtDate?: string;
  progress: number;
  counts: {
    evidence: number;
    witnesses: number;
    persons: number;
    vehicles: number;
    locations: number;
    contradictions: number;
    gaps: number;
    openTasks: number;
  };
}

export const WORKSPACES: Workspace[] = [
  {
    id: "ws-2024-0412",
    caseNumber: "PS-BHW/2024/0412",
    firNumber: "FIR 0412/2024",
    title: { en: "Armed robbery at jewellery showroom, Bhowanipore", bn: "ভবানীপুরে গয়নার দোকানে সশস্ত্র ডাকাতি" },
    station: "Bhowanipore",
    offence: { en: "Robbery with deadly weapon", bn: "মারণাস্ত্র সহ ডাকাতি" },
    sections: ["BNS 309", "BNS 310", "Arms Act 25"],
    io: { en: "Insp. Arindam Chatterjee", bn: "ইন্সপেক্টর অরিন্দম চ্যাটার্জি" },
    supervisor: { en: "AC Subhankar Pal", bn: "সহকারী কমিশনার শুভঙ্কর পাল" },
    status: "active",
    priority: "critical",
    registeredOn: "2024-11-18",
    nextCourtDate: "2025-01-09",
    progress: 62,
    counts: { evidence: 34, witnesses: 11, persons: 7, vehicles: 3, locations: 6, contradictions: 3, gaps: 4, openTasks: 9 },
  },
  {
    id: "ws-2024-0388",
    caseNumber: "PS-PKS/2024/0388",
    firNumber: "FIR 0388/2024",
    title: { en: "Chain snatching series, Park Street to Camac Street", bn: "পার্ক স্ট্রিট থেকে ক্যামাক স্ট্রিট চেন ছিনতাই" },
    station: "Park Street",
    offence: { en: "Snatching", bn: "ছিনতাই" },
    sections: ["BNS 304"],
    io: { en: "SI Sutapa Mukherjee", bn: "সাব-ইন্সপেক্টর সুতপা মুখার্জি" },
    supervisor: { en: "AC Subhankar Pal", bn: "সহকারী কমিশনার শুভঙ্কর পাল" },
    status: "active",
    priority: "high",
    registeredOn: "2024-11-02",
    nextCourtDate: "2024-12-27",
    progress: 44,
    counts: { evidence: 21, witnesses: 8, persons: 4, vehicles: 2, locations: 9, contradictions: 1, gaps: 6, openTasks: 12 },
  },
  {
    id: "ws-2024-0351",
    caseNumber: "PS-JDP/2024/0351",
    firNumber: "FIR 0351/2024",
    title: { en: "Cheating by investment scheme, Jadavpur", bn: "যাদবপুরে বিনিয়োগ প্রকল্পে প্রতারণা" },
    station: "Jadavpur",
    offence: { en: "Cheating and criminal breach of trust", bn: "প্রতারণা ও অপরাধমূলক বিশ্বাসভঙ্গ" },
    sections: ["BNS 318", "BNS 316"],
    io: { en: "Insp. Anirban Das", bn: "ইন্সপেক্টর অনির্বাণ দাস" },
    supervisor: { en: "DC Paromita Banerjee", bn: "ডেপুটি কমিশনার পারমিতা ব্যানার্জি" },
    status: "supervisory-review",
    priority: "high",
    registeredOn: "2024-10-14",
    nextCourtDate: "2025-01-16",
    progress: 78,
    counts: { evidence: 56, witnesses: 23, persons: 12, vehicles: 1, locations: 4, contradictions: 2, gaps: 2, openTasks: 5 },
  },
  {
    id: "ws-2024-0297",
    caseNumber: "PS-KSB/2024/0297",
    firNumber: "FIR 0297/2024",
    title: { en: "House-breaking and theft, Kasba", bn: "কসবায় গৃহে অনধিকার প্রবেশ ও চুরি" },
    station: "Kasba",
    offence: { en: "House-breaking", bn: "গৃহে অনধিকার প্রবেশ" },
    sections: ["BNS 331", "BNS 305"],
    io: { en: "ASI Rituparna Ghosh", bn: "সহকারী সাব-ইন্সপেক্টর ঋতুপর্ণা ঘোষ" },
    supervisor: { en: "OC Debashis Roy", bn: "ভারপ্রাপ্ত আধিকারিক দেবাশিস রায়" },
    status: "active",
    priority: "medium",
    registeredOn: "2024-09-30",
    progress: 35,
    counts: { evidence: 12, witnesses: 5, persons: 3, vehicles: 0, locations: 2, contradictions: 0, gaps: 5, openTasks: 7 },
  },
  {
    id: "ws-2024-0221",
    caseNumber: "PS-BEH/2024/0221",
    firNumber: "FIR 0221/2024",
    title: { en: "Fatal road accident, Behala Chowrasta", bn: "বেহালা চৌরাস্তায় মারাত্মক পথ দুর্ঘটনা" },
    station: "Behala",
    offence: { en: "Causing death by negligence", bn: "অবহেলায় মৃত্যু ঘটানো" },
    sections: ["BNS 106", "BNS 281"],
    io: { en: "SI Moumita Sen", bn: "সাব-ইন্সপেক্টর মৌমিতা সেন" },
    supervisor: { en: "OC Debashis Roy", bn: "ভারপ্রাপ্ত আধিকারিক দেবাশিস রায়" },
    status: "chargesheet",
    priority: "high",
    registeredOn: "2024-08-11",
    nextCourtDate: "2024-12-20",
    progress: 91,
    counts: { evidence: 27, witnesses: 9, persons: 4, vehicles: 2, locations: 3, contradictions: 1, gaps: 1, openTasks: 2 },
  },
];

export interface TimelineEvent {
  id: string;
  time: string;
  date: string;
  title: Bilingual;
  detail?: Bilingual;
  sources: EvidenceSource[];
  confidence: number;
  review: ReviewState;
  kind: "movement" | "communication" | "incident" | "transaction" | "detection" | "report";
}

export const CASE_TIMELINE: TimelineEvent[] = [
  {
    id: "tl-1",
    date: "2024-11-18",
    time: "20:41",
    kind: "movement",
    title: { en: "Complainant closes showroom shutter", bn: "অভিযোগকারী দোকানের শাটার বন্ধ করেন" },
    detail: { en: "Recorded on the showroom's own camera, facing the entrance.", bn: "দোকানের নিজস্ব ক্যামেরায় রেকর্ড, প্রবেশপথের দিকে মুখ করা।" },
    sources: [{ id: "s1", label: "Showroom DVR CH-02", type: "cctv", locator: "20:41:12" }],
    confidence: 0.97,
    review: "accepted",
  },
  {
    id: "tl-2",
    date: "2024-11-18",
    time: "20:44",
    kind: "detection",
    title: { en: "Motorcycle WB-02-AK-4471 detected on Harish Mukherjee Road", bn: "হরিশ মুখার্জি রোডে মোটরসাইকেল WB-02-AK-4471 শনাক্ত" },
    detail: { en: "ANPR camera at the Jagubazar crossing; two riders, both helmeted.", bn: "যদুবাবুর বাজার মোড়ে এএনপিআর ক্যামেরা; দুই আরোহী, উভয়ের হেলমেট।" },
    sources: [
      { id: "s2", label: "ANPR Jagubazar", type: "cctv", locator: "20:44:03" },
      { id: "s3", label: "Vehicle register extract", type: "document", locator: "p.2" },
    ],
    confidence: 0.88,
    review: "accepted",
  },
  {
    id: "tl-3",
    date: "2024-11-18",
    time: "20:47",
    kind: "incident",
    title: { en: "Three persons enter the showroom", bn: "তিনজন ব্যক্তি দোকানে প্রবেশ করেন" },
    detail: { en: "Faces covered. One carries what appears to be a firearm.", bn: "মুখ ঢাকা। একজনের হাতে আগ্নেয়াস্ত্র বলে মনে হয়।" },
    sources: [{ id: "s4", label: "Showroom DVR CH-01", type: "cctv", locator: "20:47:31" }],
    confidence: 0.94,
    review: "accepted",
  },
  {
    id: "tl-4",
    date: "2024-11-18",
    time: "20:52",
    kind: "communication",
    title: { en: "Call from 9831-XXXX-42 to 9007-XXXX-18, duration 46s", bn: "9831-XXXX-42 থেকে 9007-XXXX-18 নম্বরে কল, সময়কাল ৪৬ সেকেন্ড" },
    detail: { en: "Tower location places the caller within 400m of the showroom.", bn: "টাওয়ার অবস্থান অনুযায়ী কলকারী দোকান থেকে ৪০০ মিটারের মধ্যে।" },
    sources: [{ id: "s5", label: "CDR extract — Airtel", type: "call", locator: "row 118" }],
    confidence: 0.71,
    review: "pending",
  },
  {
    id: "tl-5",
    date: "2024-11-18",
    time: "20:58",
    kind: "movement",
    title: { en: "Suspects depart towards Chetla", bn: "সন্দেহভাজনরা চেতলার দিকে রওনা দেয়" },
    sources: [{ id: "s6", label: "KMC camera CTL-17", type: "cctv", locator: "20:58:44" }],
    confidence: 0.83,
    review: "pending",
  },
  {
    id: "tl-6",
    date: "2024-11-18",
    time: "21:14",
    kind: "report",
    title: { en: "Incident reported at Bhowanipore PS", bn: "ভবানীপুর থানায় ঘটনার খবর দেওয়া হয়" },
    sources: [{ id: "s7", label: "GD entry 1174/24", type: "document" }],
    confidence: 1,
    review: "accepted",
  },
];

export interface Contradiction {
  id: string;
  title: Bilingual;
  statementA: { label: string; claim: Bilingual; source: EvidenceSource };
  statementB: { label: string; claim: Bilingual; source: EvidenceSource };
  severity: Severity;
  confidence: number;
  review: ReviewState;
}

export const CONTRADICTIONS: Contradiction[] = [
  {
    id: "cd-1",
    title: { en: "Timing conflict between witness account and CCTV", bn: "সাক্ষীর বয়ান ও সিসিটিভির সময়ে অসঙ্গতি" },
    statementA: {
      label: "Witness — Bikash Haldar",
      claim: { en: "States the three men left at about 8:30 PM.", bn: "বলেছেন তিনজন প্রায় রাত ৮:৩০ টায় চলে যায়।" },
      source: { id: "c1", label: "Statement u/s BNSS 180", type: "statement", locator: "para 4" },
    },
    statementB: {
      label: "Showroom DVR CH-01",
      claim: { en: "Places all three inside the showroom until 20:57.", bn: "তিনজনকেই ২০:৫৭ পর্যন্ত দোকানের ভিতরে দেখায়।" },
      source: { id: "c2", label: "Showroom DVR CH-01", type: "cctv", locator: "20:57:10" },
    },
    severity: "high",
    confidence: 0.91,
    review: "pending",
  },
  {
    id: "cd-2",
    title: { en: "Vehicle colour described differently by two witnesses", bn: "দুই সাক্ষী গাড়ির রং ভিন্নভাবে বর্ণনা করেছেন" },
    statementA: {
      label: "Witness — Sharmila Dutta",
      claim: { en: "Describes the motorcycle as black.", bn: "মোটরসাইকেলটি কালো বলে বর্ণনা করেছেন।" },
      source: { id: "c3", label: "Statement u/s BNSS 180", type: "statement", locator: "para 2" },
    },
    statementB: {
      label: "ANPR still",
      claim: { en: "Registered colour for WB-02-AK-4471 is dark blue.", bn: "WB-02-AK-4471-এর নথিভুক্ত রং গাঢ় নীল।" },
      source: { id: "c4", label: "Vahan extract", type: "document" },
    },
    severity: "low",
    confidence: 0.64,
    review: "pending",
  },
  {
    id: "cd-3",
    title: { en: "Accused alibi inconsistent with tower location", bn: "অভিযুক্তের অ্যালিবাই টাওয়ার অবস্থানের সঙ্গে অসঙ্গত" },
    statementA: {
      label: "Accused — statement",
      claim: { en: "Claims to have been at Sealdah at the time of the incident.", bn: "ঘটনার সময় শিয়ালদহে ছিলেন বলে দাবি করেছেন।" },
      source: { id: "c5", label: "Statement u/s BNSS 180", type: "statement", locator: "para 7" },
    },
    statementB: {
      label: "CDR tower dump",
      claim: { en: "Handset registered on the Bhowanipore tower between 20:39 and 21:02.", bn: "হ্যান্ডসেট ২০:৩৯ থেকে ২১:০২ পর্যন্ত ভবানীপুর টাওয়ারে নথিভুক্ত।" },
      source: { id: "c6", label: "CDR extract — Airtel", type: "call", locator: "rows 112-131" },
    },
    severity: "critical",
    confidence: 0.87,
    review: "pending",
  },
];

export interface InvestigationGap {
  id: string;
  title: Bilingual;
  kind: "witness" | "forensic" | "timeline" | "document" | "digital" | "seizure";
  detail: Bilingual;
  severity: Severity;
  dueBy?: string;
}

export const GAPS: InvestigationGap[] = [
  { id: "gp-1", kind: "forensic", severity: "critical", title: { en: "Ballistics report not received", bn: "ব্যালিস্টিক রিপোর্ট পাওয়া যায়নি" }, detail: { en: "Requested from the State FSL on 21 Nov; 18 days elapsed against a 15-day norm.", bn: "২১ নভেম্বর রাজ্য এফএসএল-এ অনুরোধ; ১৫ দিনের নিয়মের বিপরীতে ১৮ দিন অতিবাহিত।" }, dueBy: "2024-12-06" },
  { id: "gp-2", kind: "witness", severity: "high", title: { en: "Statement of the security guard not recorded", bn: "নিরাপত্তারক্ষীর বয়ান লিপিবদ্ধ হয়নি" }, detail: { en: "Named in the FIR as present at the time; no statement u/s BNSS 180 on file.", bn: "এজাহারে ঘটনার সময় উপস্থিত বলে উল্লেখ; বিএনএসএস ১৮০ ধারায় কোনো বয়ান নথিতে নেই।" } },
  { id: "gp-3", kind: "timeline", severity: "medium", title: { en: "Unexplained 16-minute gap in movement", bn: "গতিবিধিতে ১৬ মিনিটের ব্যাখ্যাহীন ফাঁক" }, detail: { en: "No camera or tower record places the suspects between 20:58 and 21:14.", bn: "২০:৫৮ থেকে ২১:১৪ পর্যন্ত কোনো ক্যামেরা বা টাওয়ার রেকর্ডে সন্দেহভাজনদের অবস্থান নেই।" } },
  { id: "gp-4", kind: "digital", severity: "medium", title: { en: "Seized handset not sent for extraction", bn: "বাজেয়াপ্ত হ্যান্ডসেট নিষ্কাশনের জন্য পাঠানো হয়নি" }, detail: { en: "Property entry MK/2024/1187 has been in the malkhana for 22 days.", bn: "সম্পত্তি নথি MK/2024/1187 ২২ দিন ধরে মালখানায় রয়েছে।" } },
];

export interface InvestigationTask {
  id: string;
  title: Bilingual;
  assignee: Bilingual;
  due: string;
  priority: Severity;
  status: "open" | "in-progress" | "done" | "blocked";
  origin: "ai" | "officer" | "supervisor";
}

export const TASKS: InvestigationTask[] = [
  { id: "tk-1", title: { en: "Record statement of the showroom security guard", bn: "দোকানের নিরাপত্তারক্ষীর বয়ান লিপিবদ্ধ করুন" }, assignee: { en: "ASI Rituparna Ghosh", bn: "সহকারী সাব-ইন্সপেক্টর ঋতুপর্ণা ঘোষ" }, due: "2024-12-09", priority: "high", status: "open", origin: "ai" },
  { id: "tk-2", title: { en: "Follow up ballistics report with State FSL", bn: "রাজ্য এফএসএল-এর সঙ্গে ব্যালিস্টিক রিপোর্টের অনুসরণ" }, assignee: { en: "Insp. Arindam Chatterjee", bn: "ইন্সপেক্টর অরিন্দম চ্যাটার্জি" }, due: "2024-12-07", priority: "critical", status: "in-progress", origin: "ai" },
  { id: "tk-3", title: { en: "Obtain tower dump for the 20:50–21:20 window", bn: "২০:৫০–২১:২০ সময়ের টাওয়ার ডাম্প সংগ্রহ" }, assignee: { en: "SI Sutapa Mukherjee", bn: "সাব-ইন্সপেক্টর সুতপা মুখার্জি" }, due: "2024-12-11", priority: "high", status: "open", origin: "officer" },
  { id: "tk-4", title: { en: "Send seized handset for digital extraction", bn: "বাজেয়াপ্ত হ্যান্ডসেট ডিজিটাল নিষ্কাশনে পাঠান" }, assignee: { en: "ASI Rituparna Ghosh", bn: "সহকারী সাব-ইন্সপেক্টর ঋতুপর্ণা ঘোষ" }, due: "2024-12-12", priority: "medium", status: "blocked", origin: "ai" },
  { id: "tk-5", title: { en: "Verify ownership trail of WB-02-AK-4471", bn: "WB-02-AK-4471-এর মালিকানার সূত্র যাচাই" }, assignee: { en: "SI Moumita Sen", bn: "সাব-ইন্সপেক্টর মৌমিতা সেন" }, due: "2024-12-08", priority: "high", status: "done", origin: "officer" },
];

export interface PersonOfInterest {
  id: string;
  name: Bilingual;
  aliases: string[];
  role: "accused" | "suspect" | "witness" | "complainant" | "victim";
  age?: number;
  address: Bilingual;
  phone?: string;
  linkedCases: number;
  statements: number;
  vehicles: string[];
  riskNote?: Bilingual;
}

export const PERSONS: PersonOfInterest[] = [
  { id: "pi-1", name: { en: "Rafiqul Sk", bn: "রফিকুল শেখ" }, aliases: ["Rafi", "Kalu"], role: "accused", age: 29, address: { en: "Metiabruz, Kolkata", bn: "মেটিয়াবুরুজ, কলকাতা" }, phone: "9831-XXXX-42", linkedCases: 4, statements: 2, vehicles: ["WB-02-AK-4471"], riskNote: { en: "Two prior cases under BNS 309 at Ekbalpore PS.", bn: "একবালপুর থানায় বিএনএস ৩০৯ ধারায় দুটি পূর্ব মামলা।" } },
  { id: "pi-2", name: { en: "Jahir Alam", bn: "জাহির আলম" }, aliases: ["Jahi"], role: "suspect", age: 24, address: { en: "Garden Reach, Kolkata", bn: "গার্ডেনরিচ, কলকাতা" }, phone: "9007-XXXX-18", linkedCases: 2, statements: 1, vehicles: [] },
  { id: "pi-3", name: { en: "Bikash Haldar", bn: "বিকাশ হালদার" }, aliases: [], role: "witness", age: 51, address: { en: "Chetla, Kolkata", bn: "চেতলা, কলকাতা" }, linkedCases: 1, statements: 1, vehicles: [] },
  { id: "pi-4", name: { en: "Sharmila Dutta", bn: "শর্মিলা দত্ত" }, aliases: [], role: "complainant", age: 44, address: { en: "Bhowanipore, Kolkata", bn: "ভবানীপুর, কলকাতা" }, linkedCases: 1, statements: 2, vehicles: [] },
];

/* ------------------------------------------- 02 Evidence & chain of custody */

export interface EvidenceItem {
  id: string;
  evidenceId: string;
  caseNumber: string;
  description: Bilingual;
  type: "cctv" | "photograph" | "document" | "device" | "biological" | "audio" | "physical";
  capturedOn: string;
  capturedBy: Bilingual;
  location: Bilingual;
  hash: string;
  integrity: IntegrityState;
  block?: number;
  custodyHolder: Bilingual;
  sizeMb?: number;
  transfers: number;
}

export const EVIDENCE_ITEMS: EvidenceItem[] = [
  { id: "ev-1", evidenceId: "EV/BHW/2024/0412/001", caseNumber: "PS-BHW/2024/0412", description: { en: "Showroom DVR export, channels 1–4", bn: "দোকানের ডিভিআর এক্সপোর্ট, চ্যানেল ১–৪" }, type: "cctv", capturedOn: "2024-11-19T02:10:00", capturedBy: { en: "SI Sutapa Mukherjee", bn: "সাব-ইন্সপেক্টর সুতপা মুখার্জি" }, location: { en: "Bhowanipore", bn: "ভবানীপুর" }, hash: "9f2c41ab7e5d38c0b1a6e4f27d9c8b530ae1f46d2c7b98315fa0e6d4c2b87591", integrity: "verified", block: 184229, custodyHolder: { en: "Malkhana — Bhowanipore PS", bn: "মালখানা — ভবানীপুর থানা" }, sizeMb: 2411, transfers: 3 },
  { id: "ev-2", evidenceId: "EV/BHW/2024/0412/002", caseNumber: "PS-BHW/2024/0412", description: { en: "Seized mobile handset, Redmi Note 12", bn: "বাজেয়াপ্ত মোবাইল হ্যান্ডসেট, রেডমি নোট ১২" }, type: "device", capturedOn: "2024-11-21T11:35:00", capturedBy: { en: "ASI Rituparna Ghosh", bn: "সহকারী সাব-ইন্সপেক্টর ঋতুপর্ণা ঘোষ" }, location: { en: "Metiabruz", bn: "মেটিয়াবুরুজ" }, hash: "3a71d6e0c48b29fd5e17a3c96b04d8f2719ce5ab6034d1f87b2ea9c50d3f6481", integrity: "pending", custodyHolder: { en: "Cyber cell — Lalbazar", bn: "সাইবার সেল — লালবাজার" }, transfers: 2 },
  { id: "ev-3", evidenceId: "EV/BHW/2024/0412/003", caseNumber: "PS-BHW/2024/0412", description: { en: "Crime scene photographs, 42 frames", bn: "ঘটনাস্থলের আলোকচিত্র, ৪২টি ফ্রেম" }, type: "photograph", capturedOn: "2024-11-18T22:40:00", capturedBy: { en: "Insp. Arindam Chatterjee", bn: "ইন্সপেক্টর অরিন্দম চ্যাটার্জি" }, location: { en: "Bhowanipore", bn: "ভবানীপুর" }, hash: "c84b1f7a2e93d05c6b8fa401e27d3c95bf6021a8d743e9c05b1f8a2d6e930c47", integrity: "verified", block: 184231, custodyHolder: { en: "Malkhana — Bhowanipore PS", bn: "মালখানা — ভবানীপুর থানা" }, sizeMb: 318, transfers: 1 },
  { id: "ev-4", evidenceId: "EV/PKS/2024/0388/011", caseNumber: "PS-PKS/2024/0388", description: { en: "KMC street camera export, Camac Street", bn: "কেএমসি রাস্তার ক্যামেরা এক্সপোর্ট, ক্যামাক স্ট্রিট" }, type: "cctv", capturedOn: "2024-11-03T09:15:00", capturedBy: { en: "SI Sutapa Mukherjee", bn: "সাব-ইন্সপেক্টর সুতপা মুখার্জি" }, location: { en: "Park Street", bn: "পার্ক স্ট্রিট" }, hash: "7d31c9024fab8e56d0c71b93a2e48f60b5c97e13da248fb6091c3e7a5d820c4", integrity: "broken", custodyHolder: { en: "Cyber cell — Lalbazar", bn: "সাইবার সেল — লালবাজার" }, sizeMb: 1042, transfers: 4 },
  { id: "ev-5", evidenceId: "EV/JDP/2024/0351/027", caseNumber: "PS-JDP/2024/0351", description: { en: "Bank statement bundle, 6 accounts", bn: "ব্যাঙ্ক বিবৃতির সংকলন, ৬টি অ্যাকাউন্ট" }, type: "document", capturedOn: "2024-10-22T16:05:00", capturedBy: { en: "Insp. Anirban Das", bn: "ইন্সপেক্টর অনির্বাণ দাস" }, location: { en: "Jadavpur", bn: "যাদবপুর" }, hash: "b620ae5d9c13f8407e2a6b48d05c97f13ae8206b4d79ce015f83a2d6b490e7c1", integrity: "verified", block: 183905, custodyHolder: { en: "IO — Insp. Anirban Das", bn: "তদন্তকারী — ইন্সপেক্টর অনির্বাণ দাস" }, transfers: 2 },
];

export interface CustodyEvent {
  id: string;
  at: string;
  from: Bilingual;
  to: Bilingual;
  reason: Bilingual;
  signedBy: Bilingual;
  block?: number;
  sealIntact: boolean;
}

export const CUSTODY_CHAIN: CustodyEvent[] = [
  { id: "cc-1", at: "2024-11-19T02:10:00", from: { en: "Scene of occurrence", bn: "ঘটনাস্থল" }, to: { en: "SI Sutapa Mukherjee", bn: "সাব-ইন্সপেক্টর সুতপা মুখার্জি" }, reason: { en: "Seizure at scene", bn: "ঘটনাস্থলে বাজেয়াপ্তকরণ" }, signedBy: { en: "SI Sutapa Mukherjee", bn: "সাব-ইন্সপেক্টর সুতপা মুখার্জি" }, block: 184229, sealIntact: true },
  { id: "cc-2", at: "2024-11-19T09:25:00", from: { en: "SI Sutapa Mukherjee", bn: "সাব-ইন্সপেক্টর সুতপা মুখার্জি" }, to: { en: "Malkhana — Bhowanipore PS", bn: "মালখানা — ভবানীপুর থানা" }, reason: { en: "Deposit in police station store", bn: "থানার ভাণ্ডারে জমা" }, signedBy: { en: "OC Debashis Roy", bn: "ভারপ্রাপ্ত আধিকারিক দেবাশিস রায়" }, block: 184240, sealIntact: true },
  { id: "cc-3", at: "2024-11-24T11:00:00", from: { en: "Malkhana — Bhowanipore PS", bn: "মালখানা — ভবানীপুর থানা" }, to: { en: "Cyber cell — Lalbazar", bn: "সাইবার সেল — লালবাজার" }, reason: { en: "Forensic examination", bn: "ফরেনসিক পরীক্ষা" }, signedBy: { en: "Insp. Arindam Chatterjee", bn: "ইন্সপেক্টর অরিন্দম চ্যাটার্জি" }, block: 184602, sealIntact: true },
];

/* ------------------------------------------------------- 04 Missing persons */

export interface MissingPerson {
  id: string;
  refNumber: string;
  name: Bilingual;
  age: number;
  gender: "M" | "F" | "O";
  station: string;
  lastSeen: Bilingual;
  lastSeenAt: string;
  vulnerability?: Bilingual;
  status: "active" | "traced" | "transferred";
  sightings: number;
  verifiedSightings: number;
  clothing: Bilingual;
}

export const MISSING_PERSONS: MissingPerson[] = [
  { id: "mp-1", refNumber: "MP/KP/2024/0731", name: { en: "Ritika Saha", bn: "ঋতিকা সাহা" }, age: 14, gender: "F", station: "Jadavpur", lastSeen: { en: "Jadavpur 8B bus stand", bn: "যাদবপুর ৮বি বাস স্ট্যান্ড" }, lastSeenAt: "2024-12-01T16:20:00", vulnerability: { en: "Minor — juvenile protocol applies", bn: "নাবালিকা — কিশোর প্রোটোকল প্রযোজ্য" }, status: "active", sightings: 6, verifiedSightings: 1, clothing: { en: "Navy school uniform, white shoes, red backpack", bn: "নেভি স্কুল ইউনিফর্ম, সাদা জুতো, লাল ব্যাকপ্যাক" } },
  { id: "mp-2", refNumber: "MP/KP/2024/0724", name: { en: "Nirmal Kumar Ghosh", bn: "নির্মল কুমার ঘোষ" }, age: 72, gender: "M", station: "Shyampukur", lastSeen: { en: "Shyambazar five-point crossing", bn: "শ্যামবাজার পাঁচ মাথার মোড়" }, lastSeenAt: "2024-11-28T09:05:00", vulnerability: { en: "Diagnosed with dementia", bn: "ডিমেনশিয়া নির্ণীত" }, status: "active", sightings: 11, verifiedSightings: 3, clothing: { en: "White kurta, brown shawl, walking stick", bn: "সাদা কুর্তা, বাদামি শাল, লাঠি" } },
  { id: "mp-3", refNumber: "MP/KP/2024/0698", name: { en: "Sourav Mandal", bn: "সৌরভ মণ্ডল" }, age: 23, gender: "M", station: "Behala", lastSeen: { en: "Behala Chowrasta", bn: "বেহালা চৌরাস্তা" }, lastSeenAt: "2024-11-19T21:40:00", status: "traced", sightings: 4, verifiedSightings: 4, clothing: { en: "Grey hoodie, blue jeans", bn: "ধূসর হুডি, নীল জিনস" } },
  { id: "mp-4", refNumber: "MP/WBP/2024/1142", name: { en: "Ashima Bibi", bn: "আসিমা বিবি" }, age: 31, gender: "F", station: "Bidhannagar North", lastSeen: { en: "Karunamoyee bus terminus", bn: "করুণাময়ী বাস টার্মিনাস" }, lastSeenAt: "2024-11-25T18:15:00", status: "active", sightings: 2, verifiedSightings: 0, clothing: { en: "Green saree, black handbag", bn: "সবুজ শাড়ি, কালো হাতব্যাগ" } },
];

/* --------------------------------------------- 06 Accident reconstruction */

export interface AccidentCase {
  id: string;
  refNumber: string;
  location: Bilingual;
  at: string;
  vehicles: string[];
  casualties: { fatal: number; grievous: number; minor: number };
  camerasFound: number;
  anprHits: number;
  status: "reconstructing" | "draft-report" | "approved";
  signalDataAvailable: boolean;
}

export const ACCIDENTS: AccidentCase[] = [
  { id: "ac-1", refNumber: "TRF/KP/2024/0918", location: { en: "EM Bypass, Ruby crossing", bn: "ইএম বাইপাস, রুবি মোড়" }, at: "2024-11-30T18:32:00", vehicles: ["WB-06-BC-2210", "WB-19-AA-8841"], casualties: { fatal: 1, grievous: 1, minor: 0 }, camerasFound: 7, anprHits: 4, status: "reconstructing", signalDataAvailable: true },
  { id: "ac-2", refNumber: "TRF/KP/2024/0902", location: { en: "AJC Bose Road flyover", bn: "এজেসি বোস রোড উড়ালপুল" }, at: "2024-11-27T07:48:00", vehicles: ["WB-02-AD-5517", "WB-20-CX-1104"], casualties: { fatal: 0, grievous: 2, minor: 3 }, camerasFound: 5, anprHits: 6, status: "draft-report", signalDataAvailable: true },
  { id: "ac-3", refNumber: "TRF/KP/2024/0877", location: { en: "Behala Chowrasta", bn: "বেহালা চৌরাস্তা" }, at: "2024-11-19T21:40:00", vehicles: ["WB-24-GH-3390"], casualties: { fatal: 1, grievous: 0, minor: 0 }, camerasFound: 3, anprHits: 2, status: "approved", signalDataAvailable: false },
];

/* ------------------------------------------------ 07 Dispatch & response */

export interface DispatchIncident {
  id: string;
  ref: string;
  type: Bilingual;
  location: Bilingual;
  reportedAt: string;
  severity: Severity;
  source: "control-room" | "phone" | "app" | "cctv" | "officer";
  status: "unassigned" | "dispatched" | "on-scene" | "resolved";
  assignedUnit?: string;
  etaMinutes?: number;
  ackSeconds?: number;
}

export const INCIDENTS: DispatchIncident[] = [
  { id: "in-1", ref: "INC-24-118422", type: { en: "Road accident with injury", bn: "আহত সহ পথ দুর্ঘটনা" }, location: { en: "EM Bypass near Science City", bn: "সায়েন্স সিটির কাছে ইএম বাইপাস" }, reportedAt: "14:52", severity: "critical", source: "cctv", status: "dispatched", assignedUnit: "PCR-17", etaMinutes: 4, ackSeconds: 38 },
  { id: "in-2", ref: "INC-24-118419", type: { en: "Public disturbance", bn: "জনসাধারণের শান্তিভঙ্গ" }, location: { en: "Hatibagan market", bn: "হাতিবাগান বাজার" }, reportedAt: "14:46", severity: "medium", source: "phone", status: "on-scene", assignedUnit: "PCR-23", etaMinutes: 0, ackSeconds: 51 },
  { id: "in-3", ref: "INC-24-118415", type: { en: "Snatching reported", bn: "ছিনতাইয়ের অভিযোগ" }, location: { en: "Gariahat crossing", bn: "গড়িয়াহাট মোড়" }, reportedAt: "14:39", severity: "high", source: "app", status: "unassigned" },
  { id: "in-4", ref: "INC-24-118402", type: { en: "Medical emergency", bn: "চিকিৎসা জরুরি অবস্থা" }, location: { en: "Sealdah station north gate", bn: "শিয়ালদহ স্টেশন উত্তর গেট" }, reportedAt: "14:21", severity: "critical", source: "control-room", status: "resolved", assignedUnit: "PCR-04", etaMinutes: 0, ackSeconds: 22 },
  { id: "in-5", ref: "INC-24-118398", type: { en: "Suspicious object", bn: "সন্দেহজনক বস্তু" }, location: { en: "Esplanade bus terminus", bn: "এসপ্ল্যানেড বাস টার্মিনাস" }, reportedAt: "14:12", severity: "high", source: "cctv", status: "dispatched", assignedUnit: "BDS-02", etaMinutes: 9, ackSeconds: 64 },
];

export interface PatrolUnit {
  id: string;
  callSign: string;
  type: "PCR" | "Bike" | "Ambulance" | "BDS" | "Traffic";
  station: string;
  status: "available" | "engaged" | "off-duty";
  officers: number;
  etaMinutes: number;
  distanceKm: number;
}

export const UNITS: PatrolUnit[] = [
  { id: "u-1", callSign: "PCR-17", type: "PCR", station: "Kasba", status: "engaged", officers: 3, etaMinutes: 4, distanceKm: 1.8 },
  { id: "u-2", callSign: "PCR-23", type: "PCR", station: "Shyampukur", status: "engaged", officers: 3, etaMinutes: 0, distanceKm: 0.2 },
  { id: "u-3", callSign: "PCR-31", type: "PCR", station: "Ballygunge", status: "available", officers: 2, etaMinutes: 6, distanceKm: 2.6 },
  { id: "u-4", callSign: "BIKE-09", type: "Bike", station: "Park Street", status: "available", officers: 1, etaMinutes: 3, distanceKm: 1.1 },
  { id: "u-5", callSign: "BDS-02", type: "BDS", station: "Lalbazar", status: "engaged", officers: 5, etaMinutes: 9, distanceKm: 4.3 },
  { id: "u-6", callSign: "TRF-14", type: "Traffic", station: "Traffic HQ", status: "available", officers: 2, etaMinutes: 5, distanceKm: 2.0 },
];

/* -------------------------------------------------- 08 Station performance */

export interface StationMetrics {
  id: string;
  station: string;
  division: string;
  openInvestigations: number;
  backlog0to30: number;
  backlog31to60: number;
  backlog61to90: number;
  backlog90plus: number;
  disposalRate: number;
  avgResponseMinutes: number;
  pendingForensics: number;
  pendingCourt: number;
  officerStrength: number;
}

export const STATION_METRICS: StationMetrics[] = [
  { id: "sm-1", station: "Bhowanipore", division: "South", openInvestigations: 184, backlog0to30: 61, backlog31to60: 48, backlog61to90: 39, backlog90plus: 36, disposalRate: 68, avgResponseMinutes: 7.4, pendingForensics: 27, pendingCourt: 42, officerStrength: 74 },
  { id: "sm-2", station: "Park Street", division: "South East", openInvestigations: 147, backlog0to30: 58, backlog31to60: 41, backlog61to90: 28, backlog90plus: 20, disposalRate: 74, avgResponseMinutes: 6.1, pendingForensics: 18, pendingCourt: 33, officerStrength: 69 },
  { id: "sm-3", station: "Jadavpur", division: "Eastern Suburban", openInvestigations: 211, backlog0to30: 66, backlog31to60: 52, backlog61to90: 45, backlog90plus: 48, disposalRate: 61, avgResponseMinutes: 8.9, pendingForensics: 34, pendingCourt: 51, officerStrength: 71 },
  { id: "sm-4", station: "Behala", division: "South West", openInvestigations: 163, backlog0to30: 55, backlog31to60: 44, backlog61to90: 33, backlog90plus: 31, disposalRate: 70, avgResponseMinutes: 8.2, pendingForensics: 22, pendingCourt: 37, officerStrength: 62 },
  { id: "sm-5", station: "Burrabazar", division: "Central", openInvestigations: 198, backlog0to30: 72, backlog31to60: 50, backlog61to90: 41, backlog90plus: 35, disposalRate: 66, avgResponseMinutes: 7.9, pendingForensics: 29, pendingCourt: 46, officerStrength: 80 },
];

/* ------------------------------------------------- 09 Citizen grievance */

export interface Grievance {
  id: string;
  ref: string;
  citizen: Bilingual;
  channel: "web" | "mobile" | "whatsapp" | "email" | "call-centre" | "counter";
  language: "bn" | "en" | "mixed";
  category: Bilingual;
  summary: Bilingual;
  locality: Bilingual;
  routedTo: string;
  priority: Severity;
  status: "received" | "assigned" | "under-review" | "action-taken" | "closed";
  receivedAt: string;
  duplicateOf?: string;
  aiConfidence: number;
}

export const GRIEVANCES: Grievance[] = [
  { id: "gr-1", ref: "GRV/2024/21884", citizen: { en: "Ruma Adhikari", bn: "রুমা অধিকারী" }, channel: "whatsapp", language: "bn", category: { en: "Traffic obstruction", bn: "যানজট সৃষ্টি" }, summary: { en: "Illegally parked lorries blocking the lane every evening.", bn: "প্রতি সন্ধ্যায় বেআইনি পার্ক করা লরি রাস্তা আটকে রাখছে।" }, locality: { en: "Ultadanga", bn: "উল্টোডাঙা" }, routedTo: "Ultadanga PS", priority: "medium", status: "assigned", receivedAt: "2024-12-02T19:14:00", aiConfidence: 0.89 },
  { id: "gr-2", ref: "GRV/2024/21879", citizen: { en: "Sanjoy Mondal", bn: "সঞ্জয় মণ্ডল" }, channel: "call-centre", language: "mixed", category: { en: "Cybercrime", bn: "সাইবার অপরাধ" }, summary: { en: "Lost ₹42,000 to a fake electricity-bill message.", bn: "ভুয়ো বিদ্যুৎ বিলের বার্তায় ৪২,০০০ টাকা খুইয়েছেন।" }, locality: { en: "Baguiati", bn: "বাগুইআটি" }, routedTo: "Cyber PS, Bidhannagar", priority: "high", status: "under-review", receivedAt: "2024-12-02T15:40:00", aiConfidence: 0.94 },
  { id: "gr-3", ref: "GRV/2024/21861", citizen: { en: "Ishita Chowdhury", bn: "ইশিতা চৌধুরী" }, channel: "web", language: "en", category: { en: "Harassment", bn: "হয়রানি" }, summary: { en: "Repeated following near the college gate after classes.", bn: "ক্লাসের পর কলেজ গেটের কাছে বারবার অনুসরণ।" }, locality: { en: "Ballygunge", bn: "বালিগঞ্জ" }, routedTo: "Ballygunge PS", priority: "critical", status: "action-taken", receivedAt: "2024-12-01T11:02:00", aiConfidence: 0.91 },
  { id: "gr-4", ref: "GRV/2024/21855", citizen: { en: "Pradip Kundu", bn: "প্রদীপ কুন্ডু" }, channel: "mobile", language: "bn", category: { en: "Public nuisance", bn: "জনউপদ্রব" }, summary: { en: "Loudspeakers past permitted hours during the fair.", bn: "মেলার সময় অনুমোদিত সময়ের পরেও মাইক বাজানো হচ্ছে।" }, locality: { en: "Behala", bn: "বেহালা" }, routedTo: "Behala PS", priority: "low", status: "closed", receivedAt: "2024-11-30T22:35:00", duplicateOf: "GRV/2024/21850", aiConfidence: 0.72 },
  { id: "gr-5", ref: "GRV/2024/21850", citizen: { en: "Bikash Haldar", bn: "বিকাশ হালদার" }, channel: "counter", language: "bn", category: { en: "Public nuisance", bn: "জনউপদ্রব" }, summary: { en: "Same loudspeaker complaint reported at the station counter.", bn: "একই মাইকের অভিযোগ থানার কাউন্টারে জানানো হয়েছে।" }, locality: { en: "Behala", bn: "বেহালা" }, routedTo: "Behala PS", priority: "low", status: "received", receivedAt: "2024-11-30T21:10:00", aiConfidence: 0.68 },
];

/* ------------------------------------------------ 11 Knowledge assistant */

export interface KnowledgeDoc {
  id: string;
  title: Bilingual;
  type: "sop" | "circular" | "manual" | "act" | "form" | "order";
  reference: string;
  issuedBy: Bilingual;
  issuedOn: string;
  pages: number;
  indexed: boolean;
}

export const KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  { id: "kd-1", title: { en: "Bharatiya Nagarik Suraksha Sanhita, 2023 — investigation chapters", bn: "ভারতীয় নাগরিক সুরক্ষা সংহিতা, ২০২৩ — তদন্ত অধ্যায়" }, type: "act", reference: "BNSS 2023", issuedBy: { en: "Government of India", bn: "ভারত সরকার" }, issuedOn: "2023-12-25", pages: 412, indexed: true },
  { id: "kd-2", title: { en: "Audio-video recording of search and seizure — standing order", bn: "তল্লাশি ও বাজেয়াপ্তকরণের অডিও-ভিডিও রেকর্ডিং — স্থায়ী আদেশ" }, type: "order", reference: "KP/SO/2024/17", issuedBy: { en: "Commissioner of Police, Kolkata", bn: "পুলিশ কমিশনার, কলকাতা" }, issuedOn: "2024-04-11", pages: 14, indexed: true },
  { id: "kd-3", title: { en: "Handling of digital evidence — SOP", bn: "ডিজিটাল সাক্ষ্য পরিচালনা — এসওপি" }, type: "sop", reference: "KP/SOP/DE/2023/04", issuedBy: { en: "Cyber Cell, Lalbazar", bn: "সাইবার সেল, লালবাজার" }, issuedOn: "2023-09-02", pages: 38, indexed: true },
  { id: "kd-4", title: { en: "Missing person — first 24 hours checklist", bn: "নিখোঁজ ব্যক্তি — প্রথম ২৪ ঘণ্টার চেকলিস্ট" }, type: "sop", reference: "WBP/SOP/MP/2022/11", issuedBy: { en: "West Bengal Police", bn: "পশ্চিমবঙ্গ পুলিশ" }, issuedOn: "2022-06-17", pages: 9, indexed: true },
  { id: "kd-5", title: { en: "Malkhana management and periodic audit", bn: "মালখানা ব্যবস্থাপনা ও পর্যায়ক্রমিক নিরীক্ষা" }, type: "circular", reference: "KP/CIR/2024/58", issuedBy: { en: "Commissioner of Police, Kolkata", bn: "পুলিশ কমিশনার, কলকাতা" }, issuedOn: "2024-08-29", pages: 22, indexed: false },
];

export interface KnowledgeAnswer {
  question: Bilingual;
  answer: Bilingual;
  sources: EvidenceSource[];
  confidence: number;
}

export const SAMPLE_ANSWERS: KnowledgeAnswer[] = [
  {
    question: { en: "When must search and seizure be video recorded?", bn: "কখন তল্লাশি ও বাজেয়াপ্তকরণের ভিডিও রেকর্ডিং বাধ্যতামূলক?" },
    answer: {
      en: "BNSS section 105 requires audio-video recording of search and seizure, preferably on a mobile phone, and the recording must be forwarded to the District Magistrate without delay. Kolkata Police standing order KP/SO/2024/17 additionally requires the recording officer to be named in the seizure list and the file hash to be registered in the evidence ledger the same day.",
      bn: "বিএনএসএস ১০৫ ধারা অনুযায়ী তল্লাশি ও বাজেয়াপ্তকরণের অডিও-ভিডিও রেকর্ডিং বাধ্যতামূলক, বিশেষত মোবাইল ফোনে, এবং রেকর্ডিং বিলম্ব না করে জেলা ম্যাজিস্ট্রেটের কাছে পাঠাতে হবে। কলকাতা পুলিশের স্থায়ী আদেশ KP/SO/2024/17 অনুযায়ী রেকর্ডিংকারী আধিকারিকের নাম বাজেয়াপ্ত তালিকায় উল্লেখ করতে হবে এবং ফাইল হ্যাশ একই দিনে সাক্ষ্য খতিয়ানে নথিভুক্ত করতে হবে।",
    },
    sources: [
      { id: "ks-1", label: "BNSS 2023", type: "circular", locator: "s. 105" },
      { id: "ks-2", label: "KP/SO/2024/17", type: "circular", locator: "para 3-4" },
    ],
    confidence: 0.93,
  },
];

/* ------------------------------------------- 12 Case file & court readiness */

export interface CaseFileDoc {
  id: string;
  serial: string;
  title: Bilingual;
  type: "fir" | "statement" | "seizure" | "photograph" | "forensic" | "medical" | "correspondence" | "cctv";
  pages: number;
  addedOn: string;
  signed: boolean;
  issues: Bilingual[];
}

export const CASE_FILE_DOCS: CaseFileDoc[] = [
  { id: "cf-1", serial: "D-01", title: { en: "First Information Report", bn: "প্রথম তথ্য প্রতিবেদন" }, type: "fir", pages: 4, addedOn: "2024-11-18", signed: true, issues: [] },
  { id: "cf-2", serial: "D-02", title: { en: "Seizure list — showroom premises", bn: "বাজেয়াপ্ত তালিকা — দোকান প্রাঙ্গণ" }, type: "seizure", pages: 3, addedOn: "2024-11-19", signed: true, issues: [] },
  { id: "cf-3", serial: "D-03", title: { en: "Statement of complainant u/s BNSS 180", bn: "বিএনএসএস ১৮০ ধারায় অভিযোগকারীর বয়ান" }, type: "statement", pages: 6, addedOn: "2024-11-19", signed: true, issues: [] },
  { id: "cf-4", serial: "D-04", title: { en: "Statement of witness — Bikash Haldar", bn: "সাক্ষীর বয়ান — বিকাশ হালদার" }, type: "statement", pages: 4, addedOn: "2024-11-20", signed: false, issues: [{ en: "Signature of the recording officer missing on page 4", bn: "৪ নম্বর পৃষ্ঠায় রেকর্ডিং আধিকারিকের স্বাক্ষর অনুপস্থিত" }] },
  { id: "cf-5", serial: "D-05", title: { en: "Crime scene photographs", bn: "ঘটনাস্থলের আলোকচিত্র" }, type: "photograph", pages: 42, addedOn: "2024-11-19", signed: true, issues: [] },
  { id: "cf-6", serial: "D-06", title: { en: "Ballistics report", bn: "ব্যালিস্টিক প্রতিবেদন" }, type: "forensic", pages: 0, addedOn: "—", signed: false, issues: [{ en: "Not received from the State FSL", bn: "রাজ্য এফএসএল থেকে পাওয়া যায়নি" }] },
  { id: "cf-7", serial: "D-07", title: { en: "CCTV certificate u/s BSA 63", bn: "বিএসএ ৬৩ ধারায় সিসিটিভি শংসাপত্র" }, type: "cctv", pages: 2, addedOn: "2024-11-22", signed: false, issues: [{ en: "Certificate not signed by the custodian of the device", bn: "যন্ত্রের রক্ষকের স্বাক্ষর শংসাপত্রে নেই" }] },
];

export interface EvidenceMatrixRow {
  id: string;
  evidence: Bilingual;
  establishes: Bilingual;
  source: Bilingual;
  witness: Bilingual;
  documentRef: string;
  strength: "strong" | "supporting" | "weak";
}

export const EVIDENCE_MATRIX: EvidenceMatrixRow[] = [
  { id: "em-1", evidence: { en: "Showroom DVR footage", bn: "দোকানের ডিভিআর ফুটেজ" }, establishes: { en: "Presence and conduct of three persons inside the premises", bn: "প্রাঙ্গণের ভিতরে তিনজনের উপস্থিতি ও আচরণ" }, source: { en: "Seized from complainant", bn: "অভিযোগকারীর কাছ থেকে বাজেয়াপ্ত" }, witness: { en: "Sharmila Dutta", bn: "শর্মিলা দত্ত" }, documentRef: "D-05 / EV-001", strength: "strong" },
  { id: "em-2", evidence: { en: "ANPR detection of WB-02-AK-4471", bn: "WB-02-AK-4471-এর এএনপিআর শনাক্তকরণ" }, establishes: { en: "Vehicle in the vicinity three minutes before entry", bn: "প্রবেশের তিন মিনিট আগে গাড়িটি নিকটবর্তী এলাকায়" }, source: { en: "Traffic ANPR, Jagubazar", bn: "ট্রাফিক এএনপিআর, যদুবাবুর বাজার" }, witness: { en: "—", bn: "—" }, documentRef: "EV-004", strength: "supporting" },
  { id: "em-3", evidence: { en: "CDR tower location", bn: "সিডিআর টাওয়ার অবস্থান" }, establishes: { en: "Handset of the accused in the locality during the incident", bn: "ঘটনার সময় অভিযুক্তের হ্যান্ডসেট এলাকায় ছিল" }, source: { en: "Service provider", bn: "পরিষেবা প্রদানকারী" }, witness: { en: "Nodal officer", bn: "নোডাল আধিকারিক" }, documentRef: "D-09", strength: "supporting" },
  { id: "em-4", evidence: { en: "Ballistics report", bn: "ব্যালিস্টিক প্রতিবেদন" }, establishes: { en: "Nature of the weapon used", bn: "ব্যবহৃত অস্ত্রের প্রকৃতি" }, source: { en: "State FSL", bn: "রাজ্য এফএসএল" }, witness: { en: "—", bn: "—" }, documentRef: "D-06 (awaited)", strength: "weak" },
];

/* ------------------------------------------------------------- 13 Bodycam */

export interface BodycamDevice {
  id: string;
  deviceId: string;
  assignedTo: Bilingual;
  station: string;
  battery: number;
  storageUsedPct: number;
  firmware: string;
  status: "docked" | "in-field" | "fault" | "unassigned";
  lastUpload: string;
  pendingClips: number;
}

export const BODYCAMS: BodycamDevice[] = [
  { id: "bc-1", deviceId: "KP-BWC-0184", assignedTo: { en: "SI Sutapa Mukherjee", bn: "সাব-ইন্সপেক্টর সুতপা মুখার্জি" }, station: "Bhowanipore", battery: 78, storageUsedPct: 42, firmware: "3.4.1", status: "in-field", lastUpload: "2024-12-02T08:10:00", pendingClips: 4 },
  { id: "bc-2", deviceId: "KP-BWC-0211", assignedTo: { en: "ASI Rituparna Ghosh", bn: "সহকারী সাব-ইন্সপেক্টর ঋতুপর্ণা ঘোষ" }, station: "Kasba", battery: 100, storageUsedPct: 11, firmware: "3.4.1", status: "docked", lastUpload: "2024-12-03T06:45:00", pendingClips: 0 },
  { id: "bc-3", deviceId: "KP-BWC-0097", assignedTo: { en: "Unassigned", bn: "অনির্ধারিত" }, station: "Park Street", battery: 12, storageUsedPct: 88, firmware: "3.2.7", status: "fault", lastUpload: "2024-11-24T19:20:00", pendingClips: 9 },
  { id: "bc-4", deviceId: "KP-BWC-0302", assignedTo: { en: "Insp. Anirban Das", bn: "ইন্সপেক্টর অনির্বাণ দাস" }, station: "Jadavpur", battery: 64, storageUsedPct: 57, firmware: "3.4.1", status: "in-field", lastUpload: "2024-12-02T21:05:00", pendingClips: 2 },
];

export interface BodycamClip {
  id: string;
  clipId: string;
  device: string;
  officer: Bilingual;
  recordedAt: string;
  durationMin: number;
  caseRef?: string;
  hash: string;
  integrity: IntegrityState;
  block?: number;
  transcribed: boolean;
  events: Bilingual[];
  retention: "standard" | "evidence" | "complaint" | "court-hold";
}

export const BODYCAM_CLIPS: BodycamClip[] = [
  { id: "bcl-1", clipId: "CLIP-0184-2411-0042", device: "KP-BWC-0184", officer: { en: "SI Sutapa Mukherjee", bn: "সাব-ইন্সপেক্টর সুতপা মুখার্জি" }, recordedAt: "2024-11-21T11:35:00", durationMin: 18, caseRef: "PS-BHW/2024/0412", hash: "e91a7c4b02d6f83519ae7b2c40d6598f1b3ae07c25d94f608b1c7a3e5d029f46", integrity: "verified", block: 184488, transcribed: true, events: [{ en: "Seizure recorded", bn: "বাজেয়াপ্তকরণ রেকর্ড করা হয়েছে" }, { en: "Caution administered", bn: "সতর্কীকরণ জানানো হয়েছে" }], retention: "evidence" },
  { id: "bcl-2", clipId: "CLIP-0302-2412-0007", device: "KP-BWC-0302", officer: { en: "Insp. Anirban Das", bn: "ইন্সপেক্টর অনির্বাণ দাস" }, recordedAt: "2024-12-02T20:14:00", durationMin: 7, hash: "5d20b9f3ea7c186409db35f7a2c0e84d6b1937fa05c2d8e461a7b390cf58d012", integrity: "pending", transcribed: false, events: [], retention: "standard" },
  { id: "bcl-3", clipId: "CLIP-0097-2411-0118", device: "KP-BWC-0097", officer: { en: "Unassigned", bn: "অনির্ধারিত" }, recordedAt: "2024-11-24T19:02:00", durationMin: 24, hash: "a17c3e08b2d59f6401ae7c8b3d20f951", integrity: "broken", transcribed: false, events: [{ en: "Confrontation detected", bn: "বচসা শনাক্ত" }], retention: "complaint" },
];

/* ------------------------------------------------------------ 14 Malkhana */

export interface PropertyItem {
  id: string;
  propertyId: string;
  caseNumber: string;
  description: Bilingual;
  category: "weapon" | "electronics" | "documents" | "currency" | "narcotics" | "vehicle" | "other";
  seizedOn: string;
  seizedBy: Bilingual;
  rack: string;
  sealNumber: string;
  sealIntact: boolean;
  location: "malkhana" | "forensic" | "court" | "io" | "disposed";
  integrity: IntegrityState;
  block?: number;
  overdueDays?: number;
}

export const PROPERTY_ITEMS: PropertyItem[] = [
  { id: "pr-1", propertyId: "MK/BHW/2024/1187", caseNumber: "PS-BHW/2024/0412", description: { en: "Mobile handset, Redmi Note 12, black", bn: "মোবাইল হ্যান্ডসেট, রেডমি নোট ১২, কালো" }, category: "electronics", seizedOn: "2024-11-21", seizedBy: { en: "ASI Rituparna Ghosh", bn: "সহকারী সাব-ইন্সপেক্টর ঋতুপর্ণা ঘোষ" }, rack: "R-04 / S-12", sealNumber: "SEAL-BHW-88421", sealIntact: true, location: "forensic", integrity: "verified", block: 184602, overdueDays: 22 },
  { id: "pr-2", propertyId: "MK/BHW/2024/1188", caseNumber: "PS-BHW/2024/0412", description: { en: "Country-made firearm with two live rounds", bn: "দেশি আগ্নেয়াস্ত্র সহ দুটি সক্রিয় কার্তুজ" }, category: "weapon", seizedOn: "2024-11-21", seizedBy: { en: "Insp. Arindam Chatterjee", bn: "ইন্সপেক্টর অরিন্দম চ্যাটার্জি" }, rack: "R-01 / S-03", sealNumber: "SEAL-BHW-88422", sealIntact: true, location: "forensic", integrity: "verified", block: 184603, overdueDays: 22 },
  { id: "pr-3", propertyId: "MK/PKS/2024/0921", caseNumber: "PS-PKS/2024/0388", description: { en: "Gold chain, 14 g, recovered", bn: "সোনার চেন, ১৪ গ্রাম, উদ্ধারকৃত" }, category: "other", seizedOn: "2024-11-06", seizedBy: { en: "SI Sutapa Mukherjee", bn: "সাব-ইন্সপেক্টর সুতপা মুখার্জি" }, rack: "R-07 / S-01", sealNumber: "SEAL-PKS-40118", sealIntact: true, location: "malkhana", integrity: "verified", block: 184102 },
  { id: "pr-4", propertyId: "MK/JDP/2024/0664", caseNumber: "PS-JDP/2024/0351", description: { en: "Laptop, Dell Latitude, with charger", bn: "ল্যাপটপ, ডেল ল্যাটিটিউড, চার্জার সহ" }, category: "electronics", seizedOn: "2024-10-24", seizedBy: { en: "Insp. Anirban Das", bn: "ইন্সপেক্টর অনির্বাণ দাস" }, rack: "R-03 / S-09", sealNumber: "SEAL-JDP-77310", sealIntact: false, location: "court", integrity: "broken", overdueDays: 9 },
  { id: "pr-5", propertyId: "MK/BEH/2024/0512", caseNumber: "PS-BEH/2024/0221", description: { en: "Two-wheeler, WB-24-GH-3390", bn: "দুই চাকার যান, WB-24-GH-3390" }, category: "vehicle", seizedOn: "2024-08-11", seizedBy: { en: "SI Moumita Sen", bn: "সাব-ইন্সপেক্টর মৌমিতা সেন" }, rack: "Yard B", sealNumber: "SEAL-BEH-20094", sealIntact: true, location: "malkhana", integrity: "pending" },
];

/* ------------------------------------------------------- dashboard rollups */

export const DASHBOARD_TRENDS = [
  { month: "Jul", firs: 412, disposals: 288, grievances: 640 },
  { month: "Aug", firs: 438, disposals: 301, grievances: 702 },
  { month: "Sep", firs: 459, disposals: 327, grievances: 688 },
  { month: "Oct", firs: 471, disposals: 344, grievances: 731 },
  { month: "Nov", firs: 502, disposals: 361, grievances: 795 },
  { month: "Dec", firs: 188, disposals: 142, grievances: 284 },
];
