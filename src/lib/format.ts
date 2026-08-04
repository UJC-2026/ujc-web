const RELATIVE = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/** "3 hari lalu" — falls back to an absolute date beyond a year. */
export function relativeTime(value: string | Date) {
  const date = new Date(value);
  const seconds = (date.getTime() - Date.now()) / 1000;
  const absolute = Math.abs(seconds);

  if (absolute < 45) return "baru saja";

  for (const [unit, unitSeconds] of UNITS) {
    if (absolute >= unitSeconds) {
      return RELATIVE.format(Math.round(seconds / unitSeconds), unit);
    }
  }

  return RELATIVE.format(Math.round(seconds / 60), "minute");
}

export function formatDateTimeID(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

/** For date-only columns, where rendering a time would be meaningless. */
export function formatDateID(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
    new Date(value),
  );
}
