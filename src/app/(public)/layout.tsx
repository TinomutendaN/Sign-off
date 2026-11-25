import { PublicFrame } from "@/components/frames/PublicFrame";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicFrame>{children}</PublicFrame>;
}
