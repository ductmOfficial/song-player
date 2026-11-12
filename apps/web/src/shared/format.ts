/** 0 → "0:00", 75 → "1:15", 3725 → "1:02:05" */
export function formatTime(totalSec: number): string {
  const s = Number.isFinite(totalSec) && totalSec > 0 ? Math.floor(totalSec) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${String(h)}:${String(m).padStart(2, "0")}:${sec}` : `${String(m)}:${sec}`;
}

const compactCache = new Map<string, Intl.NumberFormat>();

/** 1234 → "1,2 N" (vi) / "1.2K" (en) */
export function formatCount(n: number, locale: string): string {
  let f = compactCache.get(locale);
  if (!f) {
    f = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
    compactCache.set(locale, f);
  }
  return f.format(n);
}

/** Calendar day key in local time, for grouping ("2026-11-08"). */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${String(y)}-${m}-${d}`;
}
