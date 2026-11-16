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
          DEFAULT: "#D9AC63",
          light: "#FFD78A",
          dark: "#B88643",
          container: "#2A2118",
        },
        surface: {
          DEFAULT: "#080604",
          secondary: "#15100C",
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
          card: "rgba(21, 16, 12, 0.9)",
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
        scanner: "0 0 35px rgba(217, 172, 99, 0.5)",
      }
    },
  },
  plugins: [],
}
