import type { Metadata, Viewport } from "next";
import Link from "next/link";
import HeaderNav from "./HeaderNav";
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
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <html lang="en">
      <body>
        <HeaderNav />
        <main>{children}</main>
        <footer className="foot">
          <p>
            RaktSetu Live shows stock reported by blood banks. Always call the bank to confirm before travelling,
            and confirm blood group compatibility with a doctor.
          </p>
          <nav className="foot-links" aria-label="Footer navigation">
            <Link href="/">Home</Link>
            <Link href="/find">Find blood</Link>
            <Link href="/staff">For blood banks</Link>
            <Link href="/register">Register bank</Link>
            <Link href="/admin">Admin</Link>
            {contact && <a href={`mailto:${contact}`}>{contact}</a>}
          </nav>
          <p className="foot-copy">&copy; {new Date().getFullYear()} RaktSetu Live</p>
        </footer>
      </body>
    </html>
  );
}
