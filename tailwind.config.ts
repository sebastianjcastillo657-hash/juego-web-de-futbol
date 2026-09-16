import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          dark: "#0a1a12",
          line: "#1f3a2b",
        },
        rarity: {
          comun: "#9ca3af",
          raro: "#38bdf8",
          epico: "#a855f7",
          leyenda: "#fbbf24",
        },
      },
    },
  },
  plugins: [],
};

export default config;
