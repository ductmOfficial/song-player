import type { SVGProps } from "react";

/**
 * Line icons on a 24px grid, drawn with currentColor. Decorative by default:
 * the control that contains an icon carries the accessible name.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const PlayIcon = (p: IconProps) => (
  <Icon {...p} fill="currentColor" stroke="none">
    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" />
  </Icon>
);
export const PauseIcon = (p: IconProps) => (
  <Icon {...p} fill="currentColor" stroke="none">
    <rect x="6" y="4" width="4" height="16" rx="1.2" />
    <rect x="14" y="4" width="4" height="16" rx="1.2" />
  </Icon>
);
export const NextIcon = (p: IconProps) => (
  <Icon {...p} fill="currentColor" stroke="none">
    <path d="M5 5.2v13.6a1 1 0 0 0 1.53.85L16 13.2V18a1 1 0 0 0 2 0V6a1 1 0 0 0-2 0v4.8L6.53 4.35A1 1 0 0 0 5 5.2z" />
  </Icon>
);
export const PrevIcon = (p: IconProps) => (
  <Icon {...p} fill="currentColor" stroke="none">
    <path d="M19 5.2v13.6a1 1 0 0 1-1.53.85L8 13.2V18a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v4.8l9.47-6.45A1 1 0 0 1 19 5.2z" />
  </Icon>
);
export const ShuffleIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 7h3.5c2 0 3.2 1 4.3 2.8l2.4 4.4C14.3 16 15.5 17 17.5 17H21M18 14l3 3-3 3M3 17h3.5c1.3 0 2.3-.5 3.1-1.3M14.4 8.3c.8-.8 1.8-1.3 3.1-1.3H21M18 4l3 3-3 3" />
  </Icon>
);
export const RepeatIcon = ({ one, ...p }: IconProps & { one?: boolean }) => (
  <Icon {...p}>
    <path d="M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4" />
    {one && <path d="M11 10.5l1.5-1V15" strokeWidth="1.6" />}
  </Icon>
);
export const VolumeIcon = ({ level = 1, ...p }: IconProps & { level?: number }) => (
  <Icon {...p}>
    <path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" />
    {level === 0 ? (
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    ) : (
      <>
        <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
        {level > 0.5 && <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />}
      </>
    )}
  </Icon>
);
export const QueueIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 6h13M3 12h13M3 18h8M17 15v6l4-3-4-3z" />
  </Icon>
);
export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const PlayNextIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 6h11M3 12h8M3 18h11M16 9l5 3-5 3V9z" />
  </Icon>
);
export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);
export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);
export const ExpandIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 15l6-6 6 6" />
  </Icon>
);
export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Icon>
);
export const GripIcon = (p: IconProps) => (
  <Icon {...p} fill="currentColor" stroke="none">
    {[7, 12, 17].flatMap((y) =>
      [9, 15].map((x) => <circle key={`${String(x)}-${String(y)}`} cx={x} cy={y} r="1.4" />),
    )}
  </Icon>
);
export const VerifiedIcon = (p: IconProps) => (
  <Icon {...p} fill="currentColor" stroke="none">
    <path d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2L12 2z" />
    <path d="M8.5 12.2l2.3 2.3 4.7-4.8" stroke="var(--s-bg)" strokeWidth="2" fill="none" />
  </Icon>
);
export const LockIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Icon>
);
export const KeyboardIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2" y="6" width="20" height="13" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 15h10" />
  </Icon>
);
export const ExternalIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Icon>
);
export const WaveIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 12c2.5-4 5-4 7.5 0s5 4 7.5 0 3.5-3 5-1.5" />
  </Icon>
);
