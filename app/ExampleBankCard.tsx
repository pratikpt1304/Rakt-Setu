"use client";
import { useState } from "react";
import Link from "next/link";

const GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
const EXAMPLE = [9, 2, 12, 0, 14, 1, 5, 0];

const lvl = (n: number) => (n === 0 ? "out" : n < 5 ? "low" : "ok");
const stockLabel = (n: number) =>
  n === 0 ? "Out of stock" : n < 5 ? `Low: ${n} unit${n === 1 ? "" : "s"}` : `${n} units`;

export default function ExampleBankCard() {
  const [selected, setSelected] = useState(1); // A- by default
  const group = GROUPS[selected];
  const units = EXAMPLE[selected];

  return (
    <div className="lp-example">
      <p className="muted lp-cap">Example of what you will see. Not a real blood bank. Tap a group to preview:</p>
      <div className="bank">
        <div className="bank-head">
          <div>
            <h2>Example Blood Bank</h2>
            <p className="muted">Your area, 1.4 km away</p>
          </div>
          <span className={`badge ${lvl(units)}`}>{stockLabel(units)}</span>
        </div>
        <p className="fresh">Updated 12 min ago</p>
        <ul className="tiles" aria-label="Example stock by blood group">
          {GROUPS.map((g, i) => (
            <li key={g}>
              <button
                type="button"
                className={`tile tile-btn ${lvl(EXAMPLE[i])}${i === selected ? " sel" : ""}`}
                aria-pressed={i === selected}
                onClick={() => setSelected(i)}
              >
                <b>{g}</b>
                <span>{EXAMPLE[i]}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="lp-ex-foot">
          <Link className="lp-ex-link" href={`/find?g=${encodeURIComponent(group)}`}>
            Check real {group} stock near you &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
