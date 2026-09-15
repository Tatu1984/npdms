import type { Dictionary } from "./en";
import { custodyBn } from "./custody.bn";
import { dispatchBn } from "./dispatch.bn";

/**
 * Bengali dictionary.
 *
 * Deliberately uses the vocabulary West Bengal Police actually use in
 * Bengali paperwork (এজাহার for FIR, মালখানা, থানা, ডিভিশন) rather than
 * literal translations of the English UI labels.
 *
 * A `DeepPartial` — any key left out falls back to English at lookup.
 */
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

export const bn: DeepPartial<Dictionary> = {
  custodyScreen: custodyBn,
  dispatchScreen: dispatchBn,

  common: {
    appName: "কলকাতা পুলিশ ডিজিটাল ইন্টেলিজেন্স প্ল্যাটফর্ম",
    appNameShort: "কেপি ইন্টেলিজেন্স",
    search: "অনুসন্ধান",
    searchPlaceholder: "মামলা, ব্যক্তি, গাড়ি, সাক্ষ্যপ্রমাণ খুঁজুন…",
    filter: "ছাঁকনি",
    clear: "মুছুন",
    save: "সংরক্ষণ",
    cancel: "বাতিল",
    close: "বন্ধ",
    confirm: "নিশ্চিত করুন",
    approve: "অনুমোদন",
    reject: "প্রত্যাখ্যান",
    edit: "সম্পাদনা",
    delete: "মুছে ফেলুন",
    view: "দেখুন",
    viewAll: "সব দেখুন",
    export: "রপ্তানি",
    print: "মুদ্রণ",
    upload: "আপলোড",
    download: "ডাউনলোড",
    refresh: "রিফ্রেশ",
    loading: "লোড হচ্ছে…",
    noData: "কোনো নথি পাওয়া যায়নি",
    error: "কিছু ভুল হয়েছে",
    retry: "আবার চেষ্টা করুন",
    back: "পিছনে",
    next: "পরবর্তী",
    previous: "পূর্ববর্তী",
    showing: "দেখানো হচ্ছে",
    of: "এর মধ্যে",
    results: "ফলাফল",
    today: "আজ",
    yesterday: "গতকাল",
    thisWeek: "এই সপ্তাহ",
    thisMonth: "এই মাস",
    lastDays: "গত {n} দিন",
    status: "অবস্থা",
    priority: "অগ্রাধিকার",
    assignedTo: "দায়িত্বপ্রাপ্ত",
    createdOn: "তৈরির তারিখ",
    updatedOn: "সংশোধনের তারিখ",
    dueBy: "সময়সীমা",
    overdue: "সময় উত্তীর্ণ",
    pending: "মুলতুবি",
    completed: "সম্পন্ন",
    inProgress: "চলমান",
    all: "সব",
    none: "কিছু নয়",
    yes: "হ্যাঁ",
    no: "না",
    more: "আরও",
    details: "বিবরণ",
    summary: "সারসংক্ষেপ",
    timeline: "সময়রেখা",
    location: "স্থান",
    officer: "আধিকারিক",
    verified: "যাচাইকৃত",
    unverified: "অযাচাইকৃত",
  },

  nav: {
    coreGroup: "মূল পুলিশি কাজ",
    investigationGroup: "তদন্ত ইন্টেলিজেন্স",
    evidenceGroup: "সাক্ষ্যপ্রমাণ ও হেফাজত",
    surveillanceGroup: "নজরদারি ও ভিডিও",
    trafficGroup: "ট্রাফিক",
    citizenGroup: "নাগরিক ও জনসুরক্ষা",
    commandGroup: "কমান্ড ও পরিচালনা",
    knowledgeGroup: "জ্ঞানভান্ডার ও প্রশাসন",
    collapse: "সাইডবার সংকুচিত করুন",
    expand: "সাইডবার প্রসারিত করুন",
  },

  modules: {
    dashboard: "ড্যাশবোর্ড",
    dashboardDesc: "আপনার থানা ও ডিভিশনের কার্যচিত্র",

    fir: "এজাহার ও জিডি",
    firDesc: "এজাহার ও সাধারণ ডায়েরি নথিভুক্তি ও নজরদারি",
    cases: "মামলা নথি",
    casesDesc: "তদন্ত, মামলার অবস্থা ও ঊর্ধ্বতন তত্ত্বাবধান",
    warrants: "পরোয়ানা ও সমন",
    warrantsDesc: "গ্রেপ্তারি, তল্লাশি, সমন ও জামিন-অযোগ্য পরোয়ানা",
    bail: "জামিন",
    bailDesc: "জামিনের আবেদন, শর্ত ও জামিনদারের নথি",
    court: "আদালত ডায়েরি",
    courtDesc: "শুনানির তারিখ, আদেশ ও আদালতের চিঠিপত্র",
    forensics: "ফরেনসিক",
    forensicsDesc: "পরীক্ষাগারের অনুরোধ, প্রতিবেদন ও সময়সীমা",
    personnel: "কর্মীবৃন্দ",
    personnelDesc: "আধিকারিকের নথি, পদায়ন ও ডিউটি বণ্টন",

    investigation: "তদন্ত সহায়ক",
    investigationDesc:
      "এআই-সহায়ক মামলা কর্মক্ষেত্র: সাক্ষ্য সংগ্রহ, তথ্য নিষ্কাশন, সময়রেখা, অসঙ্গতি ও ঘাটতি চিহ্নিতকরণ",
    custody: "সাক্ষ্যপ্রমাণ ও হেফাজত শৃঙ্খল",
    custodyDesc:
      "পরিবর্তন-প্রমাণযোগ্য ডিজিটাল সাক্ষ্য: সংরক্ষণের সময় SHA-256, চাহিদামতো পুনর্যাচাই, এবং স্বাক্ষরিত ও কেবল-সংযোজনযোগ্য হেফাজত শৃঙ্খল",
    videoIntelligence: "ভিডিও ইন্টেলিজেন্স",
    videoIntelligenceDesc:
      "বিদ্যমান সিসিটিভির উপর এআই স্তর: ঘটনা শনাক্তকরণ, স্বাভাবিক ভাষায় অনুসন্ধান ও বহু-ক্যামেরা অনুসরণ",
    missingPersons: "নিখোঁজ ব্যক্তি",
    missingPersonsDesc:
      "নিখোঁজ ও ঝুঁকিপূর্ণ ব্যক্তির মামলা, সম্ভাব্য দর্শন মিলকরণ ও গতিপথ পুনর্গঠন",
    cyberIntelligence: "সাইবার ও আর্থিক প্রতারণা",
    cyberIntelligenceDesc:
      "প্রতারণা নেটওয়ার্ক গ্রাফ, অর্থের গতিপথ, মিউল অ্যাকাউন্ট শনাক্তকরণ ও ভুক্তভোগী গুচ্ছকরণ",
    accidentReconstruction: "দুর্ঘটনা পুনর্গঠন",
    accidentReconstructionDesc:
      "সিসিটিভি, এএনপিআর ও সিগন্যাল তথ্য থেকে ট্রাফিক দুর্ঘটনার পুনর্গঠন",
    dispatch: "ডিসপ্যাচ ও সাড়াদান",
    dispatchDesc:
      "ঘটনা গ্রহণ, অপারেটরের শ্রেণিবিন্যাস, দূরত্ব অনুযায়ী ইউনিট প্রেরণ ও ঊর্ধ্বতন পর্যায়ে জানানো",
    workload: "থানার কর্মক্ষমতা",
    workloadDesc:
      "কাজের চাপ, তদন্তের বকেয়া, সময়সীমা পর্যবেক্ষণ ও প্রতিবন্ধকতা শনাক্তকরণ",
    grievance: "নাগরিক অভিযোগ",
    grievanceDesc:
      "বাংলা সহায়তা সহ বহু-মাধ্যমে অভিযোগ গ্রহণ, বাছাই ও এক্তিয়ার অনুযায়ী প্রেরণ",
    riskIntelligence: "জনসুরক্ষা ঝুঁকি",
    riskIntelligenceDesc:
      "স্বচ্ছ কারণ-বিশ্লেষণ সহ এলাকাভিত্তিক ঝুঁকি নির্ধারণ ও টহল সুপারিশ",
    knowledge: "জ্ঞান সহায়ক",
    knowledgeDesc:
      "এসওপি, সার্কুলার ও বিএনএস/বিএনএসএস/বিএসএ ধারার উপর সূত্র-সহ উত্তর",
    caseFile: "কেস ফাইল ও আদালত প্রস্তুতি",
    caseFileDesc:
      "কেস ফাইল সংকলন, সাক্ষ্য ও সাক্ষী তালিকা, সম্পূর্ণতা যাচাই ও দাখিল প্যাক",
    bodycam: "বডি-ওর্ন ক্যামেরা",
    bodycamDesc:
      "বডিক্যাম যন্ত্র ব্যবস্থাপনা, সুরক্ষিত আপলোড, প্রতিলিপিকরণ ও মামলার সঙ্গে সংযুক্তি",
    malkhana: "মালখানা",
    malkhanaDesc:
      "কিউআর অনুসরণ ও ব্লকচেইন-নোঙরকৃত হেফাজত নথি সহ বাজেয়াপ্ত সম্পত্তির খতিয়ান",

    audit: "নিরীক্ষা নথি",
    auditDesc: "কে, কী, কখন ও কোথা থেকে করেছেন",
    settings: "সেটিংস",
    settingsDesc: "প্ল্যাটফর্ম কনফিগারেশন ও পছন্দ",
  },

  ai: {
    label: "এআই",
    assisted: "এআই-সহায়ক",
    suggestion: "এআই পরামর্শ",
    confidence: "নির্ভরযোগ্যতা",
    source: "সূত্র",
    sources: "সূত্রসমূহ",
    viewSource: "সূত্র দেখুন",
    model: "মডেল",
    generatedAt: "তৈরি হয়েছে",
    advisory: "শুধুমাত্র পরামর্শমূলক — ব্যবস্থা নেওয়ার আগে আধিকারিককে যাচাই করতে হবে",
    awaitingReview: "আধিকারিকের পর্যালোচনার অপেক্ষায়",
    approvedBy: "অনুমোদন করেছেন",
    rejectedBy: "প্রত্যাখ্যান করেছেন",
    approveFinding: "ফলাফল গ্রহণ করুন",
    rejectFinding: "ফলাফল প্রত্যাখ্যান করুন",
    noSource: "কোনো প্রামাণিক সূত্র পাওয়া যায়নি",
    noSourceBody:
      "এই প্রশ্নের জন্য সহায়ক কোনো প্রামাণিক নথি খুঁজে পায়নি। সূত্র ছাড়া এটি উত্তর দেবে না।",
    explainTitle: "এই ফলাফলের কারণ",
    humanInLoop: "এআই সুপারিশ করে · আধিকারিক সিদ্ধান্ত নেন",
  },

  chain: {
    label: "অখণ্ডতা",
    verified: "হ্যাশ যাচাইকৃত",
    pending: "নোঙর মুলতুবি",
    broken: "অখণ্ডতার অমিল",
    anchored: "চেইনে নোঙরকৃত",
    hash: "হ্যাশ",
    blockHeight: "ব্লক",
    anchoredAt: "নোঙরের সময়",
    verify: "অখণ্ডতা যাচাই করুন",
    custodyChain: "হেফাজত শৃঙ্খল",
    transferredTo: "হস্তান্তরিত",
    sealIntact: "সিল অক্ষত",
    sealBroken: "সিল ভাঙা",
  },

  severity: {
    low: "কম",
    medium: "মাঝারি",
    high: "উচ্চ",
    critical: "সংকটজনক",
  },

  auth: {
    signIn: "প্রবেশ করুন",
    signOut: "প্রস্থান",
    username: "ব্যবহারকারীর নাম",
    password: "পাসওয়ার্ড",
    badgeNumber: "ব্যাজ নম্বর",
    rememberMe: "এই যন্ত্রে আমাকে প্রবেশ করা অবস্থায় রাখুন",
    signingIn: "প্রবেশ করা হচ্ছে…",
    invalidCredentials: "ভুল ব্যবহারকারীর নাম বা পাসওয়ার্ড",
    officialUseOnly: "শুধুমাত্র অনুমোদিত ব্যবহার। সমস্ত কার্যকলাপ নথিভুক্ত ও নিরীক্ষিত হয়।",
  },

  agency: {
    label: "সংস্থা",
    kp: "কলকাতা পুলিশ",
    wbp: "পশ্চিমবঙ্গ পুলিশ",
    cid: "সিআইডি পশ্চিমবঙ্গ",
    traffic: "ট্রাফিক পুলিশ",
    division: "ডিভিশন",
    station: "থানা",
    allStations: "সমস্ত থানা",
  },

  settings: {
    language: "ভাষা",
    theme: "চেহারা",
    themeLight: "উজ্জ্বল",
    themeDark: "অন্ধকার",
    themeSystem: "সিস্টেম",
  },
};
