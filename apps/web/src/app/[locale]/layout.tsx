import { routing } from "@/i18n/routing";
import { AppProviders } from "@/providers/app-providers";
import { SiteHeader } from "@/shared/site-header";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import "../globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
    { media: "(prefers-color-scheme: light)", color: "#f6f3ee" },
  ],
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: { default: t("title"), template: "%s · Sóng" },
    applicationName: "Sóng",
    description: t("description"),
    alternates: { languages: { vi: "/", en: "/en" } },
  };
}

export default async function LocaleLayout({ children }: { children: ReactNode }) {
  // i18n/request.ts reads and validates the locale (unknown locales are a 404).
  const locale = await getLocale();
  const t = await getTranslations("a11y");

  return (
    // next-themes sets data-theme before hydration, hence suppressHydrationWarning.
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-dvh bg-bg text-text">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-surface-raised focus:px-4 focus:py-2"
        >
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider>
          <AppProviders audiusAppName={process.env.AUDIUS_APP_NAME ?? "song-portfolio"}>
            <SiteHeader />
            {children}
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
