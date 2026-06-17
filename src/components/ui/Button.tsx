"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "ghost" | "danger" | "secondary";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  // Amber CTA with gloss sweep + cinematic ring + spring scale.
  primary:
    "gloss-sweep ring-cinematic bg-[var(--accent-amber)] text-[var(--text-inverse)] " +
    "shadow-[var(--depth-soft)] hover:shadow-[var(--depth-elevated)] " +
    "hover:brightness-[1.06] active:brightness-95 active:scale-[0.97]",
  secondary:
    "ring-cinematic bg-[var(--accent-primary-dim)] text-[var(--accent-primary)] " +
    "border border-[color-mix(in_srgb,var(--accent-primary)_22%,transparent)] " +
    "hover:bg-[color-mix(in_srgb,var(--accent-primary)_18%,transparent)] " +
    "hover:border-[color-mix(in_srgb,var(--accent-primary)_32%,transparent)] " +
    "active:scale-[0.97]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] " +
    "hover:text-[var(--text-primary)] hover:bg-[var(--accent-primary-dim)] " +
    "active:scale-[0.97]",
  danger:
    "bg-[color-mix(in_srgb,var(--accent-red)_12%,transparent)] text-[var(--accent-red)] " +
    "border border-[color-mix(in_srgb,var(--accent-red)_24%,transparent)] " +
    "hover:bg-[color-mix(in_srgb,var(--accent-red)_22%,transparent)] " +
    "hover:border-[color-mix(in_srgb,var(--accent-red)_42%,transparent)] " +
    "active:scale-[0.97]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-[var(--radius-sm)] gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-[var(--radius-md)] gap-2",
  lg: "px-6 py-3.5 text-base rounded-[var(--radius-lg)] gap-2.5",
};

const baseStyles = [
  "relative inline-flex items-center justify-center font-semibold",
  "transition-[transform,background-color,box-shadow,border-color,color,opacity,filter]",
  "duration-[var(--duration-base)] ease-[var(--ease-spring)]",
  "disabled:opacity-40 disabled:pointer-events-none disabled:saturate-50",
  "select-none whitespace-nowrap",
  "will-change-transform",
].join(" ");

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        data-loading={loading || undefined}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          loading && "cursor-progress",
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="contents" aria-live="polite">
            <span
              aria-hidden="true"
              className="relative -ml-0.5 inline-block h-4 w-4"
            >
              <span className="absolute inset-0 rounded-full border-2 border-current opacity-25" />
              <span
                className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
                style={{ borderTopColor: "currentColor", borderRightColor: "currentColor" }}
              />
            </span>
            <span className="opacity-90">{children}</span>
          </span>
        ) : (
          <span className="relative inline-flex items-center gap-[inherit]">{children}</span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
