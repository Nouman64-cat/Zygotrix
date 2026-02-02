import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-axiforma)", "sans-serif"],
      },
    },
  },
  darkMode: "class",
  plugins: [require("@tailwindcss/typography")],
};
export default config;
