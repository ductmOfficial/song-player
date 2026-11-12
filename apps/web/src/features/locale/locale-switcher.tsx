"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale, routing } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

export function LocaleSwitcher() {
  const t = useTranslations("locale");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function change(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next, scroll: false });
    });
  }

  return (
    <nav aria-label={t("label")} className="flex items-center gap-1" aria-busy={pending}>
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          onClick={() => {
            change(l);
          }}
          aria-current={l === locale ? "true" : undefined}
          className={`min-h-11 min-w-11 cursor-pointer rounded-full px-3 text-sm font-semibold transition-colors duration-(--duration-fast) ${
            l === locale ? "bg-surface-raised text-text" : "text-text-muted hover:text-text"
          }`}
        >
          {l.toUpperCase()}
          {/* Accessible name starts with the visible label (WCAG 2.5.3) */}
          <span className="sr-only"> {t(l)}</span>
        </button>
      ))}
    </nav>
  );
}
