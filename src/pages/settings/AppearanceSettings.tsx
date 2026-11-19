import { Check, type LucideIcon, Monitor, Moon, Sun } from "lucide-react";
import { Dual, Stacked } from "../../components/Text";
import type { StringKey } from "../../i18n/strings";
import { type ThemeChoice, useThemeChoice } from "../../lib/theme";
import { SettingsCard } from "./SettingsLayout";

const OPTIONS: { id: ThemeChoice; icon: LucideIcon; label: StringKey; hint: StringKey }[] = [
  { id: "light", icon: Sun, label: "themeLight", hint: "themeLightHint" },
  { id: "dark", icon: Moon, label: "themeDark", hint: "themeDarkHint" },
  { id: "system", icon: Monitor, label: "themeSystem", hint: "themeSystemHint" },
];

/** A tiny picture of each theme, drawn with fixed colors so it looks the same whichever is on. */
function Preview({ id }: { id: ThemeChoice }) {
  const light = (
    <span className="flex h-full flex-1 flex-col gap-1 bg-[#f6f7f9] p-1.5">
      <span className="h-1.5 w-2/3 rounded-full bg-[#14532d]" />
      <span className="flex-1 rounded bg-white ring-1 ring-[#e2e6ee]" />
    </span>
  );
  const dark = (
    <span className="flex h-full flex-1 flex-col gap-1 bg-[#0e131a] p-1.5">
      <span className="h-1.5 w-2/3 rounded-full bg-[#5ccb8c]" />
      <span className="flex-1 rounded bg-[#171e28] ring-1 ring-[#2c3644]" />
    </span>
  );
  return (
    <span aria-hidden="true" className="flex h-16 w-full overflow-hidden rounded-lg ring-1 ring-line">
      {id === "dark" ? dark : light}
      {id === "system" && dark}
    </span>
  );
}

/** Light, dark, or following the device. Saved on this device and applied straight away. */
export function AppearanceSettings() {
  const [choice, setChoice] = useThemeChoice();

  return (
    <SettingsCard title="appearance" intro="appearanceIntro">
      <fieldset>
        <legend className="sr-only">
          <Dual k="appearance" />
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {OPTIONS.map(({ id, icon: Icon, label, hint }) => (
            <label
              key={id}
              className="relative flex cursor-pointer flex-col gap-3 rounded-xl p-3 ring-1 ring-line transition hover:ring-primary/40 has-checked:bg-primary-soft has-checked:ring-2 has-checked:ring-primary has-focus-visible:outline-3 has-focus-visible:outline-secondary"
            >
              <input
                type="radio"
                name="theme"
                value={id}
                checked={choice === id}
                onChange={() => setChoice(id)}
                className="sr-only"
              />
              <Preview id={id} />
              <span className="flex items-start gap-2 text-sm">
                <Icon className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">
                    <Dual k={label} />
                  </span>
                  <Stacked k={hint} className="mt-0.5 block text-xs text-muted" />
                </span>
                {choice === id && <Check className="size-4.5 shrink-0 text-primary" aria-hidden="true" />}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <Stacked k="themeDeviceOnly" className="mt-4 block text-xs text-muted" />
    </SettingsCard>
  );
}
