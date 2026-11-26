"use client";
import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { db, ago, toIso } from "@/lib/firebase";
import { useProfile, LoginForm } from "@/lib/auth";

type Row = { id: string; name: string; area: string; address: string | null; phone: string; approved: boolean; last_published_at: string | null };

export default function Admin() {
  const { loading, user, profile, signOut } = useProfile();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db, "banks"), orderBy("created_at", "desc")));
      const mapped = snap.docs.map((d) => {
        const data = d.data() as { name: string; area: string; address?: string | null; phone: string; approved: boolean; last_published_at?: unknown };
        return {
          id: d.id,
          name: data.name,
          area: data.area,
          address: data.address ?? null,
          phone: data.phone,
          approved: Boolean(data.approved),
          last_published_at: toIso(data.last_published_at)
        };
      });
      // Show unverified banks first so team can review them immediately.
      mapped.sort((a, b) => Number(a.approved) - Number(b.approved));
      setRows(mapped);
      setError("");
    } catch {
      setError("Could not load banks.");
    }
  }, []);

  useEffect(() => {
    if (profile?.role === "admin") load();
  }, [profile?.role, load]);

  async function toggle(r: Row) {
    setError("");
    try {
      await updateDoc(doc(db, "banks", r.id), { approved: !r.approved });
      load();
    } catch {
      setError("Could not update this bank.");
    }
  }

  if (loading) return <p className="page muted">Loading…</p>;
  if (!user) return <div className="page"><LoginForm title="Administrator sign in" /></div>;
  if (profile?.role !== "admin") {
    return (
      <div className="page panel narrow">
        <h1>Administrators only</h1>
        <p>This account does not have administrator access.</p>
        <button className="btn" onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="panel">
        <div className="bank-head">
          <h1>Blood banks</h1>
          <button className="btn" onClick={signOut}>Sign out</button>
        </div>
        <p className="muted">Only approved banks appear to the public. Verify new registrations before approving.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <ul className="adminlist">
          {rows.map((r) => (
            <li key={r.id}>
              <div>
                <b>{r.name}</b>{" "}
                <span className={`badge ${r.approved ? "ok" : "low"}`} style={{ fontSize: 12, padding: "2px 8px" }}>
                  {r.approved ? "Approved" : "Pending verification"}
                </span>
                <p className="muted">
                  {r.area}{r.address ? ` · ${r.address}` : ""} · {r.phone}. Last published {ago(r.last_published_at)}
                </p>
              </div>
              <button className={r.approved ? "btn" : "btn primary"} onClick={() => toggle(r)}>
                {r.approved ? "Hide from public" : "Approve"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
