import { ShieldCheck } from "lucide-react";
import { type ReactNode, useId } from "react";
import type { StringKey } from "../i18n/strings";
import { CATEGORY_ICONS } from "./JobParts";
import { Logo, LogoMark } from "./Logo";
import { Dual, Stacked } from "./Text";

/**
 * Green Imigongo-style panel, standing in for the Kigali photo in the design.
 * To use the photo: add it at public/kigali.jpg and set it as this panel's background image.
 */
function HeroPanel({ className = "", children }: { className?: string; children?: ReactNode }) {
  const patternId = `imigongo${useId().replace(/:/g, "")}`;
  return (
    <div className={`relative overflow-hidden bg-brand text-white ${className}`}>
      <svg className="absolute inset-0 text-white/10" width="100%" height="100%" aria-hidden="true">
        <defs>
          <pattern id={patternId} width="56" height="56" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="28,4 52,28 28,52 4,28" />
              <polygon points="28,14 42,28 28,42 14,28" />
            </g>
            <polygon points="28,23 33,28 28,33 23,28" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
      <div className="relative h-full">{children}</div>
    </div>
  );
}

/**
 * The INDEGE mark with the job categories circling it: people who need help meeting workers.
 * The ring turns slowly while each icon stays upright. Still for people who ask for reduced motion.
 */
function HeroIllustration() {
  const icons = Object.values(CATEGORY_ICONS);
  return (
    <div className="relative aspect-square w-full max-w-[min(22rem,42vh)]" aria-hidden="true">
      <div className="absolute inset-[8%] rounded-full border border-dashed border-white/25" />
      <div className="absolute inset-[30%] rounded-full bg-white/5 ring-1 ring-white/15" />

      <div className="absolute inset-0 animate-[spin_60s_linear_infinite] motion-reduce:animate-none">
        {icons.map((Icon, index) => {
          const angle = (index / icons.length) * 2 * Math.PI - Math.PI / 2;
          return (
            <div
              key={index}
              className="absolute w-[17%] -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${50 + 42 * Math.cos(angle)}%`, top: `${50 + 42 * Math.sin(angle)}%` }}
            >
              <div className="grid aspect-square w-full animate-[spin_60s_linear_infinite_reverse] place-items-center rounded-2xl bg-white/12 shadow-lg ring-1 ring-white/20 backdrop-blur-sm motion-reduce:animate-none">
                <Icon className={`size-1/2 ${index % 2 ? "text-secondary" : "text-white"}`} strokeWidth={1.75} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute inset-[36%] grid place-items-center">
        <span className="absolute inset-0 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-[28%] bg-white/20 motion-reduce:hidden" />
        <div className="relative w-full drop-shadow-xl [&>svg]:size-full">
          <LogoMark />
        </div>
      </div>
    </div>
  );
}

interface AuthLayoutProps {
  title: StringKey;
  intro?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, intro, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <HeroPanel className="hidden lg:block">
        <div className="flex h-full flex-col justify-between gap-8 p-12">
          <Logo light />
          <div className="flex flex-1 items-center justify-center">
            <HeroIllustration />
          </div>
          <div className="max-w-md">
            <h2 className="text-4xl font-extrabold leading-tight">
              <Stacked k="heroTitle" />
            </h2>
            <p className="mt-5 text-lg text-white/85">
              <Stacked k="heroText" />
            </p>
          </div>
        </div>
      </HeroPanel>

      <main className="mx-auto w-full max-w-md px-4 pb-8 pt-4 lg:self-center lg:py-10">
        <HeroPanel className="mb-5 h-20 rounded-2xl lg:hidden" />
        <div className="mb-5 text-center">
          <div className="mb-3 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-extrabold">
            <Dual k={title} rwClassName="font-medium text-muted" />
          </h1>
          {intro && <div className="mt-1.5 text-sm text-muted">{intro}</div>}
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-line/60">{children}</div>

        {footer && <div className="mt-4">{footer}</div>}

        <p className="mt-5 flex items-start justify-center gap-1.5 rounded-xl bg-primary-soft px-3 py-2.5 text-center text-xs font-medium text-primary">
          <ShieldCheck className="mt-px size-4 shrink-0" aria-hidden="true" />
          <Stacked k="trustLine" />
        </p>
      </main>
    </div>
  );
}
