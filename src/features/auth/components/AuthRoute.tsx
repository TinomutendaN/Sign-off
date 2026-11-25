import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getLanding, landingUrl } from "@/lib/auth";
import { displayName } from "@/lib/format";
import { chosenPlanSchema, type ChosenPlan } from "../schemas";
import { AuthScreen } from "./AuthScreen";
import { ContinueSignIn } from "./ContinueSignIn";
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

  return (
    <AuthScreen demo>
      {kind === "sign-up" ? <SignUpForm plan={plan} query={query} /> : <SignInForm query={query} />}
    </AuthScreen>
  );
}
