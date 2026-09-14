"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, ShieldHalf } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { GROUP_LABEL, GROUP_ORDER, MODULES, type PlatformModule } from "@/lib/platform/modules";
import { useAuthStore, hasMinimumRole } from "@/stores/authStore";
import { PhaseBadge } from "@/components/platform/primitives";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Role } from "@/types";

const COLLAPSE_KEY = "kpdip.sidebar.collapsed";

export function PlatformSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* storage blocked — expanded is the safe default */
    }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* not fatal */
      }
      return next;
    });
  };

  const visible = React.useMemo(
    () =>
      MODULES.filter(
        (m) => !m.minRole || (user && hasMinimumRole(user.role as Role, m.minRole as Role)),
      ),
    [user],
  );

  const isActive = (m: PlatformModule) =>
    pathname === m.href || pathname.startsWith(`${m.href}/`);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200",
        collapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]",
      )}
    >
      {/* Wordmark */}
      <div className="flex h-[var(--header-height)] shrink-0 items-center gap-2.5 border-b border-border px-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white"
          style={{ background: "var(--brand)" }}
        >
          <ShieldHalf className="h-4.5 w-4.5" />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {t("agency.kp")}
            </p>
            <p className="truncate text-[0.7rem] leading-tight text-foreground-subtle">
              Digital Intelligence Platform
            </p>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-4 px-2 py-3" aria-label="Modules">
          {GROUP_ORDER.map((group) => {
            const items = visible.filter((m) => m.group === group);
            if (items.length === 0) return null;

            return (
              <div key={group} className="flex flex-col gap-0.5">
                {!collapsed && (
                  <p className="px-2 pb-1 text-[0.65rem] font-semibold uppercase tracking-wider text-foreground-subtle">
                    {t(GROUP_LABEL[group])}
                  </p>
                )}
                {collapsed && <div className="mx-2 mb-1 h-px bg-border" />}

                {items.map((m) => {
                  const active = isActive(m);
                  const Icon = m.icon;

                  const link = (
                    <Link
                      key={m.id}
                      href={m.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                        collapsed && "justify-center px-0",
                        active
                          ? "bg-accent-subtle font-medium text-accent"
                          : "text-foreground-muted hover:bg-surface-hover hover:text-foreground",
                      )}
                    >
                      {active && (
                        <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-accent" />
                      )}
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="min-w-0 flex-1 truncate">{t(m.nameKey)}</span>
                          {m.phase !== undefined && <PhaseBadge phase={m.phase} />}
                        </>
                      )}
                    </Link>
                  );

                  return collapsed ? (
                    <Tooltip key={m.id}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="font-medium">{t(m.nameKey)}</p>
                        {m.phase !== undefined && (
                          <p className="text-foreground-muted">Phase {m.phase}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    link
                  );
                })}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      <button
        type="button"
        onClick={toggle}
        className="flex h-10 shrink-0 items-center justify-center gap-2 border-t border-border text-xs text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        {!collapsed && <span>{t("nav.collapse")}</span>}
      </button>
    </aside>
  );
}
