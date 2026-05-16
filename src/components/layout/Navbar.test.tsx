/* eslint-disable @next/next/no-img-element */

/* eslint-disable @next/next/no-img-element */

import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Navbar } from "./Navbar";

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

vi.mock("next/image", () => ({
  default: function MockImage({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
  } & React.ImgHTMLAttributes<HTMLImageElement>) {
    return <img src={src} alt={alt} {...props} />;
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
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
  signOut: vi.fn(),
}));

describe("Navbar", () => {
  it("shows Profile immediately when session exists", async () => {
    const { useSession } = await import("next-auth/react");
    const useSessionMock = vi.mocked(useSession);
    useSessionMock.mockReturnValue({ data: { user: { email: "a@b.com" }, expires: "2099-01-01T00:00:00Z" }, status: "authenticated", update: vi.fn() });
    
    render(<Navbar />);
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("shows Sign In when session is null", async () => {
    const { useSession } = await import("next-auth/react");
    const useSessionMock = vi.mocked(useSession);
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated", update: vi.fn() });
    
    render(<Navbar />);
    expect(screen.getAllByText("Sign In").length).toBeGreaterThan(0);
  });
});
