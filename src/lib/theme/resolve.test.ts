import { describe, expect, it } from "vitest";
import { resolveThemeFromSystem } from "./resolve";

describe("resolveThemeFromSystem", () => {
  it("maps light to warm", () => {
    expect(resolveThemeFromSystem("light")).toBe("warm");
  });

  it("maps dark to matte", () => {
    expect(resolveThemeFromSystem("dark")).toBe("matte");
  });
});

