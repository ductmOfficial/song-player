import { emptyResults, normalizeQuery } from "@/features/search/search-api";
import { searchAll } from "@/features/search/search-server";
import { NextResponse } from "next/server";

/** GET /api/search?q=… — tracks and artists, for search-as-you-type. */
export async function GET(request: Request) {
  const q = normalizeQuery(new URL(request.url).searchParams.get("q"));
  if (!q) return NextResponse.json(emptyResults);
  try {
    const results = await searchAll(q);
    return NextResponse.json(results, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (e) {
    console.error("[search] failed", e);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
