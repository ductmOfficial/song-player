import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main
      id="main"
      className="page-shell flex min-h-[50dvh] flex-col items-start justify-center gap-5"
    >
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] leading-tight">{t("title")}</h1>
      <p className="max-w-[50ch] text-lg text-text-muted">{t("body")}</p>
      <Link
        href="/"
        className="rounded-full bg-accent px-6 py-3 font-semibold text-on-accent hover:brightness-110"
      >
        {t("home")}
      </Link>
    </main>
  );
}
