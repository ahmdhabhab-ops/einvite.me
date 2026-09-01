// src/data/invitations.js
//
// No backend = the invitation content has to live somewhere the browser
// already has it. This file is that "somewhere" — a plain JS object keyed
// by slug, bundled with your app like any other source file.
//
// This is genuinely fine for one couple's site (or a handful, hardcoded).
// It stops being fine the moment you want couples to publish their OWN
// invitations without you editing and redeploying this file each time —
// that's the exact point where you'd need a real backend (this is the
// invitation-viewer project from earlier, if you ever want that).
//
// Guest personalization does NOT need a lookup here at all — see
// GuestInvitePage.jsx, which reads the guest's name straight out of the
// URL (?guest=...), so there's nothing to store per-guest in this file.

export const invitations = {
  "elena-marcus": {
    coupleNames: "Elena & Marcus",
    cover: {
      intro:
        "Together with their families, joyfully invite you to celebrate their wedding.",
    },
    timeline: [
      { time: "4:00 PM", label: "Ceremony" },
      { time: "6:00 PM", label: "Reception" },
    ],
    locations: [
      { time: "4:00 PM", title: "St. Mary's Chapel", address: "123 Chapel Rd" },
    ],
    countdown: { date: "2027-06-12", time: "16:00" },
    rsvp: { heading: "Will You Join Us?", yesLabel: "Attending", noLabel: "Not Attending" },
    registry: [{ label: "Our Registry", url: "https://example.com/registry" }],
  },

  // Add another couple's invitation by adding another key here, e.g.:
  // "sara-ahmed": { coupleNames: "Sara & Ahmed", ... },
};

export function getInvitationBySlug(slug) {
  return invitations[slug] || null;
}
