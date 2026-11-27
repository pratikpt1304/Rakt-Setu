import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page panel narrow">
      <h1>Page not found</h1>
      <p className="muted">The page you are looking for does not exist or has been moved.</p>
      <div className="actions">
        <Link className="btn primary" href="/find">Find blood</Link>
        <Link className="btn" href="/">Back to home</Link>
      </div>
    </div>
  );
}
