"use client";

import { Button } from "@song/ui";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

/** Shown when a page's data can't load (Audius down, network lost). The player keeps playing. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main"
      className="page-shell flex min-h-[50dvh] flex-col items-start justify-center gap-5"
    >
      <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-tight">{t("title")}</h1>
      <p className="max-w-[50ch] text-lg text-text-muted">{t("body")}</p>
      <Button size="lg" onClick={reset}>
        {t("retry")}
      </Button>
    </main>
  );
}
