"use client";

import { useRouter } from "@/i18n/navigation";
import { spring } from "@song/ui";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { type ReactNode, useOptimistic, useTransition } from "react";
import { type DiscoverFilter, type Mood, type Time, filterQuery, moods, times } from "./moods";

/**
 * Time window + mood filters for the trending grid. The URL (?time=&mood=) is
 * the source of truth so filtered views are shareable; pills move
 * optimistically while the server renders the new grid, which dims until it
 * arrives.
 */
export function TrendingFilters({
  selected,
  children,
}: {
  selected: DiscoverFilter;
  children: ReactNode;
}) {
  const t = useTranslations("discover");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(selected);

  const select = (patch: Partial<DiscoverFilter>) => {
    const next = { ...optimistic, ...patch };
    if (next.mood === optimistic.mood && next.time === optimistic.time) return;
    startTransition(() => {
      setOptimistic(next);
      router.replace({ pathname: "/", query: filterQuery(next) }, { scroll: false });
    });
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <PillGroup
          label={t("times.label")}
          layoutId="time-pill"
          options={times.map((x) => ({ id: x, label: t(`times.${x}`) }))}
          value={optimistic.time}
          onChange={(time: Time) => {
            select({ time });
          }}
        />
        <PillGroup
          label={t("moods.label")}
          layoutId="mood-pill"
          options={(Object.keys(moods) as Mood[]).map((x) => ({ id: x, label: t(`moods.${x}`) }))}
          value={optimistic.mood}
          onChange={(mood: Mood) => {
            select({ mood });
          }}
        />
      </div>
      <div
        aria-busy={pending}
        className={`transition-opacity duration-(--duration-base) ${pending ? "opacity-50" : ""}`}
      >
        {children}
      </div>
    </>
  );
}

function PillGroup<T extends string>({
  label,
  layoutId,
  options,
  value,
  onChange,
}: {
  label: string;
  layoutId: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2.5">
      <legend className="sr-only">{label}</legend>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => {
              onChange(o.id);
            }}
            className={`relative min-h-11 cursor-pointer rounded-full border px-5 text-[15px] font-medium transition-colors duration-(--duration-base) ${
              on
                ? "border-transparent text-on-accent"
                : "border-border text-text hover:bg-surface-raised"
            }`}
          >
            {on && (
              <motion.span
                layoutId={layoutId}
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-accent"
                transition={spring.snappy}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </fieldset>
  );
}
