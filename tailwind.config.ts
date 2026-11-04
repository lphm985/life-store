import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        game: {
          panel: "#1e293b",
          border: "#334155",
          accent: "#10b981",
          gold: "#f59e0b",
          energy: "#3b82f6",
        },
      },
    },
  },
  plugins: [],
};
export default config;
