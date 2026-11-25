import { Suspense } from "react";
import { AuthRoute } from "@/features/auth/components/AuthRoute";

// 03 Sign in ("Create account" tab) + demo role cards. /sign-up?plan=pro&period=annual shows the plan note.
export default function SignUpPage({ params, searchParams }: PageProps<"/sign-up/[[...sign-up]]">) {
  return (
    <Suspense fallback={null}>
      <AuthRoute kind="sign-up" params={params} searchParams={searchParams} />
    </Suspense>
  );
}
