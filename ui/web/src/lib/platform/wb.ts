/**
 * West Bengal / Kolkata operational reference data.
 *
 * Replaces the Karnataka placeholders the prototype shipped with. Station and
 * court names follow Kolkata Police and West Bengal Police organisation;
 * treat the lists as representative for UI work, to be reconciled against the
 * official establishment list before deployment.
 */

export type AgencyId = "kp" | "wbp" | "cid" | "traffic";

export interface Agency {
  id: AgencyId;
  name: { en: string; bn: string };
  shortName: string;
  /** CSS custom property carrying the agency accent. */
  colorVar: string;
  headquarters: { en: string; bn: string };
}

export const AGENCIES: Agency[] = [
  {
    id: "kp",
    name: { en: "Kolkata Police", bn: "কলকাতা পুলিশ" },
    shortName: "KP",
    colorVar: "var(--agency-kp)",
    headquarters: { en: "Lalbazar, Kolkata", bn: "লালবাজার, কলকাতা" },
  },
  {
    id: "wbp",
    name: { en: "West Bengal Police", bn: "পশ্চিমবঙ্গ পুলিশ" },
    shortName: "WBP",
    colorVar: "var(--agency-wbp)",
    headquarters: { en: "Bhabani Bhavan, Alipore", bn: "ভবানী ভবন, আলিপুর" },
  },
  {
    id: "cid",
    name: { en: "CID West Bengal", bn: "সিআইডি পশ্চিমবঙ্গ" },
    shortName: "CID",
    colorVar: "var(--agency-cid)",
    headquarters: { en: "Bhabani Bhavan, Alipore", bn: "ভবানী ভবন, আলিপুর" },
  },
  {
    id: "traffic",
    name: { en: "Kolkata Traffic Police", bn: "কলকাতা ট্রাফিক পুলিশ" },
    shortName: "KTP",
    colorVar: "var(--agency-traffic)",
    headquarters: { en: "Traffic HQ, Lalbazar", bn: "ট্রাফিক সদর, লালবাজার" },
  },
];

export interface Division {
  id: string;
  agency: AgencyId;
  name: { en: string; bn: string };
  stations: string[];
}

/** Kolkata Police divisions with their principal police stations. */
export const KP_DIVISIONS: Division[] = [
  {
    id: "central",
    agency: "kp",
    name: { en: "Central Division", bn: "সেন্ট্রাল ডিভিশন" },
    stations: ["Bowbazar", "Burrabazar", "Hare Street", "Jorasanko", "Muchipara", "New Market", "Posta", "Taltala"],
  },
  {
    id: "north",
    agency: "kp",
    name: { en: "North Division", bn: "নর্থ ডিভিশন" },
    stations: ["Amherst Street", "Burtolla", "Girish Park", "Jorabagan", "Shyampukur", "Sinthee", "Ultadanga"],
  },
  {
    id: "south",
    agency: "kp",
    name: { en: "South Division", bn: "সাউথ ডিভিশন" },
    stations: ["Alipore", "Bhowanipore", "Chetla", "Kalighat", "New Alipore", "Tollygunge"],
  },
  {
    id: "south-east",
    agency: "kp",
    name: { en: "South East Division", bn: "সাউথ ইস্ট ডিভিশন" },
    stations: ["Ballygunge", "Beniapukur", "Garfa", "Karaya", "Kasba", "Park Street", "Shakespeare Sarani"],
  },
  {
    id: "south-west",
    agency: "kp",
    name: { en: "South West Division", bn: "সাউথ ওয়েস্ট ডিভিশন" },
    stations: ["Behala", "Haridevpur", "Parnasree", "Sarsuna", "Thakurpukur"],
  },
  {
    id: "east",
    agency: "kp",
    name: { en: "East Division", bn: "ইস্ট ডিভিশন" },
    stations: ["Beliaghata", "Entally", "Narkeldanga", "Phoolbagan", "Pragati Maidan", "Tangra"],
  },
  {
    id: "port",
    agency: "kp",
    name: { en: "Port Division", bn: "পোর্ট ডিভিশন" },
    stations: ["Ekbalpore", "Garden Reach", "Metiabruz", "Nadial", "North Port", "South Port", "West Port"],
  },
  {
    id: "eastern-suburban",
    agency: "kp",
    name: { en: "Eastern Suburban Division", bn: "ইস্টার্ন সাবার্বান ডিভিশন" },
    stations: ["Anandapur", "Jadavpur", "Kasba (New)", "Patuli", "Purba Jadavpur", "Survey Park", "Tiljala"],
  },
];

