import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";

// Step 0: plain Clerk sign-up. Step 3 builds the Sign in screen (03) around it.
export default function SignUpPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Suspense>
        <SignUp />
      </Suspense>
    </main>
  );
}
