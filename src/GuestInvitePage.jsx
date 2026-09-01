// src/pages/GuestInvitePage.jsx
//
// Mounted at /e/:slug (see ROUTING_SNIPPET.md for exactly where to register
// this in your existing router). No fetch, no backend — everything it needs
// comes from the URL itself and the local data file.
//
//   /e/elena-marcus                          -> shows the invitation, no greeting
//   /e/elena-marcus?guest=Daniel%20Gonzalez  -> shows "Hi, Daniel Gonzalez!"
//
// That's the whole personalization mechanism: the guest's name travels IN
// the link you send them, not in a database you'd have to look up. If you
// later want per-guest RSVP tracking (not just a greeting), that's the point
// where you'd need a real backend to persist responses — a static frontend
// has nowhere durable to write them.

import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { getInvitationBySlug } from "../data/invitations";

export default function GuestInvitePage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const guestName = searchParams.get("guest"); // null if not present — that's fine, just means no greeting

  const invitation = getInvitationBySlug(slug);

  if (!invitation) {
    return <InvitationNotFound slug={slug} />;
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        {/* Cover */}
        <section style={styles.section}>
          {guestName && <p style={styles.greeting}>Hi, {guestName}!</p>}
          <h1 style={styles.h1}>{invitation.coupleNames}</h1>
          <div style={styles.divider} />
          {invitation.cover?.intro && <p style={styles.muted}>{invitation.cover.intro}</p>}
        </section>

        {/* Timeline */}
        {invitation.timeline?.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.h2}>Order of the Day</h2>
            {invitation.timeline.map((t, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={styles.label}>{t.time}</div>
                <div style={styles.itemTitle}>{t.label}</div>
              </div>
            ))}
          </section>
        )}

        {/* Locations */}
        {invitation.locations?.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.h2}>The Celebration</h2>
            {invitation.locations.map((l, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={styles.label}>{l.time}</div>
                <div style={styles.itemTitle}>{l.title}</div>
                {l.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(l.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    {l.address} — Get Directions →
                  </a>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Countdown */}
        {invitation.countdown?.date && (
          <section style={styles.section}>
            <h2 style={styles.h2}>Counting Down</h2>
            <Countdown date={invitation.countdown.date} time={invitation.countdown.time || "00:00"} />
          </section>
        )}

        {/* RSVP */}
        {invitation.rsvp && (
          <section style={{ ...styles.section, borderBottom: "none" }}>
            <h2 style={styles.h2}>{invitation.rsvp.heading || "Will You Join Us?"}</h2>
            <p style={styles.muted}>
              {/* No backend to POST an RSVP to yet — wire this button up once
                  you have somewhere to send it. */}
              This is a static preview — connect a real RSVP handler when
              you're ready (see the README for the backend option).
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

function InvitationNotFound({ slug }) {
  return (
    <div style={{ ...styles.page, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div style={{ padding: 24 }}>
        <h1 style={styles.h1}>This invitation link isn't available</h1>
        <p style={styles.muted}>
          No invitation is set up for "{slug}". Check that it's added in{" "}
          <code>src/data/invitations.js</code>, or that the link is correct.
        </p>
        <Link to="/" style={styles.link}>
          ← Back home
        </Link>
      </div>
    </div>
  );
}

function Countdown({ date, time }) {
  const target = new Date(`${date}T${time}:00`).getTime();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 14, margin: "20px 0" }}>
      {[
        [days, "Days"],
        [hours, "Hrs"],
        [mins, "Min"],
        [secs, "Sec"],
      ].map(([n, l]) => (
        <div key={l} style={styles.countdownCell}>
          <div style={styles.countdownN}>{n}</div>
          <div style={styles.countdownL}>{l}</div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#161F1B", color: "#F4EDE4", fontFamily: "Inter, sans-serif" },
  wrap: { maxWidth: 520, margin: "0 auto" },
  section: { padding: "48px 24px", borderBottom: "1px solid rgba(201,164,76,0.12)", textAlign: "center" },
  h1: { fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 32, margin: "0 0 10px" },
  h2: { fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 20, color: "#E4CE95", margin: "0 0 14px" },
  greeting: { color: "#E4CE95", fontSize: 14, marginBottom: 16 },
  muted: { color: "#93A69B", lineHeight: 1.6 },
  divider: { width: 40, height: 1, background: "#C9A44C", margin: "16px auto" },
  label: { color: "#E4CE95", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" },
  itemTitle: { fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 16, marginTop: 2 },
  link: { color: "#E4CE95", fontSize: 12, textDecoration: "none" },
  countdownCell: { background: "#1E2B25", border: "1px solid rgba(201,164,76,0.2)", borderRadius: 12, padding: "12px 14px", minWidth: 60 },
  countdownN: { fontFamily: "Georgia, serif", fontSize: 24, color: "#E4CE95" },
  countdownL: { fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "#93A69B", marginTop: 2 },
};
