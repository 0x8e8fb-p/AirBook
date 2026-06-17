"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const hasValue = props.value !== undefined && props.value !== "";

    return (
      <div className="relative w-full">
        <div
          className="relative"
          style={error ? { animation: "input-shake 380ms var(--ease-out)" } : undefined}
        >
          {icon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors duration-[var(--duration-base)] peer-focus:text-[var(--accent-primary)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              "peer w-full rounded-[var(--radius-md)] border bg-[var(--bg-subtle)] px-4 py-3 text-sm",
              "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
              "transition-[border-color,box-shadow,background-color] duration-[var(--duration-base)] ease-[var(--ease-out)]",
              "focus:outline-none",
              error
                ? "border-[color-mix(in_srgb,var(--accent-red)_55%,transparent)] focus:border-[var(--accent-red)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent-red)_16%,transparent)]"
                : "border-[var(--border-default)] focus:border-[color-mix(in_srgb,var(--accent-primary)_70%,transparent)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent-cta)_14%,transparent)]",
              icon && "pl-10",
              className,
            )}
            {...props}
          />
          <label
            htmlFor={id}
            className={cn(
              "pointer-events-none absolute left-3 transition-all duration-[var(--duration-fast)] ease-[var(--ease-out)]",
              "text-[var(--text-muted)]",
              icon && "left-10",
              focused || hasValue
                ? "-top-2.5 bg-[var(--bg-subtle)] px-1 text-[10px] font-semibold uppercase tracking-wide"
                : "top-1/2 -translate-y-1/2 text-sm",
              focused && !error && "text-[var(--accent-primary)]",
              focused && error && "text-[var(--accent-red)]",
            )}
          >
            {label}
          </label>
        </div>
        {error && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--accent-red)]">
            <span
              aria-hidden="true"
              className="inline-block h-1 w-1 rounded-full bg-[var(--accent-red)]"
            />
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

