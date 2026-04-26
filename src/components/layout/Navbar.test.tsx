import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Navbar } from "./Navbar";
import type { User } from "@supabase/supabase-js";

afterEach(() => cleanup());

vi.mock("next/link", () => ({
  default: function MockLink({
    href,
    children,
    prefetch: _prefetch,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    prefetch?: boolean;
  }) {
    void _prefetch;
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("framer-motion", async () => {
  const React = await import("react");
  const passthrough =
    (tag: string) =>
    function MotionComponent({
      children,
      layoutId: _layoutId,
      layout: _layout,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      whileHover: _whileHover,
      whileTap: _whileTap,
      ...props
    }: Record<string, unknown> & { children?: React.ReactNode }) {
      void _layoutId;
      void _layout;
      void _initial;
      void _animate;
      void _exit;
      void _transition;
      void _whileHover;
      void _whileTap;
      return React.createElement(tag, props, children);
    };

  return {
    motion: new Proxy(
      {},
      {
        get: () => passthrough("div"),
      }
    ),
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, {}, children),
  };
});

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
  signOut: vi.fn(),
}));

describe("Navbar", () => {
  it("shows Profile immediately when session exists", async () => {
    const useSessionMock = await import("next-auth/react").then(m => m.useSession as any);
    useSessionMock.mockReturnValue({ data: { user: { email: "a@b.com" } }, status: "authenticated" });
    
    render(<Navbar />);
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("shows Sign In when session is null", async () => {
    const useSessionMock = await import("next-auth/react").then(m => m.useSession as any);
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });
    
    render(<Navbar />);
    expect(screen.getAllByText("Sign In").length).toBeGreaterThan(0);
  });
});
