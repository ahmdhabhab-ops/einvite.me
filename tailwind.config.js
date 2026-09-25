/** @type {import('tailwindcss').Config} */
// Tailwind used to run in each visitor's browser via the cdn.tailwindcss.com
// script (which compiles CSS on the fly on every page load); it's now built
// once at deploy time. Same Tailwind v3 defaults the CDN used.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
};
