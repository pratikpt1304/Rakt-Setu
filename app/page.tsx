import Link from "next/link";
import ExampleBankCard from "./ExampleBankCard";

const GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

export default function Landing() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <div className="lp-wrap">
      <section className="lp-hero">
        <div>
          <h1>See which nearby blood banks have your blood group, right now.</h1>
          <p className="lp-lead">
            Stock comes straight from the blood banks, with the time each one last updated. No sign-up. Works on any phone.
          </p>
          <div className="lp-pick">
            <p id="pick-label"><b>Tap the blood group you need</b></p>
            <div className="groups" role="group" aria-labelledby="pick-label">
              {GROUPS.map((g) => (
                <Link key={g} className="grp" href={`/find?g=${encodeURIComponent(g)}`}>{g}</Link>
              ))}
            </div>
            <p className="muted lp-pick-foot">
              Not sure? <Link href="/find" className="lp-inline-link">See every blood bank near you</Link>.
            </p>
          </div>
        </div>

        <ExampleBankCard />
      </section>

      <section className="lp-sec">
        <h2>How it works for families</h2>
        <ol className="lp-steps">
          <li><b>Choose your blood group and area</b>Or let your phone share its location. Nothing to sign up for.</li>
          <li><b>See the nearest blood banks first</b>Each one shows units for all 8 groups and when it last updated.</li>
          <li><b>Call the bank and go</b>One tap to call, one tap for directions. Always confirm by phone before travelling.</li>
        </ol>
      </section>

      <section className="lp-sec lp-two">
        <div>
          <h2>What you can rely on</h2>
          <ul className="lp-rules">
            <li>Every number shows when it was last updated. After 6 hours it carries a warning.</li>
            <li>A bank that has not published says &ldquo;No data yet&rdquo;. It never shows a made-up zero.</li>
            <li>Only blood bank counter numbers are listed, never personal numbers.</li>
            <li>Your location only sorts the list. We do not ask you to create an account.</li>
          </ul>
        </div>
        <div>
          <h2>For blood banks</h2>
          <p>
            Update stock for all 8 blood groups in a few taps and publish. Families nearby see the new numbers within seconds, and fewer of them need to phone your counter to ask.
          </p>
          <p>
            Each blood bank gets its own login, and can only change its own stock. Every update is recorded.
          </p>
          <div className="actions">
            <Link className="btn primary" href="/staff">Blood bank sign in</Link>
            {contact && <a className="btn" href={`mailto:${contact}`}>List your blood bank</a>}
          </div>
        </div>
      </section>

      <section className="lp-band">
        <div>
          <h2>Need blood now?</h2>
          <p>Pick your blood group and see who has it nearest to you.</p>
        </div>
        <Link className="btn" href="/find">Find blood near me</Link>
      </section>
    </div>
  );
}
