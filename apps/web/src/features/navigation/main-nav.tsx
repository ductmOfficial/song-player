"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { spring } from "@song/ui";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

const items = [
  { href: "/", key: "discover" },
  { href: "/search", key: "search" },
  { href: "/history", key: "history" },
] as const;

export function MainNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav aria-label={t("label")}>
      <ul className="flex items-center gap-1">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative inline-flex min-h-11 items-center rounded-full px-4 text-[15px] font-semibold transition-colors duration-(--duration-fast) ${active ? "text-text" : "text-text-muted hover:text-text"}`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-surface-raised"
                    transition={spring.snappy}
                  />
                )}
                <span className="relative">{t(item.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
