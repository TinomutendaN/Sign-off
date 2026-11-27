// Shared formatting. Names follow the house rule: first name + last initial ("Leo R.").

type NameParts = { firstName?: string | null; lastName?: string | null };

function clean(value?: string | null): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

/** First name only, for greetings: "Tinomutenda". */
export function firstName(person: NameParts): string {
  return clean(person.firstName) || "there";
}

/** First name plus last initial with a full stop: "Tinomutenda N.". */
export function displayName(person: NameParts): string {
  const first = clean(person.firstName);
  const last = clean(person.lastName);
  const lastInitial = last ? `${last[0].toUpperCase()}.` : "";
  return [first, lastInitial].filter(Boolean).join(" ") || "Unknown";
}

/** Avatar initials from the same two parts: "TN". */
export function initials(person: NameParts): string {
  const first = clean(person.firstName);
  const last = clean(person.lastName);
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}

export type AvatarTone = "violet" | "green" | "red" | "blue";

const TONES: AvatarTone[] = ["violet", "green", "red", "blue"];

/**
 * A stable avatar colour for a Clerk user. The demo team keeps the colours from the
 * designs (TM violet, AK green, LR pink, JS blue); everyone else gets one from their ID.
 * Server-side only: the demo IDs come from the environment.
 */
export function avatarTone(userId: string): AvatarTone {
  const demo: Record<string, AvatarTone> = {};
  const set = (id: string | undefined, tone: AvatarTone) => {
    if (id) demo[id] = tone;
  };
  set(process.env.DEMO_OWNER_USER_ID, "violet");
  set(process.env.DEMO_AMA_USER_ID, "green");
  set(process.env.DEMO_LEO_USER_ID, "red");
  set(process.env.DEMO_JEN_USER_ID, "blue");
  if (demo[userId]) return demo[userId];

  let hash = 0;
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length];
}

/** Dollars without needless cents: 19 → "$19", 189.96 → "$189.96", 15.83 → "$15.83". */
export function money(amount: number): string {
  return `$${amount.toFixed(2).replace(/\.00$/, "")}`;
}

/** Whole dollars from cents, with thousands separators: 489810 → "$4,898". */
export function dollars(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

/** Dollars and cents from cents, always two decimals: 4900 → "$49.00", 1583 → "$15.83". */
export function dollarsCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** A ratio as a percentage with one decimal: 0.0821 → "8.2%". */
export function percent1(ratio: number): string {
  return `${(Math.round(ratio * 1000) / 10).toFixed(1)}%`;
}

/** Two-letter initials for a workspace or client name: "Northfold Studio" → "NS". */
export function nameInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

// ---------- Dates (shown in the studio's time zone, like the seed) ----------

const TIME_ZONE = "Africa/Harare";

function parts(date: Date) {
  const get = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, ...opts }).format(date);
  return { day: get({ day: "numeric" }), month: monthShort(date), year: get({ year: "numeric" }) };
}

/** "2 Dec" */
export function shortDate(date: Date): string {
  const p = parts(date);
  return `${p.day} ${p.month}`;
}

/** "Sep", "Nov": three-letter month in studio time (en-GB would say "Sept"). */
export function monthShort(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, month: "short" }).format(date);
}

/** "October" in studio time. */
export function monthLong(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, month: "long" }).format(date);
}

/** "2 Sep" this year, "2 Sep 2025" in any other year. */
export function shortDateYear(date: Date, now: Date = new Date()): string {
  const p = parts(date);
  const label = `${p.day} ${p.month}`;
  return p.year === parts(now).year ? label : `${label} ${p.year}`;
}

/** "14:32" in studio time. */
export function clockTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

/** "12 Dec 2026" */
export function longDate(date: Date): string {
  const p = parts(date);
  return `${p.day} ${p.month} ${p.year}`;
}

/** "Today, 14:20" or "22 Nov, 15:40" */
export function dateTime(date: Date, now: Date = new Date()): string {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  const sameDay = longDate(date) === longDate(now);
  return `${sameDay ? "Today" : shortDate(date)}, ${time}`;
}

/** "Thu 26 Nov" */
export function weekdayDate(date: Date): string {
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, weekday: "short" }).format(date);
  return `${weekday} ${shortDate(date)}`;
}

/** "Thursday, 26 November" */
export function longDay(date: Date): string {
  const get = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, ...opts }).format(date);
  return `${get({ weekday: "long" })}, ${get({ day: "numeric" })} ${get({ month: "long" })}`;
}

/** "Good morning" before 12:00, "Good afternoon" before 17:00, then "Good evening" (studio time). */
export function greeting(now: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", hour12: false }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight at the start of a date's day in the studio's time zone. */
function startOfDay(date: Date): Date {
  return new Date(`${toDateInput(date)}T00:00:00+02:00`); // Harare has no daylight saving
}

/** The Dashboard's "this week": today 00:00 to the end of today + 6 days, studio time. */
export function next7Days(now: Date = new Date()): { start: Date; end: Date } {
  const start = startOfDay(now);
  return { start, end: new Date(start.getTime() + 7 * DAY_MS - 1) };
}

/** Whole calendar days from `from` to `to` in studio time: sent yesterday → 1. */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

/** The "2026-11-28" value a date field shows for a stored date (studio time zone). */
export function toDateInput(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

/** A date field's "2026-11-28" → that day at 09:00 studio time, the same time the seed uses. */
export function fromDateInput(ymd: string): Date {
  return new Date(`${ymd}T09:00:00+02:00`); // Harare has no daylight saving
}

/** File sizes as the designs write them: "46 KB", "3.1 MB". */
export function fileSize(bytes: number): string {
  const KB = 1024;
  const MB = KB * 1024;
  if (bytes >= MB) return `${(bytes / MB).toFixed(1).replace(/\.0$/, "")} MB`;
  return `${Math.max(1, Math.round(bytes / KB))} KB`;
}
