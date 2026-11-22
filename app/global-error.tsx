"use client";

// Last-resort error screen when even the root layout fails. It must render its own
// <html> and <body> and does not get globals.css, so it uses inline styles.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, background: "#faf7f0", color: "#1b2420" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>StudyCircle is having trouble</h1>
          <p style={{ color: "#66736c" }}>Please try again in a moment.</p>
          <button
            onClick={() => retry()}
            style={{ marginTop: 20, padding: "10px 18px", borderRadius: 8, border: 0, background: "#1c3f2f", color: "#faf7f0", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
