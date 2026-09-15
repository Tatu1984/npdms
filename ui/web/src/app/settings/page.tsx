"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { KeyRound, MapPinned, Scale, ScanFace, Settings } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader, Panel } from "@/components/platform/primitives";
import { Button } from "@/components/ui/button";
import { useI18n, LOCALES } from "@/lib/i18n";

const L = {
  title: { en: "Settings", bn: "সেটিংস" },
  description: {
    en: "Display preferences for this browser. Account details and your password are on your profile.",
    bn: "এই ব্রাউজারের প্রদর্শন পছন্দ। অ্যাকাউন্টের তথ্য ও পাসওয়ার্ড আপনার প্রোফাইলে।",
  },
  language: { en: "Language", bn: "ভাষা" },
  languageHint: { en: "Screens switch immediately; records are shown as they were entered.", bn: "স্ক্রিন সঙ্গে সঙ্গে বদলায়; নথি যেভাবে লেখা হয়েছিল সেভাবেই দেখায়।" },
  theme: { en: "Appearance", bn: "চেহারা" },
  light: { en: "Light", bn: "উজ্জ্বল" },
  dark: { en: "Dark", bn: "অন্ধকার" },
  system: { en: "Follow the device", bn: "ডিভাইস অনুযায়ী" },
  account: { en: "Account and password", bn: "অ্যাকাউন্ট ও পাসওয়ার্ড" },
  accountHint: { en: "View your account and change your password.", bn: "আপনার অ্যাকাউন্ট দেখুন ও পাসওয়ার্ড বদলান।" },
  openProfile: { en: "Open my profile", bn: "আমার প্রোফাইল খুলুন" },
};

export default function SettingsPage() {
  const { pick, locale, setLocale, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const choice = (active: boolean) => (active ? "default" : "secondary") as "default" | "secondary";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title={pick(L.title)} description={pick(L.description)} icon={Settings} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel title={pick(L.language)} description={pick(L.languageHint)}>
            <div className="flex flex-wrap gap-2">
              {LOCALES.map((l) => (
                <Button key={l.code} variant={choice(locale === l.code)} onClick={() => setLocale(l.code)}>
                  {l.nativeLabel}
                </Button>
              ))}
            </div>
          </Panel>
          <Panel title={pick(L.theme)}>
            <div className="flex flex-wrap gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <Button key={t} variant={choice(mounted && theme === t)} onClick={() => setTheme(t)}>
                  {pick(L[t])}
                </Button>
              ))}
            </div>
          </Panel>
          <Panel title={pick(L.account)} description={pick(L.accountHint)}>
            <Link href="/profile">
              <Button variant="secondary">
                <KeyRound className="mr-2 h-4 w-4" />
                {pick(L.openProfile)}
              </Button>
            </Link>
          </Panel>
          <Panel title={t("faceRecognitionScreen.settings.cardTitle")} description={t("faceRecognitionScreen.settings.cardBody")}>
            <Link href="/settings/face-recognition">
              <Button variant="secondary">
                <ScanFace className="mr-2 h-4 w-4" />
                {t("faceRecognitionScreen.settings.cardOpen")}
              </Button>
            </Link>
          </Panel>
          <Panel title={t("legalScreen.settings.cardTitle")} description={t("legalScreen.settings.cardBody")}>
            <Link href="/settings/legal">
              <Button variant="secondary">
                <Scale className="mr-2 h-4 w-4" />
                {t("legalScreen.settings.cardOpen")}
              </Button>
            </Link>
          </Panel>
          <Panel title={t("legalScreen.settings.placesCardTitle")} description={t("legalScreen.settings.placesCardBody")}>
            <Link href="/settings/places">
              <Button variant="secondary">
                <MapPinned className="mr-2 h-4 w-4" />
                {t("legalScreen.settings.placesCardOpen")}
              </Button>
            </Link>
          </Panel>
        </div>
      </div>
    </DashboardLayout>
  );
}
