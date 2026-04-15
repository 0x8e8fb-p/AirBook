import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeFab } from "./ThemeFab";

vi.mock("./useThemeController", () => ({
  useThemeController: () => ({
    mode: "manual",
    theme: "warm",
    phase: "idle",
    origin: { x: 0, y: 0 },
    toTheme: "warm",
    radius: 0,
    setManualTheme: vi.fn(),
    setSystemMode: vi.fn(),
  }),
}));

vi.mock("./ThemeTransitionOverlay", () => ({
  ThemeTransitionOverlay: () => null,
}));

describe("ThemeFab", () => {
  it("opens the picker on tap", () => {
    render(<ThemeFab />);
    fireEvent.click(screen.getByRole("button", { name: "Theme" }));
    expect(screen.getByText("Warm white")).toBeInTheDocument();
  });
});
