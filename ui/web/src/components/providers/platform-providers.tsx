"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";

/**
 * Client-side platform context: theme (light default, dark for ops),
 * language (English / বাংলা) and tooltip timing.
 */
export function PlatformProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <I18nProvider>
        <TooltipProvider delayDuration={250} skipDelayDuration={300}>
          {children}
        </TooltipProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
