import { getNextVisitDisplay } from "../utils/nextVisitUrgency";

export function NextVisitCell({
  nextVisit,
  emptyLabel = "Not scheduled",
}: {
  nextVisit?: string | null;
  emptyLabel?: string;
}) {
  const { dateLabel, badgeLabel, badgeClass } = getNextVisitDisplay(nextVisit);

  if (dateLabel === "Not scheduled") {
    return <span className="text-sm text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-sm text-foreground whitespace-nowrap">{dateLabel}</span>
      {badgeLabel && (
        <span className={`inline-flex w-fit px-2 py-0.5 text-[10px] font-semibold rounded-full ${badgeClass}`}>
          {badgeLabel}
        </span>
      )}
    </div>
  );
}
