import type { AvatarTone } from "@/components/ui/Avatar";

// How clients look across the agency screens. Safe for client components.

const CLIENT_TONES: AvatarTone[] = ["peach", "green", "blue", "violet", "red"];

/** A client's company square colour, by the order clients were added (Brightline is peach). */
export function clientTone(index: number): AvatarTone {
  return CLIENT_TONES[index % CLIENT_TONES.length];
}

/** "Website redesign", "A and B", "A, B and C". */
export function listWords(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}
