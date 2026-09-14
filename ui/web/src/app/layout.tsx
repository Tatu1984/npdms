import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { PlatformProviders } from "@/components/providers/platform-providers";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Bengali is a first-class UI language here, not a fallback.
const notoBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#12395E" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F16" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Kolkata Police Digital Intelligence Platform",
    template: "%s · KP Intelligence",
  },
  description:
    "AI and evidence-intelligence platform for Kolkata Police, West Bengal Police, CID and Traffic Police — investigation, evidence custody, surveillance, dispatch and court readiness.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KP Intelligence",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${inter.variable} ${notoBengali.variable} antialiased`}>
        <ErrorBoundary>
          <QueryProvider>
            <PlatformProviders>
              {children}
            </PlatformProviders>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
