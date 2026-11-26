"use client";
import { useEffect, useState } from "react";
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db, GROUPS, ago, toIso } from "@/lib/firebase";
import { useProfile, LoginForm } from "@/lib/auth";

const clamp = (n: number) => Math.max(0, Math.min(999, Math.floor(Number.isFinite(n) ? n : 0)));

export default function Staff() {
  const { loading, user, profile, signOut } = useProfile();
  const [bankName, setBankName] = useState("");
  const [approved, setApproved] = useState<boolean | null>(null);
  const [published, setPublished] = useState<string | null>(null);
  const [units, setUnits] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadBank(bankId: string) {
    const snap = await getDoc(doc(db, "banks", bankId));
    const data = snap.data() as { name?: string; approved?: boolean; last_published_at?: unknown; stock?: Record<string, number> } | undefined;
    setBankName(data?.name ?? "");
    setApproved(data ? Boolean(data.approved) : null);
    setPublished(toIso(data?.last_published_at));
    const next: Record<string, number> = {};
    GROUPS.forEach((g) => (next[g] = clamp(data?.stock?.[g] ?? 0)));
    setUnits(next);
  }

  useEffect(() => {
    if (profile?.bank_id) loadBank(profile.bank_id);
  }, [profile?.bank_id]);

  async function publish() {
    if (!profile?.bank_id || !user) return;
    setBusy(true);
    setMsg("");
    setError("");
    const clean: Record<string, number> = {};
    GROUPS.forEach((g) => (clean[g] = clamp(units[g] ?? 0)));
    try {
      await updateDoc(doc(db, "banks", profile.bank_id), {
        stock: clean,
        last_published_at: serverTimestamp()
      });
      await addDoc(collection(db, "audit_log"), {
        bank_id: profile.bank_id,
        user_id: user.uid,
        units: clean,
        created_at: serverTimestamp()
      });
      setMsg("Published. Families can see the new stock now.");
      await loadBank(profile.bank_id);
    } catch {
      setError("Could not publish. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="page muted">Loading…</p>;
  if (!user) {
    return (
      <div className="page">
        <LoginForm title="Blood bank staff sign in" registerHref="/register" />
      </div>
    );
  }
  if (!profile?.bank_id) {
    return (
      <div className="page panel narrow">
        <h1>Account not linked</h1>
        <p>Your login is not linked to a blood bank yet. Ask the RaktSetu administrator to link it.</p>
        <button className="btn" onClick={signOut}>Sign out</button>
      </div>
    );
  }
  if (approved === false) {
    return (
      <div className="page panel narrow">
        <div className="bank-head">
          <h1>{bankName || "Blood bank"}</h1>
          <span className="badge low">Pending verification</span>
        </div>
        <p style={{ marginTop: 12 }}>
          Your registration is under review. For safety, your blood bank is hidden from the public and stock publishing is disabled until our team verifies your details.
        </p>
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
