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
