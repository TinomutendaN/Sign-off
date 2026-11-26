import { LockIcon, RefreshIcon, UserIcon } from "@/components/icons";

/** The row of three small promises under the plan cards. */
export function PricingTrustRow() {
  const items = [
    { icon: <LockIcon />, text: "Secure payment with Stripe" },
    { icon: <RefreshIcon />, text: "Change or cancel any time" },
    { icon: <UserIcon />, text: "Clients join free" },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-6 px-6 pt-4 pb-1 text-[13px] text-muted">
      {items.map((item) => (
        <span key={item.text} className="flex items-center gap-2">
          {item.icon}
          {item.text}
        </span>
      ))}
    </div>
  );
}
