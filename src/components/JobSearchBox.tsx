import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { plain } from "./Text";

const JOBS_PATH = "/customer/jobs";
const DEBOUNCE_MS = 300;

interface JobSearchBoxProps {
  className?: string;
  /** Listens for Ctrl+K or Cmd+K. Give it to one box only. */
  shortcut?: boolean;
  autoFocus?: boolean;
}

/**
 * Searches the customer's jobs. Results show on My jobs, and the search lives in the URL,
 * so the back button and a refresh keep it.
 */
export function JobSearchBox({ className = "", shortcut = false, autoFocus = false }: JobSearchBoxProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const onJobsPage = location.pathname === JOBS_PATH;
  const urlQuery = onJobsPage ? (new URLSearchParams(location.search).get("q") ?? "") : "";
  const [value, setValue] = useState(urlQuery);

  // Follows changes made elsewhere, such as the back button, but never fights someone typing.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setValue(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const query = value.trim();
    if (query === urlQuery || (!query && !onJobsPage)) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(onJobsPage ? location.search : "");
      if (query) params.set("q", query);
      else params.delete("q");
      navigate({ pathname: JOBS_PATH, search: params.toString() }, { replace: onJobsPage });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // Only typing starts a search. Navigation alone must not, or the back button would bounce forward.
  }, [value]);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);

  return (
    <form
      role="search"
      onSubmit={(event) => event.preventDefault()}
      className={`items-center gap-2 rounded-xl bg-white px-3.5 ring-1 ring-line transition focus-within:ring-2 focus-within:ring-primary ${className}`}
    >
      <Search className="size-4.5 shrink-0 text-muted" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        autoFocus={autoFocus}
        maxLength={100}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") inputRef.current?.blur();
        }}
        placeholder={plain("searchJobs")}
        aria-label={plain("searchJobs")}
        className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-gray-500 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            setValue("");
            inputRef.current?.focus();
          }}
          aria-label={plain("clearSearch")}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface hover:text-ink"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : (
        shortcut && (
          <kbd className="hidden shrink-0 rounded-md border border-line px-1.5 py-0.5 font-sans text-[11px] font-semibold text-muted lg:block">
            Ctrl K
          </kbd>
        )
      )}
    </form>
  );
}
