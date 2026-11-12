import { HistoryView } from "@/features/history/history-view";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("history");
  return { title: t("title"), robots: { index: false } };
}

export default async function HistoryPage() {
  const t = await getTranslations("history");
  return (
    <main id="main" className="page-shell flex flex-col gap-10">
      <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-tight tracking-tight">
        {t("title")}
      </h1>
      <HistoryView />
    </main>
  );
}
