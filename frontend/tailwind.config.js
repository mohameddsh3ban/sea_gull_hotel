/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Modern palette
        primary: { DEFAULT: "#0f172a", foreground: "#ffffff" }, // slate-900
        accent: { DEFAULT: "#0ea5e9", hover: "#0284c7" },       // sky-500/600
        success: "#10b981",                                     // emerald-500
        warning: "#f59e0b",                                     // amber-500
        danger:  "#ef4444",                                     // red-500
        surface: "#ffffff",
        surfaceMuted: "#f8fafc",
        border:  "#e2e8f0",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        heading: [
          "Poppins",
          "Inter",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        card: "0 2px 4px rgba(15,23,42,0.06), 0 12px 24px rgba(15,23,42,0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
