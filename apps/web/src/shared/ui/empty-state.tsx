import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: ReactNode;
}) {
  return (
    <div
      aria-live="polite"
      className="flex flex-col items-start gap-1 rounded-(--radius-control) border border-border bg-surface p-8"
    >
      <p className="font-semibold">{title}</p>
      {body ? <p className="text-text-muted">{body}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
