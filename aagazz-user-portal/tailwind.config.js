/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Mirrors the custom properties in src/index.css
      colors: {
        yellow: "#F6C915",
        red: "#E0301E",
        blue: "#2B3990",
        green: "#0F6B4F",
        violet: "#5B2A78",
        key: "#14122B",
        stock: "#EFE9DC",
      },
      fontFamily: {
        display: ["'Rozha One'", "Georgia", "serif"],
        sans: ["'Anek Latin'", "'Arial Narrow'", "sans-serif"],
      },
    },
  },
  plugins: [],
}
