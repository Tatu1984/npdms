import { cn } from "@/lib/utils";

/** Loading placeholder. Give it the same box as the content it stands in for. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface-sunken", className)}
      {...props}
    />
  );
}

export { Skeleton };
