import { getTranslations } from "next-intl/server";

/** Precached by the service worker; shown when a page isn't cached and the network is gone. */
export default async function OfflinePage() {
  const t = await getTranslations("offline");
  return (
    <main
      id="main"
      className="page-shell flex min-h-[50dvh] flex-col items-start justify-center gap-5"
    >
      <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-tight">{t("title")}</h1>
      <p className="max-w-[50ch] text-lg text-text-muted">{t("body")}</p>
    </main>
  );
}
