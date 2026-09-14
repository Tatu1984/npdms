"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Users, Car, Package, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { GROUP_LABEL, GROUP_ORDER, MODULES } from "@/lib/platform/modules";
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
 * ⌘K palette. Every entry navigates — module jumps plus the quick-create
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
  const { t } = useI18n();

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
    router.push(href);
  };

  const quickCreate = [
    { id: "new-fir", label: "Register FIR / GD", href: "/fir/new", icon: FileText },
    { id: "new-case", label: "Open case file", href: "/cases/new", icon: Package },
    { id: "new-evidence", label: "Register evidence", href: "/custody?register=1", icon: Package },
    { id: "new-person", label: "Add person of interest", href: "/personnel/new", icon: Users },
    { id: "new-vehicle", label: "Add vehicle", href: "/vehicles/new", icon: Car },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("common.searchPlaceholder")} />
      <CommandList>
        <CommandEmpty>{t("common.noData")}</CommandEmpty>

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
          const items = MODULES.filter((m) => m.group === group);
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
