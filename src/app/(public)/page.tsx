import { Suspense } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

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
  const { userId } = await auth();

  if (!userId) {
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
      Signed in
      <UserButton />
    </div>
  );
}
