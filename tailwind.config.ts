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
        primary: {
          DEFAULT: "#9146ff",
          hover: "#7a3bd9",
          dark: "#7a35eb",
        },
        background: {
          light: "#f7f5f8",
          dark: "#170f23",
        },
        surface: {
          dark: "#1e142f",
          darker: "#110b1a",
          hover: "#312641",
        },
        border: {
          dark: "#31204b",
          darker: "#462e6b",
        },
        text: {
          subtle: "#a78dce",
          muted: "#a78dce",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Noto Sans", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      boxShadow: {
        glow: "0 0 15px rgba(145, 70, 255, 0.3)",
        "glow-sm": "0 0 10px rgba(145, 70, 255, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
