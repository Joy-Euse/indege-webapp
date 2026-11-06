import { type StringKey, strings } from "../i18n/strings";

/** Text in both languages on one line, English first: "Password / Ijambobanga". */
export function Dual({ k, rwClassName = "font-normal text-muted" }: { k: StringKey; rwClassName?: string }) {
  const { en, rw } = strings[k];
  return (
    <>
      <span lang="en">{en}</span>
      <span className={rwClassName}>
        {" / "}
        <span lang="rw">{rw}</span>
      </span>
    </>
  );
}

/** Text in both languages as two lines, for sentences. */
export function Stacked({ k, className = "" }: { k: StringKey; className?: string }) {
  const { en, rw } = strings[k];
  return (
    <span className={className}>
      <span lang="en" className="block">
        {en}
      </span>
      <span lang="rw" className="block text-[0.92em] opacity-80">
        {rw}
      </span>
    </span>
  );
}

/** For attributes that take a single string, such as aria-label. */
export function plain(k: StringKey): string {
  return `${strings[k].en} / ${strings[k].rw}`;
}
