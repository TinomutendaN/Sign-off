import { getDemoCards } from "../queries";
import { DemoPanel } from "./DemoPanel";

/** Loads the demo people's names from Clerk, then draws the "Try the demo" panel. */
export async function DemoSection() {
  const cards = await getDemoCards();
  return <DemoPanel cards={cards} />;
}
