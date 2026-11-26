"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, GROUPS } from "@/lib/firebase";

export default function RegisterBank() {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("This device cannot share its location. Enter coordinates or pick your area.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLat(p.coords.latitude.toFixed(6));
        setLng(p.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setError("Location access was blocked. Pick your area or enter coordinates.");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (name.trim().length < 2) {
      setError("Enter the full blood bank name.");
      return;
    }
    if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90 || !Number.isFinite(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      setError("Enter valid latitude and longitude coordinates.");
      return;
    }

    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const bankRef = doc(collection(db, "banks"));
      const emptyStock: Record<string, number> = {};
      GROUPS.forEach((g) => (emptyStock[g] = 0));

      await setDoc(bankRef, {
        name: name.trim(),
        area: area.trim(),
        address: address.trim() || null,
        phone: phone.trim(),
        lat: parsedLat,
        lng: parsedLng,
        approved: false,
        owner_uid: cred.user.uid,
        last_published_at: null,
        created_at: serverTimestamp(),
        stock: emptyStock
      });

      await setDoc(doc(db, "profiles", cred.user.uid), {
        role: "staff",
        bank_id: bankRef.id
      });

      setDone(true);
    } catch (err: unknown) {
      const code = typeof err === "object" && err !== null && "code" in err ? String((err as { code: unknown }).code) : "";
      if (code === "auth/email-already-in-use") {
        setError("This email is already registered. Sign in on the staff page instead.");
      } else if (code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError("Could not submit registration. Check your details and try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="page panel narrow">
        <h1>Registration submitted</h1>
        <p className="ok-msg" role="status">
          Your blood bank is waiting for verification.
        </p>
        <p>
          For safety, new blood banks do not appear on RaktSetu Live until our team verifies your bank details and official counter phone number.
        </p>
        <div className="actions">
          <Link className="btn primary" href="/staff">Go to staff portal</Link>
          <Link className="btn" href="/">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <form className="panel narrow" onSubmit={submit}>
        <h1>Register your blood bank</h1>
        <p className="muted">
          New registrations are reviewed by our team before appearing publicly.
        </p>

        <label>
          Blood bank name
          <input type="text" required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. City Hospital Blood Bank" />
        </label>

        <label>
          Area / Town
          <input type="text" required value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Kopargaon, Nashik, Pune" />
        </label>

        <label>
          Full address
          <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, landmark, city" />
        </label>

        <label>
          Official counter phone number
          <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Counter phone number only" />
        </label>

        <div className="where" style={{ marginBottom: 12 }}>
          <label>
            Latitude
            <input type="text" inputMode="decimal" required value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 19.8826" />
          </label>
          <label>
            Longitude
            <input type="text" inputMode="decimal" required value={lng} onChange={(e) => setLng(e.target.value)} placeholder="e.g. 74.4813" />
          </label>
          <button type="button" className="btn" onClick={useCurrentLocation} disabled={locating}>
            {locating ? "Locating…" : "Use bank location"}
          </button>
        </div>

        <label>
          Staff login email
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>

        <label>
          Password (min 6 characters)
          <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button className="btn primary" style={{ width: "100%" }} disabled={busy}>
          {busy ? "Submitting…" : "Submit for verification"}
        </button>

        <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>
          Already registered? <Link href="/staff" className="lp-inline-link">Blood bank sign in</Link>
        </p>
      </form>
    </div>
  );
}
