import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";

import { routing } from "./routing";

export default getRequestConfig(async () => {
  // `[locale]` holds the root layout, so its value is a root param.
  const locale = await rootParams.locale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const messages = (await import(`../../messages/${locale}.json`)) as {
    default: Record<string, unknown>;
  };
  return { locale, messages: messages.default };
});