/** Neighbouring West Bengal Police commissionerates and districts. */
export const WBP_DIVISIONS: Division[] = [
  {
    id: "bidhannagar",
    agency: "wbp",
    name: { en: "Bidhannagar Commissionerate", bn: "বিধাননগর কমিশনারেট" },
    stations: ["Bidhannagar North", "Bidhannagar South", "Electronics Complex", "New Town", "Baguiati", "Lake Town"],
  },
  {
    id: "howrah",
    agency: "wbp",
    name: { en: "Howrah Commissionerate", bn: "হাওড়া কমিশনারেট" },
    stations: ["Howrah", "Bantra", "Golabari", "Shibpur", "Malipanchghara", "Dasnagar"],
  },
  {
    id: "barrackpore",
    agency: "wbp",
    name: { en: "Barrackpore Commissionerate", bn: "ব্যারাকপুর কমিশনারেট" },
    stations: ["Barrackpore", "Titagarh", "Khardah", "Belghoria", "Naihati", "Jagaddal"],
  },
  {
    id: "diamond-harbour",
    agency: "wbp",
    name: { en: "Diamond Harbour District", bn: "ডায়মন্ড হারবার জেলা" },
    stations: ["Diamond Harbour", "Falta", "Usthi", "Maheshtala", "Budge Budge"],
  },
];

export const ALL_DIVISIONS = [...KP_DIVISIONS, ...WBP_DIVISIONS];

export interface Court {
  id: string;
  name: { en: string; bn: string };
  type: "high" | "sessions" | "magistrate" | "special";
  location: string;
}

export const COURTS: Court[] = [
  { id: "hc", name: { en: "Calcutta High Court", bn: "কলকাতা হাইকোর্ট" }, type: "high", location: "Esplanade" },
  { id: "city-sessions", name: { en: "City Sessions Court", bn: "সিটি সেশনস কোর্ট" }, type: "sessions", location: "Bankshall Street" },
  { id: "bankshall", name: { en: "Bankshall Court", bn: "ব্যাঙ্কশাল কোর্ট" }, type: "magistrate", location: "Bankshall Street" },
  { id: "alipore-judges", name: { en: "Alipore Judges Court", bn: "আলিপুর জজ কোর্ট" }, type: "sessions", location: "Alipore" },
  { id: "alipore-cjm", name: { en: "Alipore CJM Court", bn: "আলিপুর সিজেএম কোর্ট" }, type: "magistrate", location: "Alipore" },
  { id: "sealdah", name: { en: "Sealdah Court", bn: "শিয়ালদহ কোর্ট" }, type: "magistrate", location: "Sealdah" },
  { id: "barasat", name: { en: "Barasat District Court", bn: "বারাসাত জেলা আদালত" }, type: "sessions", location: "Barasat" },
  { id: "howrah-court", name: { en: "Howrah District Court", bn: "হাওড়া জেলা আদালত" }, type: "sessions", location: "Howrah" },
  { id: "pocso", name: { en: "Special POCSO Court", bn: "বিশেষ পকসো আদালত" }, type: "special", location: "Alipore" },
  { id: "cyber-court", name: { en: "Special Court (Cyber)", bn: "বিশেষ আদালত (সাইবার)" }, type: "special", location: "Bidhannagar" },
];

// Penal and procedural sections are no longer listed here: the full statute
// library (BNS, BNSS, BSA, IPC and special Acts) is served by /api/v1/legal.

/** Kolkata landmarks used for map centring and mock incident locations. */
export const KOLKATA_CENTER = { lat: 22.5726, lng: 88.3639 };

export const KOLKATA_LANDMARKS = [
  { name: { en: "Lalbazar HQ", bn: "লালবাজার সদর" }, lat: 22.5697, lng: 88.3506 },
  { name: { en: "Esplanade", bn: "এসপ্ল্যানেড" }, lat: 22.5646, lng: 88.3512 },
  { name: { en: "Park Street", bn: "পার্ক স্ট্রিট" }, lat: 22.5525, lng: 88.3529 },
  { name: { en: "Sealdah Station", bn: "শিয়ালদহ স্টেশন" }, lat: 22.5674, lng: 88.3702 },
  { name: { en: "Howrah Bridge", bn: "হাওড়া সেতু" }, lat: 22.5851, lng: 88.3468 },
  { name: { en: "Salt Lake Sector V", bn: "সল্টলেক সেক্টর ফাইভ" }, lat: 22.5758, lng: 88.4337 },
  { name: { en: "Gariahat", bn: "গড়িয়াহাট" }, lat: 22.5183, lng: 88.3660 },
  { name: { en: "Behala Chowrasta", bn: "বেহালা চৌরাস্তা" }, lat: 22.4989, lng: 88.3103 },
  { name: { en: "Maidan", bn: "ময়দান" }, lat: 22.5535, lng: 88.3450 },
  { name: { en: "New Town", bn: "নিউ টাউন" }, lat: 22.5800, lng: 88.4600 },
  { name: { en: "Jadavpur", bn: "যাদবপুর" }, lat: 22.4996, lng: 88.3712 },
  { name: { en: "EM Bypass, Ruby", bn: "ইএম বাইপাস, রুবি" }, lat: 22.5147, lng: 88.4017 },
];

