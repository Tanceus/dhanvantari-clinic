const MOCK_DELAY_MS = 280;

export function delay<T>(data: T, ms = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export function isSameDay(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatTime(
  isoString: string,
  locale: string,
  timezone: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(new Date(isoString));
}

export function formatDate(
  date: Date,
  locale: string,
  timezone: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  }).format(date);
}

export function formatShortDate(
  isoString: string,
  locale: string,
  timezone: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(isoString));
}

export function formatDateTime(
  isoString: string,
  locale: string,
  timezone: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  }).format(new Date(isoString));
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function prakritiIncludesDosha(
  prakriti: string,
  dosha: "Vata" | "Pitta" | "Kapha",
): boolean {
  return prakriti.includes(dosha);
}

export function parsePrakritiDoshas(prakriti: string): string[] {
  if (prakriti === "Vata" || prakriti === "Pitta" || prakriti === "Kapha") {
    return [prakriti];
  }
  return prakriti.split("-").filter(Boolean);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function getDateKeyInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isSameDayInTimezone(
  isoString: string,
  compareDate: Date,
  timezone: string,
): boolean {
  return (
    getDateKeyInTimezone(new Date(isoString), timezone) ===
    getDateKeyInTimezone(compareDate, timezone)
  );
}

export function formatAgendaDate(
  date: Date,
  locale: string,
  timezone: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  }).format(date);
}

export function formatGroupDate(
  isoString: string,
  locale: string,
  timezone: string,
): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  }).format(new Date(isoString));
}

export function combineDateAndTime(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  return dt.toISOString();
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toDateInputValue(date: Date, timezone: string): string {
  return getDateKeyInTimezone(date, timezone);
}
