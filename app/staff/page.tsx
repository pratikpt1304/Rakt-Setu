"use client";
import { useEffect, useState } from "react";
import { supabase, GROUPS, ago } from "@/lib/supabase";
import { useProfile, LoginForm } from "@/lib/auth";

const clamp = (n: number) => Math.max(0, Math.min(999, Math.floor(Number.isFinite(n) ? n : 0)));

export default function Staff() {
  const { loading, user, profile, signOut } = useProfile();
  const [bankName, setBankName] = useState("");
  const [published, setPublished] = useState<string | null>(null);
  const [units, setUnits] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadBank(bankId: string) {
    const [{ data: b }, { data: s }] = await Promise.all([
      supabase.from("banks").select("name,last_published_at").eq("id", bankId).single(),
      supabase.from("stock").select("grp,units").eq("bank_id", bankId)
    ]);
    setBankName(b?.name ?? "");
    setPublished(b?.last_published_at ?? null);
    const next: Record<string, number> = {};
    GROUPS.forEach((g) => (next[g] = 0));
    (s ?? []).forEach((r: { grp: string; units: number }) => (next[r.grp] = r.units));
    setUnits(next);
  }

  useEffect(() => {
    if (profile?.bank_id) loadBank(profile.bank_id);
  }, [profile?.bank_id]);

  async function publish() {
    if (!profile?.bank_id) return;
    setBusy(true);
    setMsg("");
    setError("");
    const { error: err } = await supabase.rpc("publish_stock", { p_units: units });
    if (err) setError("Could not publish. Check your connection and try again.");
    else {
      setMsg("Published. Families can see the new stock now.");
      await loadBank(profile.bank_id);
    }
    setBusy(false);
  }

  if (loading) return <p className="page muted">Loading…</p>;
  if (!user) return <div className="page"><LoginForm title="Blood bank staff sign in" /></div>;
  if (!profile?.bank_id) {
    return (
      <div className="page panel narrow">
        <h1>Account not linked</h1>
        <p>Your login is not linked to a blood bank yet. Ask the RaktSetu administrator to link it.</p>
        <button className="btn" onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="panel">
        <div className="bank-head">
          <div>
            <h1>{bankName}</h1>
            <p className="muted">Last published {ago(published)}</p>
          </div>
          <button className="btn" onClick={signOut}>Sign out</button>
        </div>
        <p>Enter the units in stock today, then publish. Families see these numbers straight away.</p>
        <div className="stockgrid">
          {GROUPS.map((g) => (
            <label key={g} className="stockcell">
              <b>{g}</b>
              <div>
                <button type="button" aria-label={`Decrease ${g}`} onClick={() => setUnits({ ...units, [g]: clamp((units[g] ?? 0) - 1) })}>−</button>
                <input
                  inputMode="numeric"
                  value={units[g] ?? 0}
                  onChange={(e) => setUnits({ ...units, [g]: clamp(Number(e.target.value)) })}
                />
                <button type="button" aria-label={`Increase ${g}`} onClick={() => setUnits({ ...units, [g]: clamp((units[g] ?? 0) + 1) })}>+</button>
              </div>
            </label>
          ))}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        {msg && <p className="ok-msg" role="status">{msg}</p>}
        <button className="btn primary" onClick={publish} disabled={busy}>{busy ? "Publishing…" : "Publish stock"}</button>
      </section>
    </div>
  );
}
