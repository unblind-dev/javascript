import { dateTime } from "@/datetime/moment_wrapper";

/**
 * The TimeRangeValue should have values as:
 *
 * - [last/past] 4 hours
 * - 4 hours
 * - 1 hour
 * - 3d
 * - 3 days
 * - 10 mins
 */
export type TimeRangeValue = string;

export interface RangeItem {
  label: string;
  badge: string;
  value: TimeRangeValue;
}

export const RELATIVE_RANGES: RangeItem[] = [
  { label: "Past 1 Hour", badge: "1h", value: "1h" },
  { label: "Past 6 Hours", badge: "6h", value: "6h" },
  { label: "Past 1 Day", badge: "1d", value: "1d" },
  { label: "Past 2 Days", badge: "2d", value: "2d" },
  { label: "Past 1 Week", badge: "1w", value: "1w" },
  { label: "Past 1 Month", badge: "1mo", value: "1mo" },
];

export const UNIT_MAP: Record<string, string> = {
  hour: "h",
  hours: "h",
  day: "d",
  days: "d",
  week: "w",
  weeks: "w",
  month: "M",
  months: "M",
  mins: "m",
  minute: "m",
  minutes: "m",
};

const SINGULAR_UNIT_MAP: Record<string, string> = {
  hour: "h",
  day: "d",
  week: "w",
  month: "M",
  year: "y",
  minute: "m",
  min: "m",
};

function unitToSeconds(unit: string): number {
  const map: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
    M: 2592000,
    y: 31536000,
  };
  return map[unit] ?? 1;
}

/**
 * Use a custom translation to Grafana parser.
 *
 * Input -> custom_parser(uses last/past) -> grafana_parser (uses now)
 */
export function parseHumanInput(
  input: string,
): { from: string; to: string } | null {
  const normalized = input.trim().toLowerCase();

  const shorthandMatch = normalized.match(/^(\d+(?:\.\d+)?)(s|m|h|d|w|mo|y)$/);
  if (shorthandMatch) {
    const amount = shorthandMatch[1];
    const unit = shorthandMatch[2] === "mo" ? "M" : shorthandMatch[2];
    return { from: `now-${amount}${unit}`, to: "now" };
  }

  const bareMatch = normalized.match(/^(\d+(?:\.\d+)?)\s+(\w+)$/);
  if (bareMatch) {
    if (!bareMatch[1]) {
      return null;
    }
    const amount = parseFloat(bareMatch[1]);
    const unitKey = bareMatch[2];
    if (!unitKey) {
      return null;
    }
    const unit = UNIT_MAP[unitKey] ?? UNIT_MAP[unitKey.replace(/s$/, "")];
    if (!unit) return null;
    if (!Number.isInteger(amount)) {
      const seconds = Math.round(amount * unitToSeconds(unit));
      return { from: `now-${seconds}s`, to: "now" };
    }
    return { from: `now-${amount}${unit}`, to: "now" };
  }

  const singularMatch = normalized.match(/^(?:past|last)\s+(\w+)$/);
  if (singularMatch) {
    const match = singularMatch[1];
    if (!match) {
      return null;
    }
    const unit = SINGULAR_UNIT_MAP[match];
    if (unit) return { from: `now-1${unit}`, to: "now" };
  }

  const pastMatch = normalized.match(
    /^(?:past|last)\s+(\d+(?:\.\d+)?)\s+(\w+)$/,
  );
  if (pastMatch) {
    const floatVal = pastMatch[1];
    if (!floatVal) return null;
    const amount = parseFloat(floatVal);
    const unitKey = pastMatch[2];
    if (!unitKey) return null;
    const unit = UNIT_MAP[unitKey] ?? UNIT_MAP[unitKey.replace(/s$/, "")];
    if (!unit) return null;
    if (!Number.isInteger(amount)) {
      const seconds = Math.round(amount * unitToSeconds(unit));
      return { from: `now-${seconds}s`, to: "now" };
    }
    return { from: `now-${amount}${unit}`, to: "now" };
  }

  if (normalized === "today") return { from: "now/d", to: "now" };
  if (normalized === "yesterday") return { from: "now-1d/d", to: "now-1d/d" };
  if (normalized === "week to date") return { from: "now/w", to: "now" };
  if (normalized === "previous week")
    return { from: "now-1w/w", to: "now-1w/w" };
  if (normalized === "month to date") return { from: "now/M", to: "now" };
  if (normalized === "previous month")
    return { from: "now-1M/M", to: "now-1M/M" };

  return null;
}

