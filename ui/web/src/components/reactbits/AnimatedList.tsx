"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** Staggered list reveal. Wrap rows that arrive together (alerts, events). */
export function AnimatedList({
  children,
  className,
  stagger = 0.05,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedListItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
      }}
    >
      {children}
    </motion.div>
  );
}
