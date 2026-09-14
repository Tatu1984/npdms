"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** Words fade and un-blur in sequence. For page and empty-state headings. */
export function BlurText({
  text,
  className,
  delay = 0.04,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: React.ElementType;
}) {
  const words = text.split(" ");
  return (
    <Tag className={cn("inline-block", className)}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block"
          initial={{ opacity: 0, filter: "blur(6px)", y: 6 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={{ duration: 0.4, delay: i * delay, ease: "easeOut" }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </Tag>
  );
}
