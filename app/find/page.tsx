"use client";
import { FormEvent, useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, GROUPS, COMPAT, Group, Bank, ago, isStale, level, toIso, haversineKm } from "@/lib/firebase";
import { AREAS } from "@/lib/areas";

type Place = { label: string; lat: number; lng: number };

const stockLabel = (n: number) => (n === 0 ? "Out of stock" : n < 5 ? `Low: ${n} unit${n === 1 ? "" : "s"}` : `${n} units`);

type RawBank = {
  id: string;
  name: string;
  area: string;
  address?: string | null;
  phone: string;
  lat: number;
  lng: number;
  last_published_at?: unknown;
  stock?: Record<string, number> | null;
};

export default function Home() {
  const [group, setGroup] = useState<Group>("B+");
  const [place, setPlace] = useState<Place>(AREAS[0]);
  const [areaInput, setAreaInput] = useState(AREAS[0].label);
  const [rawBanks, setRawBanks] = useState<RawBank[] | null>(null);
  const [error, setError] = useState("");
  const [locMsg, setLocMsg] = useState("");
  const [onlyStock, setOnlyStock] = useState(false);
  const [maxKm, setMaxKm] = useState<number>(25);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [, tick] = useState(0);

  // Landing page links arrive as /find?g=B%2B. Preselect that group.
  useEffect(() => {
    const g = new URLSearchParams(window.location.search).get("g")?.replace(" ", "+");
    if (g && (GROUPS as readonly string[]).includes(g)) setGroup(g as Group);
  }, []);

  // Subscribe to approved banks in Firestore, and keep "updated X min ago" current.
  useEffect(() => {
    const q = query(collection(db, "banks"), where("approved", "==", true));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setError("");
        setRawBanks(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RawBank, "id">) })));
      },
      () => {
        setError("Could not load blood banks. Check your connection and try again.");
      }
    );
    const timer = setInterval(() => tick((n) => n + 1), 60000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  async function searchLocation(e: FormEvent) {
    e.preventDefault();
    const q = areaInput.trim();
    if (!q) return;
    setError("");
    setLocMsg("");

    const preset = AREAS.find((a) => a.label.toLowerCase() === q.toLowerCase());
    if (preset) {
      setPlace(preset);
      setAreaInput(preset.label);
      setLocMsg(`Sorted nearest to ${preset.label}.`);
      return;
    }

    // Match any bank's area/address directly if user typed a known bank area
    const bankMatch = rawBanks?.find((b) => b.area.toLowerCase().includes(q.toLowerCase()));

    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" } }
      );
      if (res.ok) {
        const list = (await res.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
        if (list.length > 0) {
          const lat = Number(list[0].lat);
          const lng = Number(list[0].lon);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            setPlace({ label: q, lat, lng });
            setLocMsg(`Showing blood banks within ${maxKm === 0 ? "all distances of" : `${maxKm} km of`} ${q}.`);
            setSearching(false);
            return;
          }
        }
      }
    } catch {
      // Fall back to bank area match below if offline
    }
    setSearching(false);

    if (bankMatch) {
      setPlace({ label: bankMatch.area, lat: bankMatch.lat, lng: bankMatch.lng });
      setAreaInput(bankMatch.area);
      setLocMsg(`Sorted nearest to ${bankMatch.area}.`);
    } else {
      setError(`Could not find "${q}". Try another town name or tap Use my location.`);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("This device cannot share its location. Type your town or area instead.");
      return;
    }
    setLocating(true);
    setError("");
    setLocMsg("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const lat = p.coords.latitude;
        const lng = p.coords.longitude;
        setPlace({ label: "Your location", lat, lng });
        setAreaInput("Your location");
        setLocMsg("Showing blood banks nearest to your current location.");
        setLocating(false);

        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
          headers: { Accept: "application/json" }
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data: { address?: { city?: string; town?: string; state_district?: string } } | null) => {
            const town = data?.address?.city || data?.address?.town || data?.address?.state_district;
            if (town) {
              setPlace({ label: town, lat, lng });
              setAreaInput(town);
              setLocMsg(`Showing blood banks near ${town} (GPS).`);
            }
          })
          .catch(() => {});
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location permission was blocked in your browser. Allow location access or type your town.");
        } else if (err.code === err.TIMEOUT) {
          setError("Location request timed out. Try again or type your town.");
        } else {
          setError("Could not detect your location. Type your town or area instead.");
        }
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  const banks: Bank[] | null = rawBanks
    ? rawBanks
        .map((b) => {
          const stock = b.stock ?? null;
          return {
            id: b.id,
            name: b.name,
            area: b.area,
            address: b.address ?? null,
            phone: b.phone,
            lat: b.lat,
            lng: b.lng,
            units: stock?.[group] ?? 0,
            last_published_at: toIso(b.last_published_at),
            distance_km: haversineKm(place.lat, place.lng, b.lat, b.lng),
            all_stock: stock
          };
        })
        .sort((a, b) => a.distance_km - b.distance_km)
    : null;

  const nearby = (banks ?? []).filter((b) => maxKm === 0 || b.distance_km <= maxKm);
  const shown = nearby.filter((b) => !onlyStock || b.units > 0);

  return (
    <div className="page">
      <section className="panel">
        <h1>Which blood group do you need?</h1>
        <div className="groups" role="radiogroup" aria-label="Blood group">
          {GROUPS.map((g) => (
            <button key={g} role="radio" aria-checked={g === group} className={g === group ? "grp on" : "grp"} onClick={() => setGroup(g)}>
              {g}
            </button>
          ))}
        </div>
        <p className="muted">{group}: {COMPAT[group]} (confirm with a doctor).</p>

        <form className="where" onSubmit={searchLocation}>
          <label>
            Where are you? (type town or area)
            <input
              type="text"
              list="area-suggestions"
              value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              placeholder="e.g. Kopargaon, Shirdi, Nashik"
            />
            <datalist id="area-suggestions">
              {AREAS.map((a) => (
                <option key={a.label} value={a.label} />
              ))}
            </datalist>
          </label>
          <button type="submit" className="btn primary" disabled={searching}>
            {searching ? "Searching…" : "Set location"}
          </button>
          <button type="button" className="btn" onClick={useMyLocation} disabled={locating}>
            {locating ? "Locating…" : "Use my location"}
          </button>
        </form>
        {locMsg && <p className="muted" role="status" style={{ marginTop: 8, marginBottom: 0 }}>{locMsg}</p>}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
          <label className="check" style={{ margin: 0 }}>
            <input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} />
            Show only banks with {group} in stock
          </label>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, margin: 0, fontWeight: 400 }}>
            Distance:
            <select
              value={maxKm}
              onChange={(e) => setMaxKm(Number(e.target.value))}
              style={{ width: "auto", marginTop: 0, padding: "6px 10px" }}
            >
              <option value={10}>Within 10 km</option>
              <option value={25}>Within 25 km</option>
              <option value={50}>Within 50 km</option>
              <option value={0}>All distances</option>
            </select>
          </label>
        </div>
      </section>

      {error && <p className="error" role="alert">{error}</p>}
      {!banks && !error && <p className="muted">Finding blood banks near {place.label}…</p>}
      {banks && shown.length === 0 && (
        <div className="empty">
          <p style={{ marginBottom: maxKm > 0 && banks.length > 0 ? 10 : 0 }}>
            {banks.length === 0
              ? "No blood banks are listed yet."
              : nearby.length === 0
                ? `No blood banks found within ${maxKm} km of ${place.label}.`
                : `No bank within ${maxKm} km shows ${group} in stock. Turn off the filter or increase distance.`}
          </p>
          {maxKm > 0 && nearby.length === 0 && banks.length > 0 && (
            <button type="button" className="btn" onClick={() => setMaxKm(0)}>
              Show all banks ({banks.length})
            </button>
          )}
        </div>
      )}

      <ul className="banks">
        {shown.map((b) => {
          const stale = isStale(b.last_published_at);
          const never = b.last_published_at === null;
          const lvl = never ? "none" : level(b.units);
          return (
            <li key={b.id} className="bank">
              <div className="bank-head">
                <div>
                  <h2>{b.name}</h2>
                  <p className="muted">{b.area}, {b.distance_km.toFixed(1)} km away</p>
                </div>
                <span className={`badge ${lvl}`}>{never ? "No data yet" : stockLabel(b.units)}</span>
              </div>
              <p className={stale ? "fresh stale" : "fresh"}>
                {never ? "This bank has not published stock yet. Call to confirm." : `Updated ${ago(b.last_published_at)}`}
                {stale && !never && ". May be outdated, call to confirm."}
              </p>
              <ul className="tiles" aria-label="Stock by blood group">
                {GROUPS.map((g) => {
                  const n = b.all_stock?.[g] ?? 0;
                  return (
                    <li key={g} className={`tile ${never ? "none" : level(n)}${g === group ? " sel" : ""}`}>
                      <b>{g}</b>
                      <span>{never ? "–" : n}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="actions">
                <a className="btn primary" href={`tel:${b.phone}`}>Call {b.phone}</a>
                <a className="btn" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`}>
                  Get directions
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
