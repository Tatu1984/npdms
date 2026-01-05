"use client";

import { forwardRef, SelectHTMLAttributes, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string | boolean;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange?: ((value: string) => void) | ((e: ChangeEvent<HTMLSelectElement>) => void);
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, onChange, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const hasError = typeof error === 'string' ? !!error : error;
    const errorMessage = typeof error === 'string' ? error : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          className={cn(
            "flex h-10 w-full rounded-md border border-border bg-background-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors appearance-none cursor-pointer",
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
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {errorMessage && <p className="mt-1.5 text-sm text-error">{errorMessage}</p>}
        {hint && !hasError && (
          <p className="mt-1.5 text-sm text-foreground-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
