import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blood Bank Staff Portal | RaktSetu Live",
  description: "Sign in as blood bank staff to update and publish live blood unit stock."
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return children;
}
