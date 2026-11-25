import { currentUser } from "@clerk/nextjs/server";
import { getClientCompanyName } from "@/features/clients/queries";
import { avatarTone, displayName, nameInitials } from "@/lib/format";
import { UserMenu } from "./UserMenu";

/**
 * Loads the signed-in person's name on the server, so the avatar menu draws without a flash.
 * In the client portal (`as="client"`) the avatar is the client's company, as in the designs:
 * Thandi M. shows as the peach "BB" square for Brightline Bakery.
 * In the admin area (`as="admin"`) it is the navy "So" square from the admin frame.
 */
export async function UserMenuSlot({ as }: { as?: "client" | "admin" }) {
  const user = await currentUser();
  if (!user) return null;

  if (as === "admin") {
    return (
      <UserMenu
        firstName={user.firstName}
        lastName={user.lastName}
        name={displayName(user)}
        tone="navy"
        companyInitials="So"
      />
    );
  }

  const company = as === "client" ? await getClientCompanyName(user.id) : null;

  return (
    <UserMenu
      firstName={user.firstName}
      lastName={user.lastName}
      name={displayName(user)}
      tone={company ? "peach" : avatarTone(user.id)}
      companyInitials={company ? nameInitials(company) : undefined}
    />
  );
}
