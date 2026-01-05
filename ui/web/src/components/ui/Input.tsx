"use client";

import { forwardRef, InputHTMLAttributes, ReactNode, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string | boolean;
  hint?: string;
  icon?: ReactNode;
  onChange?: ((value: string) => void) | ((e: ChangeEvent<HTMLInputElement>) => void);
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, icon, onChange, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const hasError = typeof error === 'string' ? !!error : error;
    const errorMessage = typeof error === 'string' ? error : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
              {icon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              "flex h-10 w-full rounded-md border border-border bg-background-secondary px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
              hasError && "border-error focus:ring-error",
              icon && "pl-10",
              className
            )}
            ref={ref}
            onChange={(e) => {
              if (onChange) {
                // Check if it's a value handler (function with 1 param expecting string)
                // by trying to call with just the value
                (onChange as (value: string) => void)(e.target.value);
              }
            }}
            {...props}
          />
        </div>
        {errorMessage && (
          <p className="mt-1.5 text-sm text-error">{errorMessage}</p>
        )}
        {hint && !hasError && (
          <p className="mt-1.5 text-sm text-foreground-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
