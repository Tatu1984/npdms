"use client";

import { forwardRef, TextareaHTMLAttributes, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  error?: string | boolean;
  hint?: string;
  onChange?: ((value: string) => void) | ((e: ChangeEvent<HTMLTextAreaElement>) => void);
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, onChange, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const hasError = typeof error === 'string' ? !!error : error;
    const errorMessage = typeof error === 'string' ? error : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            "flex min-h-[100px] w-full rounded-md border border-border bg-background-secondary px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y",
            hasError && "border-error focus:ring-error",
            className
          )}
          ref={ref}
          onChange={(e) => {
            if (onChange) {
              (onChange as (value: string) => void)(e.target.value);
            }
          }}
          {...props}
        />
        {errorMessage && <p className="mt-1.5 text-sm text-error">{errorMessage}</p>}
        {hint && !hasError && (
          <p className="mt-1.5 text-sm text-foreground-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
