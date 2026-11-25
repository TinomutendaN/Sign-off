import { Suspense } from "react";
import { AuthRoute } from "@/features/auth/components/AuthRoute";

// 03 Sign in ("Sign in" tab) + demo role cards. /sign-in/continue opens the right area after signing in.
export default function SignInPage({ params, searchParams }: PageProps<"/sign-in/[[...sign-in]]">) {
  return (
    <Suspense fallback={null}>
      <AuthRoute kind="sign-in" params={params} searchParams={searchParams} />
    </Suspense>
  );
}
