import { Suspense } from "react";
import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { displayName } from "@/lib/format";

// Step 0 placeholder. Replaced by the Landing screen (01) in Step 4.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">SIGNoFF</h1>
      <Suspense>
        <AuthStatus />
      </Suspense>
    </main>
  );
}

async function AuthStatus() {
  const user = await currentUser();

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="rounded-full bg-violet px-5 py-2.5 text-sm font-semibold text-white"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm text-muted">
      Signed in as {displayName(user)}
      <SignOutButton>
        <button
          type="button"
          className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink"
        >
          Sign out
        </button>
      </SignOutButton>
    </div>
  );
}
