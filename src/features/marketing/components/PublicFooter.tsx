import Link from "next/link";

/** Landing footer: name, Pricing, Sign in, copyright. */
export function PublicFooter() {
  return (
    <footer className="mx-auto mt-5 mb-4 flex w-full max-w-[1180px] flex-wrap items-center gap-4 px-2 text-[13px] text-muted">
      <span className="font-semibold text-ink">SIGNoFF</span>
      <span className="flex-1" />
      <Link href="/pricing" className="text-muted">
        Pricing
      </Link>
      <Link href="/sign-in" className="text-muted">
        Sign in
      </Link>
      <span>© 2026 SIGNoFF</span>
    </footer>
  );
}
