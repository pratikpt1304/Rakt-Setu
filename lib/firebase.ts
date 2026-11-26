import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "localhost",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? ""
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "default");

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

export function toIso(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === "object" && val !== null && "toDate" in val && typeof (val as { toDate: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
