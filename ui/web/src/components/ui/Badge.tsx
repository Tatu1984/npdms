"use client";

import { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-accent/20 text-accent border border-accent/30",
        success: "bg-success/20 text-green-400 border border-success/30",
        warning: "bg-warning/20 text-yellow-400 border border-warning/30",
        error: "bg-error/20 text-red-400 border border-error/30",
        info: "bg-info/20 text-blue-400 border border-info/30",
        secondary: "bg-background-tertiary text-foreground-muted border border-border",
        // FIR Status badges
        registered: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
        investigating: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
        chargesheet: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
        closed: "bg-green-500/20 text-green-400 border border-green-500/30",
        transferred: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
        // Priority badges
        low: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
        normal: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
        high: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
        critical: "bg-red-500/20 text-red-400 border border-red-500/30",
        // Role badges
        constable: "bg-[#4A9EFF]/20 text-[#4A9EFF] border border-[#4A9EFF]/30",
        sho: "bg-[#36B37E]/20 text-[#36B37E] border border-[#36B37E]/30",
        district: "bg-[#FFAB00]/20 text-[#FFAB00] border border-[#FFAB00]/30",
        state: "bg-[#9B59B6]/20 text-[#9B59B6] border border-[#9B59B6]/30",
        central: "bg-[#E74C3C]/20 text-[#E74C3C] border border-[#E74C3C]/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
