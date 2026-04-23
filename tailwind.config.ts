import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ph: {
          red: "#EE3124",
          redDark: "#C8221A",
          redDeep: "#A01914",
          yellow: "#FFCE00",
          black: "#0F0F10",
          ink: "#1A1A1D",
          slate: "#2A2A2F",
          surface: "#F7F5F2",
          card: "#FFFFFF",
          muted: "#6B6B70",
          line: "#E6E3DE",
          green: "#2E7D32",
          amber: "#F59E0B",
        },
      },
      fontFamily: {
        sans: [
          "Open Sans",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        display: ["Open Sans", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,15,16,0.06), 0 4px 16px rgba(15,15,16,0.04)",
        pop: "0 8px 24px rgba(238,49,36,0.18)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
