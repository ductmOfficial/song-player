import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold select-none cursor-pointer " +
  "transition-[background-color,color,transform,filter] duration-(--duration-fast) ease-(--ease-standard) " +
  "active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:brightness-110",
  secondary: "border border-border text-text hover:bg-surface-raised",
  ghost: "text-text-muted hover:text-text hover:bg-surface-raised",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-5 rounded-full text-[15px]",
  lg: "min-h-13 px-7 rounded-full text-base",
  icon: "size-11 rounded-full",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
