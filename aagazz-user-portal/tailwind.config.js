/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#D9AC63", // Champagne Gold
          light: "#FFD78A",   // Bright Gold
          dark: "#B88643",    // Deep Bronze Gold
          container: "#2A2118",
        },
        surface: {
          DEFAULT: "#080604", // Cinematic Black
          secondary: "#15100C", // Rich dark obsidian
          container: "#221F1B",
          high: "#2D2926",
          highest: "#383430"
        },
        luxury: {
          gold: "#D9AC63",
          brightGold: "#FFD78A",
          bronze: "#B88643",
          cream: "#F8F2E8",
          muted: "#B9ADA0",
          card: "rgba(21, 16, 12, 0.85)",
          border: "rgba(217, 172, 99, 0.3)"
        }
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Plus Jakarta Sans'", "'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        gold: "0 0 25px rgba(217, 172, 99, 0.25)",
        "gold-lg": "0 0 45px rgba(217, 172, 99, 0.4)",
        metallic: "inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 8px 24px rgba(0,0,0,0.8)",
      },
      animation: {
        shimmer: "shimmer 2.5s infinite linear",
        pulseGlow: "pulseGlow 2s infinite ease-in-out",
      },
      keyframes: {
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        }
      }
    },
  },
  plugins: [],
}
