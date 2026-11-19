import { afterEach, describe, expect, it, vi } from "vitest";
import { isThemeChoice, readThemeChoice, resolveTheme, THEME_STORAGE_KEY } from "./theme";

describe("resolveTheme", () => {
  it("uses the person's choice, or the device's when they chose to follow it", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("isThemeChoice", () => {
  it("accepts only the three choices", () => {
    expect(["light", "dark", "system"].every(isThemeChoice)).toBe(true);
    expect(isThemeChoice("blue")).toBe(false);
    expect(isThemeChoice(null)).toBe(false);
  });
});

describe("readThemeChoice", () => {
  afterEach(() => vi.unstubAllGlobals());

  const storageWith = (getItem: () => string | null) => ({ getItem, setItem: () => {}, removeItem: () => {} });

  it("reads a saved choice", () => {
    vi.stubGlobal("localStorage", storageWith(() => "dark"));
    expect(readThemeChoice()).toBe("dark");
  });

  it("falls back to the device for anything unknown or unreadable", () => {
    vi.stubGlobal("localStorage", storageWith(() => "purple"));
    expect(readThemeChoice()).toBe("system");
    vi.stubGlobal(
      "localStorage",
      storageWith(() => {
        throw new Error("blocked");
      }),
    );
    expect(readThemeChoice()).toBe("system");
  });

  it("uses the key the startup script in index.html reads", () => {
    expect(THEME_STORAGE_KEY).toBe("indege-theme");
  });
});
