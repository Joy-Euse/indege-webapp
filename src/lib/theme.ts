import { useSyncExternalStore } from "react";

/** "system" follows the device's light or dark setting, and changes when it does. */
export type ThemeChoice = "light" | "dark" | "system";
export type Theme = "light" | "dark";

export const THEME_CHOICES: readonly ThemeChoice[] = ["light", "dark", "system"];

/** Also read by the script in index.html, which applies the theme before the first paint. */
export const THEME_STORAGE_KEY = "indege-theme";

/** The browser bar color for each theme. Matches --color-brand and the dark --color-surface. */
const BAR_COLORS: Record<Theme, string> = { light: "#14532D", dark: "#0E131A" };

const darkQuery = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null);

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return typeof value === "string" && (THEME_CHOICES as readonly string[]).includes(value);
}

/** Kept on this device only. Storage can be blocked, so anything unreadable means "system". */
export function readThemeChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeChoice(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(choice: ThemeChoice, deviceIsDark: boolean): Theme {
  if (choice === "system") return deviceIsDark ? "dark" : "light";
  return choice;
}

export function applyTheme(choice: ThemeChoice = readThemeChoice()): void {
  const theme = resolveTheme(choice, darkQuery()?.matches ?? false);
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BAR_COLORS[theme]);
}

const listeners = new Set<() => void>();
let current: ThemeChoice = typeof window === "undefined" ? "system" : readThemeChoice();

export function setThemeChoice(choice: ThemeChoice): void {
  current = choice;
  try {
    if (choice === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Still applies for this visit.
  }
  applyTheme(choice);
  listeners.forEach((listener) => listener());
}

/** Applies the saved choice, then keeps following the device and other tabs. Call once at startup. */
export function startTheme(): void {
  applyTheme(current);
  darkQuery()?.addEventListener("change", () => {
    if (current === "system") applyTheme(current);
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    current = readThemeChoice();
    applyTheme(current);
    listeners.forEach((listener) => listener());
  });
}

export function useThemeChoice(): [ThemeChoice, (choice: ThemeChoice) => void] {
  const choice = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
  return [choice, setThemeChoice];
}
