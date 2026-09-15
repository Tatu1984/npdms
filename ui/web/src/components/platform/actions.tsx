"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Every action on this platform must go somewhere.
 *
 * `Action` is a discriminated union: an item either navigates (`href`) or runs
 * a handler that opens a dialog/sheet (`onSelect`). There is no third shape, so
 * a menu entry that does nothing fails to type-check rather than shipping as a
 * dead button. `separator` and `label` are the only non-interactive entries.
 */
export type Action =
  | {
      kind: "link";
      id: string;
      label: string;
      href: string;
      icon?: React.ElementType;
      description?: string;
      disabled?: boolean;
      /** Set when the action is destructive so it renders in the danger colour. */
      destructive?: boolean;
    }
  | {
      kind: "action";
      id: string;
      label: string;
      onSelect: () => void;
      icon?: React.ElementType;
      description?: string;
      disabled?: boolean;
      destructive?: boolean;
    }
  | { kind: "separator"; id: string }
  | { kind: "label"; id: string; label: string };

export function isInteractive(
  action: Action,
): action is Extract<Action, { kind: "link" | "action" }> {
  return action.kind === "link" || action.kind === "action";
}

/**
 * The kebab menu used on every record row and detail header.
 * Each item resolves to a route push or a handler — nothing is inert.
 */
export function ActionMenu({
  actions,
  label = "Row actions",
  align = "end",
  triggerClassName,
  size = "default",
}: {
  actions: Action[];
  label?: string;
  align?: "start" | "center" | "end";
  triggerClassName?: string;
  size?: "default" | "sm";
}) {
  const router = useRouter();

  const interactive = actions.filter(isInteractive);
  if (interactive.length === 0) return null;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger
            aria-label={label}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "inline-flex items-center justify-center rounded-md border border-transparent text-foreground-muted transition-colors",
              "hover:border-border hover:bg-surface-hover hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "data-[state=open]:border-border data-[state=open]:bg-surface-hover data-[state=open]:text-foreground",
              size === "sm" ? "h-7 w-7" : "h-8 w-8",
              triggerClassName,
            )}
          >
            <MoreHorizontal className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align={align} className="min-w-[13rem]">
        {actions.map((action) => {
          if (action.kind === "separator") {
            return <DropdownMenuSeparator key={action.id} />;
          }
          if (action.kind === "label") {
            return <DropdownMenuLabel key={action.id}>{action.label}</DropdownMenuLabel>;
          }

          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.id}
              disabled={action.disabled}
              onSelect={() => {
                // Let the menu close before acting. Preventing the close kept
                // the modal menu mounted under any dialog the action opened,
                // and its pointer-events lock on <body> outlived the dialog —
                // the whole page stopped responding to clicks.
                if (action.kind === "link") router.push(action.href);
                else window.setTimeout(action.onSelect, 0);
              }}
              className={cn(
                "items-start",
                action.destructive && "text-danger focus:bg-danger-subtle focus:text-danger",
              )}
            >
              {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" />}
              <span className="flex flex-col gap-0.5">
                <span>{action.label}</span>
                {action.description && (
                  <span className="text-xs text-foreground-subtle">{action.description}</span>
                )}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Small helpers so screens declare actions declaratively and stay readable.
 */
export const act = {
  link: (
    id: string,
    label: string,
    href: string,
    opts: Partial<Extract<Action, { kind: "link" }>> = {},
  ): Action => ({ kind: "link", id, label, href, ...opts }),

  run: (
    id: string,
    label: string,
    onSelect: () => void,
    opts: Partial<Extract<Action, { kind: "action" }>> = {},
  ): Action => ({ kind: "action", id, label, onSelect, ...opts }),

  sep: (id: string): Action => ({ kind: "separator", id }),

  label: (id: string, label: string): Action => ({ kind: "label", id, label }),
};
