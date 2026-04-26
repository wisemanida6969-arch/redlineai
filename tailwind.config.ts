import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0f1a2e",
          light: "#1a2d4a",
          card: "#162035",
          border: "#1e3050",
        },
        red: {
          accent: "#e53e3e",
          light: "#fc8181",
        },
      },
    },
  },
  plugins: [],
};
export default config;
