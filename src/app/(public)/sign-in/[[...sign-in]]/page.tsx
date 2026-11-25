import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

// Step 0: plain Clerk sign-in. Step 3 builds the Sign in screen (03) around it.
export default function SignInPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Suspense>
        {/* TODO(Step 3): send each role to its own home (/dashboard, /portal, /admin). */}
        <SignIn fallbackRedirectUrl="/dashboard" />
      </Suspense>
    </main>
  );
}
