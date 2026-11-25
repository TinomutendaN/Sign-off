/** A red message under the form when Clerk or a field check says no. */
export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="m-0 rounded-control bg-red-tint px-3 py-2 text-[13px] leading-normal text-red-ink">
      {message}
    </p>
  );
}
