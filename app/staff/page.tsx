"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { collection, doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db, GROUPS, ago, toIso } from "@/lib/firebase";
import { useProfile, LoginForm } from "@/lib/auth";

const clamp = (n: number) => Math.max(0, Math.min(999, Math.floor(Number.isFinite(n) ? n : 0)));

export default function Staff() {
  const { loading, user, profile, signOut } = useProfile();
  const [bankName, setBankName] = useState("");
  const [approved, setApproved] = useState<boolean | null>(null);
  const [published, setPublished] = useState<string | null>(null);
  const loadedPublishedRef = useRef<string | null>(null);
  const [units, setUnits] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadBank = useCallback(async (bankId: string) => {
    const snap = await getDoc(doc(db, "banks", bankId));
    const data = snap.data() as { name?: string; approved?: boolean; last_published_at?: unknown; stock?: Record<string, number> } | undefined;
    setBankName(data?.name ?? "");
    setApproved(data ? Boolean(data.approved) : null);
    const iso = toIso(data?.last_published_at);
    setPublished(iso);
    loadedPublishedRef.current = iso;
    const next: Record<string, number> = {};
    GROUPS.forEach((g) => (next[g] = clamp(data?.stock?.[g] ?? 0)));
    setUnits(next);
  }, []);

  useEffect(() => {
    if (profile?.bank_id) loadBank(profile.bank_id);
  }, [profile?.bank_id, loadBank]);

  async function publish() {
    if (!profile?.bank_id || !user) return;
    setBusy(true);
    setMsg("");
    setError("");
    const clean: Record<string, number> = {};
    GROUPS.forEach((g) => (clean[g] = clamp(units[g] ?? 0)));
    const bankRef = doc(db, "banks", profile.bank_id);
    const auditRef = doc(collection(db, "audit_log"));

    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(bankRef);
        if (!snap.exists()) throw new Error("NOT_FOUND");
        const currentIso = toIso((snap.data() as { last_published_at?: unknown }).last_published_at);
        if (currentIso !== loadedPublishedRef.current) {
          throw new Error("STALE_CONFLICT");
        }
        tx.update(bankRef, {
          stock: clean,
          last_published_at: serverTimestamp()
        });
        tx.set(auditRef, {
          bank_id: profile.bank_id,
          user_id: user.uid,
          units: clean,
          created_at: serverTimestamp()
        });
      });
      setMsg("Published. Families can see the new stock now.");
      await loadBank(profile.bank_id);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "STALE_CONFLICT") {
        setError("Stock was updated in another tab or device. Reloaded latest numbers — review and publish again.");
        await loadBank(profile.bank_id);
      } else {
        setError("Could not publish. Check your connection and try again.");
      }
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
    if (profile?.role === "admin") {
      return (
        <div className="page panel narrow">
          <h1>Signed in as Administrator</h1>
          <p className="muted">Signed in as {user.email}</p>
          <p>You are signed in with an admin account. Open the Admin portal to approve banks, or sign out to sign in as blood bank staff.</p>
          <div className="actions">
            <a className="btn primary" href="/admin">Go to Admin portal</a>
            <button className="btn" onClick={signOut}>Sign out</button>
          </div>
        </div>
      );
    }
    return (
      <div className="page panel narrow">
        <h1>Account not linked</h1>
        <p className="muted">Signed in as {user.email}</p>
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
        <p className="muted">Signed in as {user.email}</p>
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
            <p className="muted">Signed in as {user.email} · Last published {ago(published)}</p>
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
