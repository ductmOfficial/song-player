import { duration, ease } from "@song/ui";

interface Origin {
  x: number;
  y: number;
}

/**
 * Switch theme with a circular reveal from the control the person used.
 * Falls back to an instant switch without View Transitions or with reduced motion.
 */
export function switchTheme(apply: () => void, resolvedId: string, origin?: Origin) {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const commit = () => {
    apply();
    // next-themes writes the attribute after React re-renders; set it now so the
    // transition's new snapshot already shows the new theme.
    root.dataset.theme = resolvedId;
  };

  if (!("startViewTransition" in document) || reduce) {
    commit();
    return;
  }

  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? 0;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = document.startViewTransition(commit);
  transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${String(x)}px ${String(y)}px)`,
            `circle(${String(radius)}px at ${String(x)}px ${String(y)}px)`,
          ],
        },
        {
          duration: duration.slower * 1000,
          easing: `cubic-bezier(${ease.emphasized.join(",")})`,
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => undefined);
}
