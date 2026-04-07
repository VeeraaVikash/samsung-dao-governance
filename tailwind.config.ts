import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        samsung: {
          primary: "#1428A0",
          dark: "#0D1A7A",
          mid: "#4A5BD4",
          light: "#E8EAFB",
        },
        gray: {
          50: "#F8F9FC",
          100: "#F0F2F8",
          200: "#E2E6F0",
          300: "#D8DCF0",
          400: "#9AA3BC",
          500: "#6B7491",
          700: "#374166",
          900: "#0D1A7A",
        },
        success: { DEFAULT: "#1D9E75", light: "#E1F5EE" },
        warning: { DEFAULT: "#EF9F27", light: "#FAEEDA" },
        danger: { DEFAULT: "#E24B4A", light: "#FFF0F0" },
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderWidth: { "0.5": "0.5px" },
    },
  },
  plugins: [],
};

export default config;
