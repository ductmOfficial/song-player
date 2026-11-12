/** Three bouncing bars marking the playing track. Static when paused or with reduced motion. */
export function Equalizer({ playing, className = "" }: { playing: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-playing={playing}
      className={`s-eq inline-flex h-3.5 items-end gap-[2px] text-accent ${className}`}
    >
      <span />
      <span />
      <span />
    </span>
  );
}
