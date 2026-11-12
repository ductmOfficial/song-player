import { LocaleSwitcher } from "@/features/locale/locale-switcher";
import { ThemeSwitcher } from "@/features/theme/theme-switcher";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export async function SiteHeader() {
  const t = await getTranslations("a11y");
  return (
    <header className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-5 sm:px-10">
      <Link href="/" aria-label={t("home")} className="flex items-center gap-2.5">
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--s-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M2 12c2.5-4 5-4 7.5 0s5 4 7.5 0 3.5-3 5-1.5" />
        </svg>
        <span className="font-display text-3xl italic tracking-tight">Sóng</span>
      </Link>
      <div className="flex items-center gap-3">
        <LocaleSwitcher />
        <ThemeSwitcher />
      </div>
    </header>
  );
}
