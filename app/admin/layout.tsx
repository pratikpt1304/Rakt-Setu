import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Verification | RaktSetu Live",
  description: "Review, verify, and approve registered blood banks before they appear publicly."
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
