import { ShieldCheck } from "lucide-react";
import { type ReactNode, useId } from "react";
import type { StringKey } from "../i18n/strings";
import { Logo } from "./Logo";
import { Dual, Stacked } from "./Text";

/**
 * Green Imigongo-style panel, standing in for the Kigali photo in the design.
 * To use the photo: add it at public/kigali.jpg and set it as this panel's background image.
 */
function HeroPanel({ className = "", children }: { className?: string; children?: ReactNode }) {
  const patternId = `imigongo${useId().replace(/:/g, "")}`;
  return (
    <div className={`relative overflow-hidden bg-primary text-white ${className}`}>
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
        <div className="flex h-full flex-col justify-between p-12">
          <Logo light />
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

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line/60">{children}</div>

        {footer && <div className="mt-4">{footer}</div>}

        <p className="mt-5 flex items-start justify-center gap-1.5 rounded-xl bg-primary-soft px-3 py-2.5 text-center text-xs font-medium text-primary">
          <ShieldCheck className="mt-px size-4 shrink-0" aria-hidden="true" />
          <Stacked k="trustLine" />
        </p>
      </main>
    </div>
  );
}
