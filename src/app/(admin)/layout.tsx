import { AdminFrame } from "@/components/frames/AdminFrame";

// TODO(Step 3): requireAdmin() — the signed-in user is in ADMIN_USER_IDS.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminFrame>{children}</AdminFrame>;
}
