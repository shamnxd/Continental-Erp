import { ReactNode } from "react";

const subtitleClass = "text-xs text-muted-foreground truncate max-w-[200px]";

export function TablePrimarySecondary({
  primary,
  secondary,
  primaryClassName = "font-semibold text-foreground leading-tight truncate",
  secondaryClassName = subtitleClass,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
  primaryClassName?: string;
  secondaryClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <p className={primaryClassName}>{primary}</p>
      {secondary != null && secondary !== "" && (
        <p className={`${secondaryClassName} mt-0.5`}>{secondary}</p>
      )}
    </div>
  );
}

export function TableClientCell({
  name,
  subtitle,
  seed,
  logoUrl,
}: {
  name: string;
  subtitle?: string;
  seed?: string;
  logoUrl?: string;
}) {
  const avatarSeed = seed ?? name;
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 border border-border shadow-sm bg-muted flex items-center justify-center">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : (
          <img
            src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=be185d&fontSize=40&fontWeight=700`}
            alt={name}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <TablePrimarySecondary
        primary={name}
        secondary={subtitle}
        primaryClassName="font-semibold text-foreground leading-tight truncate max-w-[160px]"
        secondaryClassName={`${subtitleClass} max-w-[160px]`}
      />
    </div>
  );
}

export function TableStatusBadge({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: "muted" | "pink" | "blue" | "green" | "amber" | "red" | "orange";
}) {
  const toneClass: Record<string, string> = {
    muted: "bg-muted text-muted-foreground",
    pink: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
    blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    green: "bg-green-500/10 text-green-700 dark:text-green-300",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    red: "bg-red-500/10 text-red-700 dark:text-red-300",
    orange: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  };
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${toneClass[tone] ?? toneClass.muted}`}
    >
      {label}
    </span>
  );
}

export function formatTableDate(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }
): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", options);
}

export function formatTableDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const tableCellClass = {
  default: "px-4 py-4",
  narrow: "px-4 py-4 w-[110px]",
  medium: "px-4 py-4 w-[160px] min-w-[140px]",
  wide: "px-4 py-4 w-[200px] min-w-[180px]",
  actions: "px-4 py-4 text-right w-[52px]",
} as const;
