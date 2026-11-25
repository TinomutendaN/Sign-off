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

/** Dollars without needless cents: 190 → "$190", 15.833… → "$15.83". */
export function money(amount: number): string {
  return `$${amount.toFixed(2).replace(/\.00$/, "")}`;
}

/** Two-letter initials for a workspace or client name: "Northfold Studio" → "NS". */
export function nameInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}
