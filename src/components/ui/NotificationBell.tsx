import { BellIcon } from "@/components/icons";

/** The header bell with its red dot. Notifications arrive in a later step; it's shown as designed. */
export function NotificationBell() {
  return (
    <span role="img" aria-label="Notifications" className="relative flex size-9 shrink-0 items-center justify-center rounded-control text-muted">
      <BellIcon />
      <span className="absolute top-[7px] right-2 size-[7px] rounded-full border-[1.5px] border-card bg-alert" />
    </span>
  );
}
