"use client";
import { useState } from "react";
import Link from "next/link";

export default function HeaderNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="top">
      <div className="top-bar">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          Rakt<span>Setu</span> Live
        </Link>
        <button
          type="button"
          className="menu-btn"
          aria-expanded={open}
          aria-controls="main-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      <nav id="main-nav" className={open ? "nav-links open" : "nav-links"} aria-label="Main navigation">
        <Link href="/find" onClick={() => setOpen(false)}>Find blood</Link>
        <Link href="/staff" onClick={() => setOpen(false)}>For blood banks</Link>
        <Link href="/register" onClick={() => setOpen(false)}>Register bank</Link>
      </nav>
    </header>
  );
}
