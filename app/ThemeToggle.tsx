"use client";
import { useEffect, useState } from "react";

const THEME_KEY = "raktsetu_theme";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    const isDark = saved === "dark";
    setDark(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");

    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY) {
        const next = e.newValue === "dark";
        setDark(next);
        document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={dark ? "theme-switch is-dark" : "theme-switch"}
      onClick={toggle}
    >
      <span className="ts-track" aria-hidden="true">
        <span className="ts-knob">{dark ? "☾" : "☀"}</span>
        <span className="ts-stick">
          <i className="ts-head" />
          <i className="ts-body" />
          <i className="ts-legs" />
        </span>
        <span className="ts-hole" />
      </span>
    </button>
  );
}
