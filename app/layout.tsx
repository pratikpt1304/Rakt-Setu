import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "RaktSetu Live: find blood nearby",
  description: "See which nearby blood banks have the blood group you need, and when they last updated.",
  openGraph: {
    title: "RaktSetu Live: find blood nearby",
    description: "See which nearby blood banks have the blood group you need, and when they last updated.",
    type: "website"
  }
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#b3202f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="top">
          <Link href="/" className="brand">Rakt<span>Setu</span> Live</Link>
          <nav>
            <Link href="/find">Find blood</Link>
            <Link href="/staff">For blood banks</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="foot">
          RaktSetu Live shows stock reported by blood banks. Always call the bank to confirm before travelling,
          and confirm blood group compatibility with a doctor.
        </footer>
      </body>
    </html>
  );
}
