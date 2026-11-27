import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Blood Nearby | RaktSetu Live",
  description: "Check live blood unit availability by blood group and distance, and call nearby blood banks directly."
};

export default function FindLayout({ children }: { children: React.ReactNode }) {
  return children;
}
