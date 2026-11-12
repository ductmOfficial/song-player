/** Layout-matching placeholders, so content doesn't jump when it streams in. */
const block =
  "animate-pulse rounded-(--radius-control) bg-surface-raised motion-reduce:animate-none";

export function DetailSkeleton() {
  return (
    <main id="main" aria-busy="true" className="page-shell flex flex-col gap-16">
      <div className="grid items-end gap-8 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)] md:gap-12">
        <div className={`aspect-square w-full max-w-[380px] ${block}`} />
        <div className="flex flex-col gap-5">
          <div className={`h-4 w-28 ${block}`} />
          <div className={`h-16 w-4/5 ${block}`} />
          <div className={`h-6 w-1/2 ${block}`} />
          <div className={`h-13 w-60 ${block}`} />
        </div>
      </div>
      <ListSkeleton rows={5} />
    </main>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
        <div key={i} className="flex items-center gap-3">
          <div className={`size-11 ${block}`} />
          <div className="flex flex-1 flex-col gap-2">
            <div className={`h-4 w-1/3 ${block}`} />
            <div className={`h-3 w-1/5 ${block}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
