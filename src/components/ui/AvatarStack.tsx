import { displayName } from "@/lib/format";
import { Avatar, type AvatarPerson, type AvatarTone } from "./Avatar";

type AvatarStackProps = {
  people: (AvatarPerson & { id: string; tone?: AvatarTone })[];
  size?: 26 | 28 | 32;
};

/** Overlapping avatars with a 2 px white ring (−8 px overlap). */
export function AvatarStack({ people, size = 32 }: AvatarStackProps) {
  return (
    <div className="flex items-center pl-2">
      {people.map((p) => (
        <span key={p.id} title={displayName(p)} className="-ml-2 flex">
          <Avatar person={p} tone={p.tone} size={size} ring />
        </span>
      ))}
    </div>
  );
}
