"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Bell,
  Check,
  Landmark,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useI18n, LOCALES } from "@/lib/i18n";
import { useAuthStore, getRoleDisplayName } from "@/stores/authStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusPill } from "@/components/platform/primitives";
import { ForceStatement, useForce } from "@/components/platform/force";
import { CommandPalette } from "./CommandPalette";

export function PlatformTopbar() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const { user, syncState, logout } = useAuthStore();
  const { label: forceLabel } = useForce();
  const forceFull = forceLabel.full;
  const forceParent = forceLabel.parent;

  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // next-themes resolves on the client; avoid a theme-icon hydration mismatch
  React.useEffect(() => setMounted(true), []);

  const online = syncState?.status !== "OFFLINE";

  const signOut = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center gap-2 border-b border-border bg-surface/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        {/* Search opens the palette — the single entry point for navigation */}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="group flex h-9 min-w-0 flex-1 max-w-md items-center gap-2 rounded-md border border-border bg-surface-sunken px-3 text-sm text-foreground-subtle transition-colors hover:border-border-strong hover:text-foreground-muted"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">{t("common.searchPlaceholder")}</span>
          <kbd className="ml-auto hidden shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[0.65rem] text-foreground-subtle sm:inline">
            ⌘K
          </kbd>
        </button>

        <div className="ml-auto flex items-center gap-1">
          {/* Which department, and where posted. Both read from the session,
              neither chosen: an officer sees their own force's records, and a
              switcher here would imply they could see another's. A wing is
              shown with its parent, so a CID officer can tell at a glance. */}
          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="hidden items-center gap-2 md:flex">
                  <ForceStatement />
                  {user.stationName && (
                    <span className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground-muted">
                      <Landmark
                        className="h-3.5 w-3.5 shrink-0 text-foreground-subtle"
                        aria-hidden
                      />
                      <span className="max-w-[12rem] truncate font-medium text-foreground">
                        {user.stationName}
                      </span>
                      {user.districtName && (
                        <>
                          <span className="text-foreground-subtle">·</span>
                          <span className="max-w-[8rem] truncate">{user.districtName}</span>
                        </>
                      )}
                    </span>
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{forceFull}</p>
                {forceParent && <p className="text-foreground-muted">{forceParent}</p>}
                <p className="text-foreground-muted">{t("force.postedNote")}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Connectivity — this is an offline-first field tool */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="hidden sm:block">
                <StatusPill tone={online ? "success" : "warning"}>
                  {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {online ? "Online" : "Offline"}
                </StatusPill>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {online
                ? "Connected — records sync as you work"
                : "Working offline — records queue and sync when a connection returns"}
            </TooltipContent>
          </Tooltip>

          {/* Language */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex h-8 items-center rounded-md px-2 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              aria-label={t("settings.language")}
            >
              {locale === "bn" ? "বাংলা" : "EN"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("settings.language")}</DropdownMenuLabel>
              {LOCALES.map((l) => (
                <DropdownMenuItem key={l.code} onSelect={() => setLocale(l.code)}>
                  <span className="flex-1">{l.nativeLabel}</span>
                  {locale === l.code && <Check className="h-3.5 w-3.5 text-accent" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                aria-label={t("settings.theme")}
              >
                {mounted && theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>{t("settings.theme")}</TooltipContent>
          </Tooltip>

          {/* Alerts */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => router.push("/alerts")}
                className="relative flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                aria-label="Alerts"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Alerts &amp; broadcasts</TooltipContent>
          </Tooltip>

          {/* User */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-surface-hover">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ background: "var(--brand)" }}
              >
                {(user?.name ?? "O").slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block max-w-[9rem] truncate text-xs font-medium text-foreground">
                  {user?.name ?? "Officer"}
                </span>
                <span className="block text-[0.65rem] text-foreground-subtle">
                  {user ? getRoleDisplayName(user.role) : "—"}
                </span>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <span className="block text-sm font-medium normal-case text-foreground">
                  {user?.name ?? "Officer"}
                </span>
                <span className="block font-mono text-[0.7rem] normal-case text-foreground-subtle">
                  {user?.badgeNumber ?? "—"}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push("/profile")}>
                <User className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push("/settings")}>
                <Settings className="h-4 w-4" />
                {t("modules.settings")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={signOut} className="text-danger focus:text-danger">
                <LogOut className="h-4 w-4" />
                {t("auth.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
