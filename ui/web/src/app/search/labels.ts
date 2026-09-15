import type { SearchKind } from "@/lib/api/search";

/** Record search strings, shared by the search page and the command palette. */
export const SEARCH_LABELS = {
  title: { en: "Search records", bn: "নথি খুঁজুন" },
  description: {
    en: "Find FIRs, cases, evidence, warrants, accused, officers, fleet vehicles, traffic challans and lookout notices.",
    bn: "এজাহার, মামলা, প্রমাণ, পরোয়ানা, অভিযুক্ত, আধিকারিক, বাহিনীর যানবাহন, ট্রাফিক চালান ও লুকআউট নোটিস খুঁজুন।",
  },
  placeholder: {
    en: "Number, name, vehicle registration or seal…",
    bn: "নম্বর, নাম, গাড়ির রেজিস্ট্রেশন বা সিল…",
  },
  scope: {
    en: "Matches part of a number, name or description. Every search is recorded in the audit trail with the term.",
    bn: "নম্বর, নাম বা বিবরণের অংশ মেলানো হয়। প্রতিটি অনুসন্ধান শব্দসহ অডিট ট্রেইলে নথিভুক্ত হয়।",
  },
  startTitle: { en: "Type at least 2 characters", bn: "অন্তত ২টি অক্ষর লিখুন" },
  startBody: { en: "For example a FIR number, a vehicle registration or a name.", bn: "যেমন এজাহার নম্বর, গাড়ির রেজিস্ট্রেশন বা একটি নাম।" },
  searching: { en: "Searching…", bn: "খোঁজা হচ্ছে…" },
  failed: { en: "Search failed", bn: "অনুসন্ধান ব্যর্থ" },
  retry: { en: "Try again", bn: "আবার চেষ্টা করুন" },
  noHits: { en: "No records match", bn: "কোনো নথি মেলেনি" },
  limited: { en: "Showing the 5 most recent matches — refine the term to narrow them.", bn: "সাম্প্রতিক ৫টি মিল দেখানো হচ্ছে — সংকুচিত করতে শব্দ বদলান।" },
  paletteHeading: { en: "Records", bn: "নথি" },
  paletteAll: { en: "Search all records for", bn: "সব নথিতে খুঁজুন" },
};

export const SEARCH_KIND_LABEL: Record<SearchKind, { en: string; bn: string }> = {
  fir: { en: "FIRs", bn: "এজাহার" },
  case: { en: "Cases", bn: "মামলা" },
  evidence: { en: "Evidence", bn: "প্রমাণ" },
  warrant: { en: "Warrants", bn: "পরোয়ানা" },
  accused: { en: "Accused", bn: "অভিযুক্ত" },
  officer: { en: "Officers", bn: "আধিকারিক" },
  vehicle: { en: "Fleet vehicles", bn: "বাহিনীর যানবাহন" },
  challan: { en: "Traffic challans", bn: "ট্রাফিক চালান" },
  lookout: { en: "Lookout notices", bn: "লুকআউট নোটিস" },
};
