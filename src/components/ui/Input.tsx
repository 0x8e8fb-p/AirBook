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
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
            className={cn(
              "w-full bg-[var(--bg-subtle)] border rounded-[var(--radius-md)] px-4 py-3 text-sm",
              "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
              "transition-all duration-[var(--duration-base)] ease-[var(--ease-out)]",
              "focus:outline-none focus:ring-0",
              error
                ? "border-[var(--accent-red)]/50 focus:border-[var(--accent-red)]"
                : "border-[var(--border-default)] focus:border-[var(--accent-primary)]",
              icon && "pl-10",
              className
            )}
            {...props}
          />
          <label
            htmlFor={id}
            className={cn(
              "absolute left-3 transition-all duration-[var(--duration-fast)] pointer-events-none",
              "text-[var(--text-muted)]",
              icon && "left-10",
              focused || hasValue
                ? "-top-2.5 text-[10px] font-semibold tracking-wide uppercase bg-[var(--bg-subtle)] px-1"
                : "top-1/2 -translate-y-1/2 text-sm",
              focused && !error && "text-[var(--accent-primary)]",
              focused && error && "text-[var(--accent-red)]"
            )}
          >
            {label}
          </label>
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-[var(--accent-red)]">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
