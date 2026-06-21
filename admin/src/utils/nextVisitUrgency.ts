export type NextVisitUrgency = "none" | "normal" | "soon" | "tomorrow" | "today" | "overdue";

export interface NextVisitDisplay {
  dateLabel: string;
  badgeLabel: string | null;
  badgeClass: string;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function getNextVisitDisplay(nextVisit?: string | null): NextVisitDisplay {
  if (!nextVisit) {
    return { dateLabel: "Not scheduled", badgeLabel: null, badgeClass: "" };
  }

  const date = new Date(nextVisit);
  if (Number.isNaN(date.getTime())) {
    return { dateLabel: "—", badgeLabel: null, badgeClass: "" };
  }

  const dateLabel = date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const today = startOfDay(new Date());
  const visitDay = startOfDay(date);
  const diffDays = Math.round((visitDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      dateLabel,
      badgeLabel: "Overdue",
      badgeClass: "bg-red-500/10 text-red-600 border border-red-500/30",
    };
  }
  if (diffDays === 0) {
    return {
      dateLabel,
      badgeLabel: "Today",
      badgeClass: "bg-orange-500/10 text-orange-600 border border-orange-500/30",
    };
  }
  if (diffDays === 1) {
    return {
      dateLabel,
      badgeLabel: "Tomorrow",
      badgeClass: "bg-amber-500/10 text-amber-700 border border-amber-500/30",
    };
  }
  if (diffDays <= 7) {
    return {
      dateLabel,
      badgeLabel: "This week",
      badgeClass: "bg-yellow-500/10 text-yellow-800 border border-yellow-500/25",
    };
  }

  return { dateLabel, badgeLabel: null, badgeClass: "" };
}
