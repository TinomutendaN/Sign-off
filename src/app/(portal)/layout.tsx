import { ClientFrame } from "@/components/frames/ClientFrame";

// TODO(Step 3): requireClient() — signed in with ClientAccess.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <ClientFrame>{children}</ClientFrame>;
}
