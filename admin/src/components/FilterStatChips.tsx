import { cn } from "../lib/utils";

export type FilterChipTone =
  | "primary"
  | "pink"
  | "green"
  | "amber"
  | "blue"
  | "red"
  | "orange"
  | "muted";

export type FilterStatChipOption<T extends string> = {
  value: T;
  label: string;
  count: number;
  tone?: FilterChipTone;
};

const TONE_STYLES: Record<
  FilterChipTone,
  { count: string; countOnPrimary: string; activeChip: string }
> = {
  primary: {
    count: "bg-primary/12 text-primary",
    countOnPrimary: "bg-white/25 text-primary-foreground",
    activeChip: "bg-primary text-primary-foreground border-primary shadow-sm",
  },
  pink: {
    count: "bg-pink-500/10 text-pink-700",
    countOnPrimary: "bg-pink-500/20 text-pink-800",
    activeChip: "bg-pink-500/10 text-foreground border-pink-500/25 ring-1 ring-pink-500/20 shadow-sm",
  },
  green: {
    count: "bg-green-500/10 text-green-700",
    countOnPrimary: "bg-green-500/20 text-green-800",
    activeChip: "bg-green-500/10 text-foreground border-green-500/25 ring-1 ring-green-500/20 shadow-sm",
  },
  amber: {
    count: "bg-amber-500/10 text-amber-700",
    countOnPrimary: "bg-amber-500/20 text-amber-800",
    activeChip: "bg-amber-500/10 text-foreground border-amber-500/25 ring-1 ring-amber-500/20 shadow-sm",
  },
  blue: {
    count: "bg-blue-500/10 text-blue-700",
    countOnPrimary: "bg-blue-500/20 text-blue-800",
    activeChip: "bg-blue-500/10 text-foreground border-blue-500/25 ring-1 ring-blue-500/20 shadow-sm",
  },
  red: {
    count: "bg-red-500/10 text-red-700",
    countOnPrimary: "bg-red-500/20 text-red-800",
    activeChip: "bg-red-500/10 text-foreground border-red-500/25 ring-1 ring-red-500/20 shadow-sm",
  },
  orange: {
    count: "bg-orange-500/10 text-orange-700",
    countOnPrimary: "bg-orange-500/20 text-orange-800",
    activeChip: "bg-orange-500/10 text-foreground border-orange-500/25 ring-1 ring-orange-500/20 shadow-sm",
  },
  muted: {
    count: "bg-muted text-muted-foreground",
    countOnPrimary: "bg-white/25 text-primary-foreground",
    activeChip: "bg-muted text-foreground border-border ring-1 ring-border shadow-sm",
  },
};

interface FilterStatChipsProps<T extends string> {
  options: FilterStatChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterStatChips<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: FilterStatChipsProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2.5", className)}>
      {options.filter(Boolean).map((opt) => {
        const isActive = value === opt.value;
        const tone = opt.tone ?? "primary";
        const styles = TONE_STYLES[tone] ?? TONE_STYLES.primary;

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border",
              isActive
                ? styles.activeChip
                : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground",
            )}
          >
            <span className={isActive && tone === "primary" ? "text-primary-foreground" : undefined}>
              {opt.label}
            </span>
            <span
              className={cn(
                "min-w-[1.5rem] px-2 py-0.5 rounded-full text-xs font-bold tabular-nums text-center",
                isActive ? styles.countOnPrimary : styles.count,
              )}
            >
              {opt.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