/** Vehicle registration prefixes seen across the Kolkata metropolitan area. */
export const WB_RTO_PREFIXES = ["WB-01", "WB-02", "WB-03", "WB-04", "WB-06", "WB-07", "WB-08", "WB-19", "WB-20", "WB-23", "WB-24", "WB-26"];

export const OFFICER_RANKS = [
  { code: "CONSTABLE", en: "Constable", bn: "কনস্টেবল" },
  { code: "HEAD_CONSTABLE", en: "Head Constable", bn: "হেড কনস্টেবল" },
  { code: "ASI", en: "Assistant Sub-Inspector", bn: "সহকারী সাব-ইন্সপেক্টর" },
  { code: "SI", en: "Sub-Inspector", bn: "সাব-ইন্সপেক্টর" },
  { code: "INSPECTOR", en: "Inspector", bn: "ইন্সপেক্টর" },
  { code: "SHO", en: "Officer-in-Charge", bn: "ভারপ্রাপ্ত আধিকারিক" },
  { code: "DSP", en: "Assistant Commissioner", bn: "সহকারী কমিশনার" },
  { code: "SP", en: "Deputy Commissioner", bn: "ডেপুটি কমিশনার" },
  { code: "DIG", en: "Joint Commissioner", bn: "যুগ্ম কমিশনার" },
  { code: "IG", en: "Additional Commissioner", bn: "অতিরিক্ত কমিশনার" },
  { code: "DGP", en: "Commissioner of Police", bn: "পুলিশ কমিশনার" },
] as const;

export function rankLabel(code: string) {
  return OFFICER_RANKS.find((r) => r.code === code) ?? { code, en: code, bn: code };
}

/** Representative officer names for mock data — Bengali names, both scripts. */
export const SAMPLE_OFFICERS = [
  { en: "Arindam Chatterjee", bn: "অরিন্দম চ্যাটার্জি", rank: "INSPECTOR", badge: "KP-INS-2417" },
  { en: "Sutapa Mukherjee", bn: "সুতপা মুখার্জি", rank: "SI", badge: "KP-SI-5182" },
  { en: "Debashis Roy", bn: "দেবাশিস রায়", rank: "SHO", badge: "KP-OC-1109" },
  { en: "Rituparna Ghosh", bn: "ঋতুপর্ণা ঘোষ", rank: "ASI", badge: "KP-ASI-7734" },
  { en: "Anirban Das", bn: "অনির্বাণ দাস", rank: "INSPECTOR", badge: "KP-INS-3056" },
  { en: "Moumita Sen", bn: "মৌমিতা সেন", rank: "SI", badge: "KP-SI-6421" },
  { en: "Subhankar Pal", bn: "শুভঙ্কর পাল", rank: "DSP", badge: "KP-AC-0412" },
  { en: "Paromita Banerjee", bn: "পারমিতা ব্যানার্জি", rank: "SP", badge: "KP-DC-0187" },
];

export const SAMPLE_CITIZENS = [
  { en: "Bikash Haldar", bn: "বিকাশ হালদার" },
  { en: "Sharmila Dutta", bn: "শর্মিলা দত্ত" },
  { en: "Tanmoy Bhattacharya", bn: "তন্ময় ভট্টাচার্য" },
  { en: "Nabanita Saha", bn: "নবনীতা সাহা" },
  { en: "Pradip Kundu", bn: "প্রদীপ কুন্ডু" },
  { en: "Ishita Chowdhury", bn: "ইশিতা চৌধুরী" },
  { en: "Sanjoy Mondal", bn: "সঞ্জয় মণ্ডল" },
  { en: "Ruma Adhikari", bn: "রুমা অধিকারী" },
];
