import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
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
        tesla: {
          red: "#E82127",
          dark: "#171A20",
          card: "#1E2024",
          cardHover: "#26292E",
          border: "#2F333B",
          blue: "#3E6AE1",
          green: "#10B981",
        },
      },
    },
  },
  plugins: [],
};
export default config;
