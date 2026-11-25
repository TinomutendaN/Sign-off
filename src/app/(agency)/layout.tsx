import { AgencyFrame } from "@/components/frames/AgencyFrame";

// TODO(Step 3): requireRole() — signed in, in a workspace, Owner or Team member.
export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return <AgencyFrame>{children}</AgencyFrame>;
}
