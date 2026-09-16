"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Users, Car, Package, ArrowRight, Search, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRecordSearch } from "@/hooks/use-legacy-registers";
import { SEARCH_MIN_LENGTH } from "@/lib/api/search";
import { SEARCH_KIND_LABEL, SEARCH_LABELS } from "@/app/search/labels";
import { GROUP_LABEL, GROUP_ORDER, MODULES, modulesForForce } from "@/lib/platform/modules";
import { useForce } from "@/components/platform/force";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { PhaseBadge } from "@/components/platform/primitives";

/**
 * ⌘K palette. Every entry navigates — matching records (searched on the
 * server once two characters are typed), module jumps and the quick-create
 * routes officers reach for most. Opened from the topbar search field too.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { t, pick } = useI18n();
  const { force } = useForce();
  // The palette must not offer what the navigation does not: a traffic officer
  // typing "malkhana" should find nothing rather than a screen not theirs.
  const forceModules = React.useMemo(() => modulesForForce(force.code, MODULES), [force.code]);
  const [query, setQuery] = React.useState("");
  const deferred = React.useDeferredValue(query.trim());
  const records = useRecordSearch(open ? deferred : "");
  const searching = deferred.length >= SEARCH_MIN_LENGTH;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (href: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  };

  // Each shortcut names the module it creates into, so it disappears with that
  // module: offering "Issue traffic challan" to a CID officer would be an
  // invitation to a screen that is not theirs.
  const quickCreate = [
    { id: "new-fir", module: "fir", label: "Register FIR / GD", href: "/fir/new", icon: FileText },
    { id: "new-case", module: "cases", label: "Open case file", href: "/cases/new", icon: Package },
    { id: "new-evidence", module: "custody", label: "Register evidence", href: "/custody?register=1", icon: Package },
    { id: "new-officer", module: "personnel", label: "Add officer to the roster", href: "/personnel/new", icon: Users },
    { id: "new-challan", module: "traffic-challans", label: "Issue traffic challan", href: "/traffic/challans/new", icon: Car },
  ].filter((item) => forceModules.some((m) => m.id === item.module));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("common.searchPlaceholder")} value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{t("common.noData")}</CommandEmpty>

        {searching && (
          <CommandGroup heading={pick(SEARCH_LABELS.paletteHeading)}>
            {records.isPending && (
              <CommandItem value={`${deferred} searching`} disabled>
                <Loader2 className="h-4 w-4 animate-spin text-foreground-subtle" />
                <span>{pick(SEARCH_LABELS.searching)}</span>
              </CommandItem>
            )}
            {records.data?.groups.flatMap((g) =>
              g.hits
                .filter((h) => h.href)
                .map((h) => (
                  <CommandItem
                    key={`${h.kind}-${h.id}`}
                    value={`${deferred} ${h.kind} ${h.number} ${h.title} ${h.id}`}
                    onSelect={() => go(h.href)}
                  >
                    <Search className="h-4 w-4 text-foreground-subtle" />
                    <span className="flex-1 truncate">
                      {h.number && <span className="font-mono">{h.number} </span>}
                      <span className="text-foreground-muted">{h.title}</span>
                    </span>
                    <span className="text-xs text-foreground-subtle">{pick(SEARCH_KIND_LABEL[h.kind])}</span>
                  </CommandItem>
                )),
            )}
            <CommandItem value={`${deferred} search all records`} onSelect={() => go(`/search?q=${encodeURIComponent(deferred)}`)}>
              <Search className="h-4 w-4 text-foreground-subtle" />
              <span>
                {pick(SEARCH_LABELS.paletteAll)} “{deferred}”
              </span>
              <CommandShortcut>
                <ArrowRight className="h-3 w-3" />
              </CommandShortcut>
            </CommandItem>
          </CommandGroup>
        )}

        <CommandGroup heading="Create">
          {quickCreate.map((item) => (
            <CommandItem key={item.id} value={item.label} onSelect={() => go(item.href)}>
              <item.icon className="h-4 w-4 text-foreground-subtle" />
              <span>{item.label}</span>
              <CommandShortcut>
                <ArrowRight className="h-3 w-3" />
              </CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {GROUP_ORDER.map((group) => {
          const items = forceModules.filter((m) => m.group === group);
          if (items.length === 0) return null;
          return (
            <CommandGroup key={group} heading={t(GROUP_LABEL[group])}>
              {items.map((m) => (
                <CommandItem
                  key={m.id}
                  value={`${t(m.nameKey)} ${m.id}`}
                  onSelect={() => go(m.href)}
                >
                  <m.icon className="h-4 w-4 text-foreground-subtle" />
                  <span className="flex-1">{t(m.nameKey)}</span>
                  {m.phase !== undefined && <PhaseBadge phase={m.phase} />}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
