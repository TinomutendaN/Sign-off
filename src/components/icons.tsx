// Every icon in the designs (design/source), as inline outline SVGs on a 24 px grid.
// Paths are copied from the source. Each icon's default size and stroke width are the
// ones the source uses most; pass `size` or `strokeWidth` to change them.

import type { ReactNode, SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number;
  strokeWidth?: number;
};

type BaseProps = IconProps & {
  defaultSize: number;
  defaultStroke: number;
  round?: "both" | "cap" | "join";
  children: ReactNode;
};

function Svg({ size, strokeWidth, defaultSize, defaultStroke, round = "both", children, ...rest }: BaseProps) {
  return (
    <svg
      aria-hidden="true"
      width={size ?? defaultSize}
      height={size ?? defaultSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth ?? defaultStroke}
      strokeLinecap={round === "join" ? undefined : "round"}
      strokeLinejoin={round === "cap" ? undefined : "round"}
      {...rest}
    >
      {children}
    </svg>
  );
}

// ---------- Menu ----------

export function HomeIcon(props: IconProps) {
  return (
    <Svg defaultSize={20} defaultStroke={1.7} {...props}>
      <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </Svg>
  );
}

export function PeopleIcon(props: IconProps) {
  return (
    <Svg defaultSize={20} defaultStroke={1.7} {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.7 3.1 2.4 3.5 5.2" />
    </Svg>
  );
}

export function KanbanIcon(props: IconProps) {
  return (
    <Svg defaultSize={20} defaultStroke={1.7} {...props}>
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="10" y="4" width="5" height="11" rx="1.5" />
      <rect x="17" y="4" width="4" height="7" rx="1.5" />
    </Svg>
  );
}

/** Card with a stripe and a number line (Billing and Plans menu items). */
export function BillingIcon(props: IconProps) {
  return (
    <Svg defaultSize={20} defaultStroke={1.7} {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19M6.5 15h4" />
    </Svg>
  );
}

export function HelpIcon(props: IconProps) {
  return (
    <Svg defaultSize={20} defaultStroke={1.7} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.2M12 17h.01" />
    </Svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Svg defaultSize={20} defaultStroke={1.7} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </Svg>
  );
}

/** Bar chart (admin Overview). */
export function ChartIcon(props: IconProps) {
  return (
    <Svg defaultSize={20} defaultStroke={1.7} {...props}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </Svg>
  );
}

export function FileIcon(props: IconProps) {
  return (
    <Svg defaultSize={20} defaultStroke={1.7} {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </Svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Svg defaultSize={20} defaultStroke={1.7} {...props}>
      <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9M10 20a2 2 0 0 0 4 0" />
    </Svg>
  );
}

// ---------- Header tiles ----------

/** Screen with a stand (project header tile). */
export function MonitorIcon(props: IconProps) {
  return (
    <Svg defaultSize={22} defaultStroke={1.7} {...props}>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M3 9h18M8 21h8" />
    </Svg>
  );
}

/** Plain card (Billing header tile, payment method). */
export function CardIcon(props: IconProps) {
  return (
    <Svg defaultSize={22} defaultStroke={1.7} {...props}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19" />
    </Svg>
  );
}

/** Project favourite star (board header). */
export function StarIcon(props: IconProps) {
  return (
    <Svg defaultSize={18} defaultStroke={1.7} round="join" {...props}>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </Svg>
  );
}

/** Upgrade pop-up star. */
export function UpgradeStarIcon(props: IconProps) {
  return (
    <Svg defaultSize={22} defaultStroke={1.8} {...props}>
      <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </Svg>
  );
}

// ---------- Small controls ----------

export function SearchIcon(props: IconProps) {
  return (
    <Svg defaultSize={16} defaultStroke={2} round="cap" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg defaultSize={12} defaultStroke={2.4} round="cap" {...props}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

/** Up-and-down chevrons (workspace switcher). */
export function ChevronsUpDownIcon(props: IconProps) {
  return (
    <Svg defaultSize={16} defaultStroke={2} round="cap" {...props}>
      <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg defaultSize={14} defaultStroke={2} round="cap" {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg defaultSize={16} defaultStroke={2} round="cap" {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg defaultSize={18} defaultStroke={2.2} {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg defaultSize={16} defaultStroke={2} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <Svg defaultSize={16} defaultStroke={1.8} round="cap" {...props}>
      <path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </Svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <Svg defaultSize={16} defaultStroke={1.8} round="cap" {...props}>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </Svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <Svg defaultSize={16} defaultStroke={1.8} {...props}>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </Svg>
  );
}

// ---------- Status and actions ----------

export function WarningIcon(props: IconProps) {
  return (
    <Svg defaultSize={18} defaultStroke={2} {...props}>
      <path d="M12 3l9.5 17h-19z" />
      <path d="M12 10v4M12 17.5h.01" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg defaultSize={18} defaultStroke={1.8} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Svg defaultSize={18} defaultStroke={2} {...props}>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
    </Svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <Svg defaultSize={22} defaultStroke={1.8} {...props}>
      <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
    </Svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <Svg defaultSize={16} defaultStroke={2} {...props}>
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </Svg>
  );
}

/** Paper plane (send invite). */
export function SendIcon(props: IconProps) {
  return (
    <Svg defaultSize={16} defaultStroke={2} {...props}>
      <path d="M21 3L10 14M21 3l-7 18-4-7-7-4z" />
    </Svg>
  );
}

export function CommentIcon(props: IconProps) {
  return (
    <Svg defaultSize={14} defaultStroke={1.8} {...props}>
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" />
    </Svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Svg defaultSize={14} defaultStroke={1.8} round="cap" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Svg>
  );
}

// ---------- Pricing trust row ----------

export function LockIcon(props: IconProps) {
  return (
    <Svg defaultSize={16} defaultStroke={1.8} {...props}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Svg defaultSize={16} defaultStroke={1.8} {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
    </Svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <Svg defaultSize={16} defaultStroke={1.8} {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" />
    </Svg>
  );
}
