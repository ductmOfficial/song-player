import { type SearchResults, normalizeQuery } from "@/features/search/search-api";
import { searchAll } from "@/features/search/search-server";
import { SearchView } from "@/features/search/search-view";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [{ q }, t] = await Promise.all([searchParams, getTranslations("search")]);
  const query = normalizeQuery(q);
  return {
    title: query ? t("titleWithQuery", { q: query }) : t("title"),
    robots: { index: false },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const t = await getTranslations("search");
  const query = normalizeQuery(q);
  let initial: SearchResults | undefined;
  if (query) {
    try {
      initial = await searchAll(query);
    } catch {
      initial = undefined; // the client retries and shows the error state
    }
  }

  return (
    <main id="main" className="page-shell flex flex-col gap-10">
      <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-tight tracking-tight">
        {t("title")}
      </h1>
      <SearchView initialQuery={query} initialResults={initial} />
    </main>
  );
}
