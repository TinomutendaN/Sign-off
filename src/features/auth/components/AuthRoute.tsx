import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getClientInviteContext } from "@/features/clients/queries";
import { getWorkspaceSummary } from "@/features/workspaces/queries";
import { getLanding, landingUrl } from "@/lib/auth";
import { displayName } from "@/lib/format";
import { chosenPlanSchema, type ChosenPlan } from "../schemas";
import { AuthScreen } from "./AuthScreen";
import { ContinueSignIn } from "./ContinueSignIn";
import { InviteAccept } from "./InviteAccept";
import { InviteSignUpForm } from "./InviteSignUpForm";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";
import { WorkspaceForm } from "./WorkspaceForm";

type SearchParams = Record<string, string | string[] | undefined>;

type AuthRouteProps = {
  kind: "sign-in" | "sign-up";
  params: Promise<Record<string, string[] | undefined>>;
  searchParams: Promise<SearchParams>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** /sign-up?plan=pro&period=annual → the plan note. Anything else → no note. */
function parsePlan(search: SearchParams): ChosenPlan | null {
  const parsed = chosenPlanSchema.safeParse({
    plan: first(search.plan),
    period: first(search.period) ?? "annual",
  });
  return parsed.success ? parsed.data : null;
}

/**
 * Decides what /sign-in and /sign-up show:
 * - /sign-in/continue: the step after signing in that opens the right area
 * - signed in: straight to their own area, or "Create your workspace" if they have none
 * - signed out: the Create account / Sign in forms and the demo cards
 */
export async function AuthRoute({ kind, params, searchParams }: AuthRouteProps) {
  const [segments, search, session] = await Promise.all([
    params,
    searchParams,
    auth({ treatPendingAsSignedOut: false }),
  ]);
  const step = segments[kind]?.[0];
  const plan = parsePlan(search);
  const query = plan ? `?plan=${plan.plan}&period=${plan.period}` : "";

  if (kind === "sign-in" && step === "continue") {
    if (!session.userId) redirect("/sign-in");
    return (
      <AuthScreen>
        <ContinueSignIn />
      </AuthScreen>
    );
  }

  if (session.userId) {
    const landing = await getLanding();
    if (kind === "sign-in" || landing.path !== "/sign-up") redirect(`${landingUrl(landing, session.orgId)}${query}`);

    const user = await currentUser();
    const saved = user?.unsafeMetadata.workspaceName;
    return (
      <AuthScreen>
        <WorkspaceForm
          plan={plan}
          defaultName={typeof saved === "string" ? saved : ""}
          personName={user ? displayName(user) : "your account"}
        />
      </AuthScreen>
    );
  }

  const ticket = first(search.__clerk_ticket);
  if (ticket && first(search.__clerk_status) !== "complete") {
    return <AuthScreen>{await invitation(ticket, search)}</AuthScreen>;
  }

  return (
    <AuthScreen demo>
      {kind === "sign-up" ? <SignUpForm plan={plan} query={query} /> : <SignInForm query={query} />}
    </AuthScreen>
  );
}

/**
 * The invitation link (Clerk adds __clerk_ticket and __clerk_status to our redirect URL).
 * /sign-up?client={id}: a client portal invite. /sign-up?invite=team&org={id}: a team invite.
 * Not designed, so it stays inside the Sign in layout, without the demo panel.
 */
async function invitation(ticket: string, search: SearchParams) {
  const clientId = first(search.client);
  const orgId = first(search.org);
  const client = clientId ? await getClientInviteContext(clientId) : null;
  const workspace =
    !client && orgId?.startsWith("org_") ? await getWorkspaceSummary(orgId).catch(() => null) : null;

  if (first(search.__clerk_status) === "sign_in") {
    const what = client
      ? `Sign in to see ${client.projectName} from ${client.agencyName}.`
      : `Sign in to join ${workspace?.name ?? "your team"}.`;
    return <InviteAccept ticket={ticket} subtitle={`You already have a SIGNoFF account. ${what}`} />;
  }

  if (client) {
    return (
      <InviteSignUpForm
        ticket={ticket}
        title="Open your client portal"
        subtitle={`${client.agencyName} shared ${client.projectName} with ${client.company}. Create your account to see it.`}
        email={client.email}
        submitLabel="Create account and open portal"
      />
    );
  }

  return (
    <InviteSignUpForm
      ticket={ticket}
      title={workspace ? `Join ${workspace.name}` : "Join your team"}
      subtitle="You've been invited to the team. Create your account to accept."
      email={null}
      submitLabel="Create account and join"
    />
  );
}
