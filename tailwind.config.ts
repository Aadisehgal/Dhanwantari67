import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0F9D58",
          50: "#E7F7EF",
          100: "#C3ECD8",
          500: "#0F9D58",
          600: "#0C7D46",
          700: "#095E35",
        },
        accent: {
          DEFAULT: "#7C3AED",
          50: "#F3EBFE",
          500: "#7C3AED",
          600: "#652FC2",
        },
        status: {
          alert: "#DC2626",
          pending: "#F59E0B",
          success: "#16A34A",
        },
      },
      spacing: {
        18: "4.5rem",
      },
      fontFamily: {
        sans: ["Inter", "Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