export function parseHumanInputToLabel(raw: { from: string; to: string }) {
  const match = raw.from.match(/^now-(\d+(?:\.\d+)?)([smhdwMy])$/);
  if (match && match[2]) {
    const unitLabel: Record<string, string> = {
      s: "s",
      m: "m",
      h: "h",
      d: "d",
      w: "w",
      M: "mo",
      y: "y",
    };

    return `${match[1]}${unitLabel[match[2]] ?? match[2]}`;
  }
}

function getDynamicBadge(value: TimeRangeValue): string {
  const now = dateTime();
  if (!now) {
    return "-";
  }

  switch (value) {
    case "today": {
      const hours = now.hour && now.hour();
      return hours === 1 ? "1h" : `${hours}h`;
    }
    case "wtd": {
      const days = now.day && now.day();
      return days === 0 ? "<1d" : `${days}d`;
    }
    case "mtd": {
      const days = now.date && now.date() - 1;
      return days === 0 ? "<1d" : `${days}d`;
    }
    case "yesterday":
      return "24h";
    case "prev_week":
      return "7d";
    case "prev_mo":
      return "1mo";
    default:
      return "";
  }
}

export function getCalendarRanges(): RangeItem[] {
  return [
    { label: "Today", badge: getDynamicBadge("today"), value: "today" },
    {
      label: "Yesterday",
      badge: getDynamicBadge("yesterday"),
      value: "yesterday",
    },
    { label: "Week to Date", badge: getDynamicBadge("wtd"), value: "wtd" },
    {
      label: "Previous Week",
      badge: getDynamicBadge("prev_week"),
      value: "prev_week",
    },
    { label: "Month to Date", badge: getDynamicBadge("mtd"), value: "mtd" },
    {
      label: "Previous Month",
      badge: getDynamicBadge("prev_mo"),
      value: "prev_mo",
    },
  ];
}

function formatTimestamp(
  ts: number,
  timezone: string,
  showYear: boolean,
): string {
  const date = new Date(ts);

  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(showYear ? { year: "numeric" } : {}),
    timeZone: timezone,
  });

  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: timezone,
  });

  return `${datePart}, ${timePart}`;
}

function isSameDay(a: number, b: number, timeZone: string): boolean {
  const dateA = new Date(a).toLocaleDateString("en-US", { timeZone });
  const dateB = new Date(b).toLocaleDateString("en-US", { timeZone });
  return dateA === dateB;
}

function isSameYear(a: number, b: number, timeZone: string): boolean {
  const yearA = new Date(a).toLocaleDateString("en-US", {
    year: "numeric",
    timeZone,
  });
  const yearB = new Date(b).toLocaleDateString("en-US", {
    year: "numeric",
    timeZone,
  });
  return yearA === yearB;
}

/**
 * We are focusing on en-US for now.
 */
export function formatTimeRangeLabel(
  startTime: number,
  endTime: number,
  timezone?: string,
): string {
  const tz = timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const showYear = !isSameYear(startTime, endTime, tz);

  if (isSameDay(startTime, endTime, tz)) {
    const datePart = new Date(startTime).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(showYear ? { year: "numeric" } : {}),
      timeZone: tz,
    });
    const startTime_ = new Date(startTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: tz,
    });
    const endTime_ = new Date(endTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: tz,
    });
    return `${datePart}, ${startTime_} to ${endTime_}`;
  }

  const startStr = formatTimestamp(startTime, tz, showYear);
  const endStr = formatTimestamp(endTime, tz, showYear);
  return `${startStr} to ${endStr}`;
}
