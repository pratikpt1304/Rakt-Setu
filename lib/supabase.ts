import { createClient } from "@supabase/supabase-js";

// Placeholders let the app build without secrets; real values come from .env.local.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "public-anon-key";

export const supabase = createClient(url, key);

export const GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
export type Group = (typeof GROUPS)[number];

export type Bank = {
  id: string;
  name: string;
  area: string;
  address: string | null;
  phone: string;
  lat: number;
  lng: number;
  units: number;
  last_published_at: string | null;
  distance_km: number;
  all_stock: Record<string, number> | null;
};

export const STALE_HOURS = 6;

export function minutesSince(ts: string | null): number | null {
  return ts ? Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000)) : null;
}

export function ago(ts: string | null): string {
  const m = minutesSince(ts);
  if (m === null) return "never";
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.floor(h / 24)} d ago`;
}

export function isStale(ts: string | null): boolean {
  const m = minutesSince(ts);
  return m === null || m > STALE_HOURS * 60;
}

export const level = (n: number) => (n === 0 ? "out" : n < 5 ? "low" : "ok");

export const COMPAT: Record<Group, string> = {
  "A+": "Can also receive A-, O+, O-",
  "A-": "Can also receive O-",
  "B+": "Can also receive B-, O+, O-",
  "B-": "Can also receive O-",
  "O+": "Can also receive O-",
  "O-": "Can only receive O-",
  "AB+": "Can receive any group",
  "AB-": "Can also receive A-, B-, O-"
};
