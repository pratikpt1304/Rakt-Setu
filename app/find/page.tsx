"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase, GROUPS, COMPAT, Group, Bank, ago, isStale, level } from "@/lib/supabase";
import { AREAS } from "@/lib/areas";

type Place = { label: string; lat: number; lng: number };

const stockLabel = (n: number) => (n === 0 ? "Out of stock" : n < 5 ? `Low: ${n} unit${n === 1 ? "" : "s"}` : `${n} units`);

export default function Home() {
  const [group, setGroup] = useState<Group>("B+");
  const [place, setPlace] = useState<Place>(AREAS[0]);
  const [banks, setBanks] = useState<Bank[] | null>(null);
  const [error, setError] = useState("");
  const [onlyStock, setOnlyStock] = useState(false);
  const [locating, setLocating] = useState(false);
  const [, tick] = useState(0);

  // Landing page links arrive as /find?g=B%2B. Preselect that group.
  useEffect(() => {
    const g = new URLSearchParams(window.location.search).get("g")?.replace(" ", "+");
    if (g && (GROUPS as readonly string[]).includes(g)) setGroup(g as Group);
  }, []);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("nearby_banks", { p_lat: place.lat, p_lng: place.lng, p_group: group });
    if (error) {
      setError("Could not load blood banks. Check your connection and try again.");
      return;
    }
    setError("");
    setBanks(data as Bank[]);
  }, [group, place]);

  useEffect(() => {
    setBanks(null);
    load();
  }, [load]);

  // Refresh when any bank publishes new stock, and keep "updated X min ago" current.
  useEffect(() => {
    const channel = supabase
      .channel("banks-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "banks" }, () => load())
      .subscribe();
    const timer = setInterval(() => tick((n) => n + 1), 60000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [load]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("This device cannot share its location. Pick your area instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPlace({ label: "Your location", lat: p.coords.latitude, lng: p.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Location access was blocked. Pick your area instead.");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }

  const shown = (banks ?? []).filter((b) => !onlyStock || b.units > 0);

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

        <div className="where">
          <label>
            Where are you?
            <select
              value={place.label}
              onChange={(e) => {
                const a = AREAS.find((x) => x.label === e.target.value);
                if (a) setPlace(a);
              }}
            >
              {place.label === "Your location" && <option>Your location</option>}
              {AREAS.map((a) => <option key={a.label}>{a.label}</option>)}
            </select>
          </label>
          <button className="btn" onClick={useMyLocation} disabled={locating}>{locating ? "Locating…" : "Use my location"}</button>
        </div>
        <label className="check">
          <input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} />
          Show only banks with {group} in stock
        </label>
      </section>

      {error && <p className="error" role="alert">{error}</p>}
      {!banks && !error && <p className="muted">Finding blood banks near {place.label}…</p>}
      {banks && shown.length === 0 && (
        <p className="empty">
          {banks.length === 0
            ? "No blood banks are listed yet for this area."
            : `No nearby bank shows ${group} in stock. Turn off the filter to see all banks and call them.`}
        </p>
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
