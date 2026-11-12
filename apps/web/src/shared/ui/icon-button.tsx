import { Button, type ButtonProps } from "@song/ui";

type Props = Omit<ButtonProps, "size" | "aria-label"> & {
  /** Accessible name, also shown as a native tooltip */
  label: string;
  /** Two-state toggle (shuffle): sets aria-pressed and the accent color */
  pressed?: boolean;
  /** Accent color only, for multi-state buttons whose label states the mode (repeat) */
  active?: boolean;
  size?: "sm" | "md";
};

/** 44×44 hit area by default (WCAG 2.5.5), 36×36 for dense rows. */
export function IconButton({
  label,
  pressed,
  active,
  size = "md",
  variant = "ghost",
  className = "",
  ...props
}: Props) {
  return (
    <Button
      size="icon"
      variant={variant}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={`${size === "sm" ? "size-9!" : ""} ${pressed || active ? "text-accent! hover:text-accent!" : ""} ${className}`}
      {...props}
    />
  );
}
