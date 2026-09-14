"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { ActionMenu, type Action } from "./actions";
import { EmptyState } from "./primitives";

export interface Column<T> {
  id: string;
  header: string;
  /** Cell renderer. Keep it presentational — row clicks are handled by the table. */
  cell: (row: T) => React.ReactNode;
  /** Value used for sorting and, unless `searchValue` is given, the built-in search filter. */
  sortValue?: (row: T) => string | number;
  /** Text the built-in search matches, when it should cover more than the sort value. */
  searchValue?: (row: T) => string;
  className?: string;
  headerClassName?: string;
  align?: "left" | "right" | "center";
  hideBelow?: "sm" | "md" | "lg";
}

/**
 * Record table.
 *
 * `rowHref` or `onRowSelect` is required — a table row always leads to a
 * detail surface, so a list can never be a dead end. `rowActions` supplies the
 * kebab menu, whose entries are themselves links or handlers by construction.
 */
type RowNavigation<T> =
  | { rowHref: (row: T) => string; onRowSelect?: never }
  | { onRowSelect: (row: T) => void; rowHref?: never };

export type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  rowActions?: (row: T) => Action[];
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  /** Rendered between the search box and the table (filter chips, tabs). */
  toolbar?: React.ReactNode;
  dense?: boolean;
} & RowNavigation<T>;

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  rowActions,
  rowHref,
  onRowSelect,
  searchable = true,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  className,
  toolbar,
  dense,
}: DataTableProps<T>) {
  const router = useRouter();
  const { t } = useI18n();
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<{ id: string; dir: "asc" | "desc" } | null>(null);

  const visible = React.useMemo(() => {
    let out = rows;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      out = out.filter((row) =>
        columns.some((col) => {
          const value = col.searchValue?.(row) ?? col.sortValue?.(row);
          return value !== undefined && String(value).toLowerCase().includes(q);
        }),
      );
    }

    if (sort) {
      const col = columns.find((c) => c.id === sort.id);
      if (col?.sortValue) {
        out = [...out].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          const cmp =
            typeof av === "number" && typeof bv === "number"
              ? av - bv
              : String(av).localeCompare(String(bv));
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }

    return out;
  }, [rows, columns, query, sort]);

  const open = (row: T) => {
    if (rowHref) router.push(rowHref(row));
    else onRowSelect?.(row);
  };

  const hideClass = {
    sm: "hidden sm:table-cell",
    md: "hidden md:table-cell",
    lg: "hidden lg:table-cell",
  } as const;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {(searchable || toolbar) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
              <Input
                value={query}
                onChange={(v: string) => setQuery(v)}
                placeholder={searchPlaceholder ?? t("common.search")}
                className="pl-9"
                aria-label={t("common.search")}
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          title={emptyTitle ?? t("common.noData")}
          description={emptyDescription}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[42rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-sunken">
                {columns.map((col) => (
                  <th
                    key={col.id}
                    scope="col"
                    className={cn(
                      "px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-foreground-subtle",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                      col.hideBelow && hideClass[col.hideBelow],
                      col.headerClassName,
                    )}
                  >
                    {col.sortValue ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSort((prev) =>
                            prev?.id === col.id
                              ? { id: col.id, dir: prev.dir === "asc" ? "desc" : "asc" }
                              : { id: col.id, dir: "asc" },
                          )
                        }
                        className={cn(
                          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                          sort?.id === col.id && "text-foreground",
                        )}
                      >
                        {col.header}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
                {rowActions && <th scope="col" className="w-12 px-3 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => open(row)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      open(row);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none"
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        dense ? "px-3 py-2" : "px-3 py-3",
                        "align-middle text-foreground",
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        col.hideBelow && hideClass[col.hideBelow],
                        col.className,
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-3 py-2 text-right" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <ActionMenu actions={rowActions(row)} size="sm" />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {visible.length > 0 && (
        <p className="text-xs text-foreground-subtle">
          {t("common.showing")} {visible.length} {t("common.of")} {rows.length} {t("common.results")}
        </p>
      )}
    </div>
  );
}
