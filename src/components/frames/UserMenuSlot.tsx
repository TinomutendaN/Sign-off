import { currentUser } from "@clerk/nextjs/server";
import { avatarTone, displayName } from "@/lib/format";
import { UserMenu } from "./UserMenu";

/** Loads the signed-in person's name on the server, so the avatar menu draws without a flash. */
export async function UserMenuSlot() {
  const user = await currentUser();
  if (!user) return null;
  return (
    <UserMenu
      firstName={user.firstName}
      lastName={user.lastName}
      name={displayName(user)}
      tone={avatarTone(user.id)}
    />
  );
}
