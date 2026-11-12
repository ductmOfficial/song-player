"use client";

import { Link } from "@/i18n/navigation";
import { Artwork } from "@/shared/ui/artwork";
import { EmptyState } from "@/shared/ui/empty-state";
import { SearchIcon, VerifiedIcon } from "@/shared/ui/icons";
import { ListSkeleton } from "@/shared/ui/skeletons";
import { Button } from "@song/ui";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { TrackList } from "../tracks/track-list";
import { type SearchResults, normalizeQuery } from "./search-api";
import { useDebounced } from "./use-debounced";

const suggestions = ["lofi", "ambient", "house", "piano", "jazz", "synthwave"];

async function fetchResults(q: string, signal: AbortSignal): Promise<SearchResults> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) throw new Error(`Search failed (${String(res.status)})`);
  return (await res.json()) as SearchResults;
}

/**
 * Search-as-you-type. The first render uses results the server already
 * fetched for ?q= (shareable URLs); after that TanStack Query caches,
 * dedupes and cancels requests while the person types.
 */
export function SearchView({
  initialQuery,
  initialResults,
}: {
  initialQuery: string;
  initialResults?: SearchResults;
}) {
  const t = useTranslations("search");
  const inputId = useId();
  const [input, setInput] = useState(initialQuery);
  const q = normalizeQuery(useDebounced(input, 250));

  const query = useQuery({
    queryKey: ["search", q],
    queryFn: ({ signal }) => fetchResults(q, signal),
    enabled: q !== "",
    placeholderData: keepPreviousData,
    initialData: q === initialQuery && initialResults ? initialResults : undefined,
    staleTime: 60_000,
  });

  // Keep the URL in step without a server round-trip (Next syncs useSearchParams with history).
  useEffect(() => {
    const url = new URL(window.location.href);
    if ((url.searchParams.get("q") ?? "") === q) return;
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }, [q]);

  const data = q ? query.data : undefined;
  const count = data ? data.tracks.length + data.artists.length : 0;

  return (
    <div className="flex flex-col gap-10">
      <search>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          className="relative"
        >
          <label htmlFor={inputId} className="sr-only">
            {t("label")}
          </label>
          <SearchIcon
            size={22}
            className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-text-muted"
          />
          <input
            id={inputId}
            type="search"
            value={input}
            onChange={(e) => {
              setInput(e.currentTarget.value);
            }}
            placeholder={t("placeholder")}
            autoComplete="off"
            spellCheck={false}
            // biome-ignore lint/a11y/noAutofocus: the search page exists to type into
            autoFocus
            enterKeyHint="search"
            className="h-16 w-full rounded-full border border-border bg-surface pr-6 pl-14 text-lg placeholder:text-text-muted focus-visible:border-accent focus-visible:outline-none"
          />
          {query.isFetching && q && (
            <span
              aria-hidden="true"
              className="s-spinner absolute top-1/2 right-5 size-5 -translate-y-1/2 rounded-full"
            />
          )}
        </form>
      </search>

      <output className="sr-only">
        {data
          ? count
            ? t("resultCount", { tracks: data.tracks.length, artists: data.artists.length })
            : t("noResultsTitle", { q })
          : ""}
      </output>

      {!q ? (
        <div className="flex flex-col gap-4">
          <p className="text-text-muted">{t("tryThese")}</p>
          <ul className="flex flex-wrap gap-2.5">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => {
                    setInput(s);
                  }}
                  className="min-h-11 cursor-pointer rounded-full border border-border px-5 font-medium hover:bg-surface-raised"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : query.isError && !data ? (
        <EmptyState title={t("errorTitle")} body={t("errorBody")}>
          <Button variant="secondary" onClick={() => void query.refetch()}>
            {t("retry")}
          </Button>
        </EmptyState>
      ) : !data ? (
        <ListSkeleton rows={8} />
      ) : count === 0 ? (
        <EmptyState title={t("noResultsTitle", { q })} body={t("noResultsBody")} />
      ) : (
        <div
          className={`flex flex-col gap-12 transition-opacity duration-(--duration-base) ${query.isPlaceholderData ? "opacity-60" : ""}`}
        >
          {data.artists.length > 0 && (
            <section aria-labelledby="artists-h" className="flex flex-col gap-5">
              <h2 id="artists-h" className="font-display text-3xl">
                {t("artists")}
              </h2>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-6">
                {data.artists.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/artist/${String(a.handle)}`}
                      className="group flex flex-col items-center gap-3 text-center"
                    >
                      <Artwork
                        artwork={a.avatar}
                        size="medium"
                        rounded="full"
                        className="aspect-square w-full max-w-[140px] transition-transform duration-(--duration-slow) group-hover:scale-[1.03]"
                      />
                      <span className="flex max-w-full items-center gap-1 font-semibold group-hover:underline">
                        <span className="truncate">{a.name}</span>
                        {a.verified && <VerifiedIcon size={16} className="shrink-0 text-accent" />}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {data.tracks.length > 0 && (
            <section aria-labelledby="tracks-h" className="flex flex-col gap-4">
              <h2 id="tracks-h" className="font-display text-3xl">
                {t("tracks")}
              </h2>
              <TrackList tracks={data.tracks} showPlays label={t("tracks")} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
