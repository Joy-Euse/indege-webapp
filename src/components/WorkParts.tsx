import { Mail, MapPin, Phone } from "lucide-react";
import type { PublicProfile } from "../lib/account";
import { formatMonthYear } from "../lib/jobs";
import { APPLICATION_STATUS_LABELS, type ApplicationStatus, type MyApplication } from "../lib/work";
import { StatusBadge } from "./JobParts";
import type { StringKey } from "../i18n/strings";
import { Dual, Stacked } from "./Text";

const APPLICATION_STYLES: Record<ApplicationStatus, string> = {
  PENDING: "bg-secondary-soft text-secondary-dark",
  HIRED: "bg-primary-soft text-primary",
  NOT_SELECTED: "bg-field text-muted",
  WITHDRAWN: "bg-field text-muted",
};

export function ApplicationBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-center text-xs font-bold ${APPLICATION_STYLES[status]}`}>
      <Stacked k={APPLICATION_STATUS_LABELS[status]} className="leading-tight" />
    </span>
  );
}

/**
 * On a worker's lists: where their application stands, or nothing for a job they haven't applied to.
 * A cancelled job says so, which explains a "not selected" better than the application can.
 */
export function workerBadge(job: { status: Parameters<typeof StatusBadge>[0]["status"]; myApplication?: MyApplication | null }) {
  if (job.status === "CANCELLED") return <StatusBadge status="CANCELLED" />;
  return job.myApplication ? <ApplicationBadge status={job.myApplication.status} /> : null;
}

/**
 * A person's name and whatever contact details they share with the viewer. With `expectContact`,
 * says so when they share none, for the people who need to reach each other about a job.
 */
export function PersonCard({ person, expectContact = false }: { person: PublicProfile; expectContact?: boolean }) {
  const initials = person.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const hasContact = person.phone || person.email;

  return (
    <div className="flex items-start gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-tertiary-soft font-display font-extrabold text-tertiary" aria-hidden="true">
        {initials}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-bold">{person.fullName}</p>
        <p className="text-xs text-muted">
          <Dual k="memberSince" rwClassName="" /> {formatMonthYear(person.memberSince)}
        </p>
        {person.bio && <p className="mt-1.5 whitespace-pre-line break-words">{person.bio}</p>}
        <ul className="mt-1.5 space-y-1">
          {person.phone && (
            <li>
              <a href={`tel:${person.phone}`} className="inline-flex min-h-8 items-center gap-1.5 font-semibold text-primary underline-offset-2 hover:underline">
                <Phone className="size-4" aria-hidden="true" />
                {person.phone}
              </a>
            </li>
          )}
          {person.email && (
            <li>
              <a href={`mailto:${person.email}`} className="inline-flex min-h-8 items-center gap-1.5 break-all font-semibold text-primary underline-offset-2 hover:underline">
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                {person.email}
              </a>
            </li>
          )}
          {person.district && (
            <li className="flex items-center gap-1.5 text-muted">
              <MapPin className="size-4" aria-hidden="true" />
              {person.sector ? `${person.sector}, ` : ""}
              {person.district}
            </li>
          )}
        </ul>
        {expectContact && !hasContact && <Stacked k="noContactShared" className="mt-1.5 block text-xs text-muted" />}
      </div>
    </div>
  );
}

export function EmptyBox({ k }: { k: StringKey }) {
  return (
    <div className="rounded-2xl bg-white p-6 text-sm shadow-sm ring-1 ring-line/60">
      <Stacked k={k} className="text-muted" />
    </div>
  );
}
