"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export type Profile = { role: "staff" | "admin"; bank_id: string | null };

export function useProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const seqRef = useRef(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      const seq = ++seqRef.current;
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "profiles", u.uid));
        if (seq !== seqRef.current) return;
        setProfile(snap.exists() ? (snap.data() as Profile) : null);
      } catch {
        if (seq !== seqRef.current) return;
        setProfile(null);
      } finally {
        if (seq === seqRef.current) setLoading(false);
      }
    });
    return () => {
      seqRef.current++;
      unsub();
    };
  }, []);

  return { loading, user, profile, signOut: () => fbSignOut(auth) };
}

export function LoginForm({ title, registerHref }: { title: string; registerHref?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setError("Email or password is incorrect.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel narrow" onSubmit={submit}>
      <h1>{title}</h1>
      <label>
        Email
        <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Password
        <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions">
        <button className={busy ? "btn primary signin-door is-busy" : "btn primary signin-door"} disabled={busy}>
          <span className="sd-stick" aria-hidden="true">
            <i className="sd-head" />
            <i className="sd-body" />
          </span>
          <span className="sd-label">{busy ? "Signing in…" : "Sign in"}</span>
          <span className="sd-door" aria-hidden="true">
            <i className="sd-leaf" />
          </span>
        </button>
        {registerHref && <Link className="btn" href={registerHref}>Register blood bank</Link>}
      </div>
    </form>
  );
}
