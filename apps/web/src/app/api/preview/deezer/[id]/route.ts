import { deezer } from "@/shared/sources";
import { NextResponse } from "next/server";

/**
 * GET /api/preview/deezer/:id → { url } of a freshly signed 30 s preview.
 * Deezer's preview URLs expire within hours, so a queue restored from
 * storage must not hold them; the player asks here right before playing.
 * (JSON rather than a redirect: the <audio> element then loads the CDN URL
 * directly, which behaves the same in every browser.)
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const url = await deezer.previewUrl(id);
    if (!url) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ url }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[preview] deezer failed", e);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
