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
    (Tag: keyof JSX.IntrinsicElements) =>
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
      return React.createElement(Tag, props, children);
    };

  return {
    motion: new Proxy(
      {},
      {
        get: () => passthrough("div"),
      }
    ),
  };
});

vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  }),
}));

describe("Navbar", () => {
  it("shows Profile immediately when initialUser exists", () => {
    const initialUser = { id: "u1", email: "a@b.com" } as unknown as User;
    render(<Navbar initialUser={initialUser} />);
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("shows Sign In when initialUser is null", () => {
    render(<Navbar initialUser={null} />);
    expect(screen.getAllByText("Sign In").length).toBeGreaterThan(0);
  });

  it("updates from Sign In to Profile when initialUser changes", () => {
    const initialUser = { id: "u1", email: "a@b.com" } as unknown as User;
    const view = render(<Navbar initialUser={null} />);

    expect(screen.getAllByText("Sign In").length).toBeGreaterThan(0);

    view.rerender(<Navbar initialUser={initialUser} />);

    expect(screen.getByText("Profile")).toBeInTheDocument();
  });
});
