import { Logo } from "../components/Logo";
import { Dual, Stacked } from "../components/Text";
import type { StringKey } from "../i18n/strings";

/** Replace with the real Terms and Privacy Policy before launch. */
export function LegalPlaceholder({ title }: { title: StringKey }) {
  return (
    <main className="mx-auto min-h-dvh max-w-xl px-4 py-8">
      <Logo />
      <h1 className="mt-8 text-2xl font-extrabold">
        <Dual k={title} rwClassName="font-medium text-muted" />
      </h1>
      <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line/60">
        <Stacked k="legalSoon" className="text-muted" />
      </div>
    </main>
  );
}
