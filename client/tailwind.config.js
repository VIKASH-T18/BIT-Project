/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      // ─── Brand Colors ────────────────────────────────────
      colors: {
        // Primary — BIT Blue
        primary: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        // Secondary — Indigo accent
        secondary: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        // Success, Warning, Error, Info
        success: {
          light: "#dcfce7", DEFAULT: "#22c55e", dark: "#166534",
        },
        warning: {
          light: "#fef9c3", DEFAULT: "#eab308", dark: "#854d0e",
        },
        error: {
          light: "#fee2e2", DEFAULT: "#ef4444", dark: "#991b1b",
        },
        info: {
          light: "#dbeafe", DEFAULT: "#3b82f6", dark: "#1e40af",
        },
        // Dark mode surface colors
        dark: {
          bg:       "#0f172a",  // Main background
          surface:  "#1e293b",  // Cards
          elevated: "#334155",  // Modals, dropdowns
          border:   "#475569",  // Borders
          text:     "#f1f5f9",  // Primary text
          muted:    "#94a3b8",  // Secondary text
        },
        // Light mode surface colors
        light: {
          bg:       "#f8fafc",
          surface:  "#ffffff",
          elevated: "#f1f5f9",
          border:   "#e2e8f0",
          text:     "#0f172a",
          muted:    "#64748b",
        },
      },

      // ─── Typography ───────────────────────────────────────
      fontFamily: {
        sans:  ["Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "monospace"],
      },

      // ─── Spacing & Sizing ─────────────────────────────────
      borderRadius: {
        "xl":  "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },

      // ─── Shadows ──────────────────────────────────────────
      boxShadow: {
        "glass":    "0 4px 24px rgba(0,0,0,0.08)",
        "glass-lg": "0 8px 40px rgba(0,0,0,0.12)",
        "blue":     "0 4px 20px rgba(37,99,235,0.25)",
        "blue-lg":  "0 8px 32px rgba(37,99,235,0.35)",
        "inset":    "inset 0 1px 0 rgba(255,255,255,0.1)",
        "card":     "0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.08)",
      },

      // ─── Animations ───────────────────────────────────────
      animation: {
        "fade-in":         "fadeIn 0.3s ease-out",
        "slide-up":        "slideUp 0.4s ease-out",
        "slide-down":      "slideDown 0.3s ease-out",
        "slide-in-right":  "slideInRight 0.3s ease-out",
        "scale-in":        "scaleIn 0.2s ease-out",
        "pulse-slow":      "pulse 3s infinite",
        "spin-slow":       "spin 3s linear infinite",
        "bounce-gentle":   "bounceGentle 1s infinite",
        "shimmer":         "shimmer 1.5s infinite",
        "gradient":        "gradientShift 6s ease infinite",
        "float":           "float 3s ease-in-out infinite",
      },

      keyframes: {
        fadeIn:       { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp:      { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        slideDown:    { "0%": { opacity: "0", transform: "translateY(-16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        slideInRight: { "0%": { opacity: "0", transform: "translateX(16px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        scaleIn:      { "0%": { opacity: "0", transform: "scale(0.95)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        bounceGentle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":       { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%":       { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-10px)" },
        },
      },

      // ─── Background Sizes ─────────────────────────────────
      backgroundSize: {
        "200%": "200%",
        "400%": "400%",
      },

      // ─── Z-Index ──────────────────────────────────────────
      zIndex: {
        "dropdown": "1000",
        "modal":    "1050",
        "toast":    "1100",
        "overlay":  "1200",
        "sidebar":  "1300",
      },

      // ─── Transitions ──────────────────────────────────────
      transitionDuration: {
        "250": "250ms",
        "350": "350ms",
        "400": "400ms",
        "600": "600ms",
      },
    },
  },
  plugins: [],
};
