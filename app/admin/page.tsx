"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase, ago } from "@/lib/supabase";
import { useProfile, LoginForm } from "@/lib/auth";

type Row = { id: string; name: string; area: string; phone: string; approved: boolean; last_published_at: string | null };

export default function Admin() {
  const { loading, user, profile, signOut } = useProfile();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("banks")
      .select("id,name,area,phone,approved,last_published_at")
      .order("created_at", { ascending: false });
    if (err) setError("Could not load banks.");
    else setRows((data ?? []) as Row[]);
  }, []);

  useEffect(() => {
    if (profile?.role === "admin") load();
  }, [profile?.role, load]);

  async function toggle(r: Row) {
    setError("");
    const { error: err } = await supabase.from("banks").update({ approved: !r.approved }).eq("id", r.id);
    if (err) setError("Could not update this bank.");
    else load();
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
        <p className="muted">Only approved banks appear to the public. Add banks and link staff logins in the Supabase SQL editor (see README).</p>
        {error && <p className="error" role="alert">{error}</p>}
        <ul className="adminlist">
          {rows.map((r) => (
            <li key={r.id}>
              <div>
                <b>{r.name}</b>
                <p className="muted">{r.area}, {r.phone}. Last published {ago(r.last_published_at)}</p>
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
