import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { JobList } from "../../components/JobParts";
import { Dual, plain } from "../../components/Text";
import { EmptyBox, workerBadge } from "../../components/WorkParts";
import { CATEGORY_LABELS, DISTRICTS, isOfferedCategory, type JobCategory, OFFERED_CATEGORIES } from "../../lib/jobs";
import { useFindWork } from "../../lib/work";

const DEBOUNCE_MS = 300;

/** Open jobs a worker can apply for. The filters live in the URL, so back and refresh keep them. */
export function FindWork() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const categoryParam = params.get("category");
  const category: JobCategory | undefined = isOfferedCategory(categoryParam) ? categoryParam : undefined;
  const districtParam = params.get("district");
  const district = DISTRICTS.find((d) => d === districtParam);
  const search = useFindWork({ q, category, district });
  const jobs = search.data?.pages.flatMap((page) => page.jobs);
  const filtered = Boolean(q || category || district);

  function setParam(name: string, value: string | undefined) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    setParams(next, { replace: true });
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold lg:text-3xl">
        <Dual k="navFindWork" />
      </h1>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <SearchInput value={q} onChange={(value) => setParam("q", value)} />
        <FilterSelect
          label={plain("stepCategory")}
          value={category ?? ""}
          onChange={(value) => setParam("category", value)}
          allLabel={plain("allCategories")}
          options={OFFERED_CATEGORIES.map((c) => ({ value: c, label: plain(CATEGORY_LABELS[c]) }))}
        />
        <FilterSelect
          label={plain("district")}
          value={district ?? ""}
          onChange={(value) => setParam("district", value)}
          allLabel={plain("allDistricts")}
          options={DISTRICTS.map((d) => ({ value: d, label: d }))}
        />
      </div>

      <div aria-live="polite" aria-busy={search.isFetching} className={search.isPlaceholderData ? "opacity-60 transition" : ""}>
        <JobList
          query={search}
          jobs={jobs}
          hrefFor={(job) => `/worker/jobs/${job.id}`}
          badgeFor={workerBadge}
          forCustomer={false}
          empty={<EmptyBox k={filtered ? "noWorkMatches" : "noOpenJobs"} />}
        />
      </div>

      {search.hasNextPage && (
        <button
          type="button"
          onClick={() => void search.fetchNextPage()}
          disabled={search.isFetchingNextPage}
          className="mx-auto flex min-h-12 w-full max-w-xs items-center justify-center rounded-xl bg-card text-sm font-bold text-primary ring-1 ring-primary/30 hover:bg-primary-soft disabled:opacity-60"
        >
          <Dual k="loadMore" rwClassName="font-medium text-primary/70" />
        </button>
      )}
    </div>
  );
}

/** Types freely, and only updates the URL (and so the search) once typing pauses. */
function SearchInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(value);

  // Follows changes made elsewhere, such as the back button, but never fights someone typing.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setText(value);
  }, [value]);

  useEffect(() => {
    const query = text.trim();
    if (query === value) return;
    const timer = setTimeout(() => onChange(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // Only typing starts a search.
  }, [text]);

  return (
    <form
      role="search"
      onSubmit={(event) => event.preventDefault()}
      className="flex items-center gap-2 rounded-xl bg-card px-3.5 ring-1 ring-line transition focus-within:ring-2 focus-within:ring-primary"
    >
      <Search className="size-4.5 shrink-0 text-muted" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={text}
        maxLength={100}
        onChange={(event) => setText(event.target.value)}
        placeholder={plain("searchWork")}
        aria-label={plain("searchWork")}
        className="min-h-11 min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted/70 [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText("");
            inputRef.current?.focus();
          }}
          aria-label={plain("clearSearch")}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface hover:text-ink"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </form>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  allLabel: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, allLabel, options, onChange }: FilterSelectProps) {
  return (
    <div className="relative flex items-center rounded-xl bg-card ring-1 ring-line transition focus-within:ring-2 focus-within:ring-primary">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-11 w-full min-w-0 appearance-none bg-transparent py-2.5 pr-10 pl-3.5 text-sm outline-none ${value ? "font-bold" : "text-muted"}`}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 size-4 text-muted" aria-hidden="true" />
    </div>
  );
}
