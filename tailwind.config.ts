import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        canvas: "#F1F5F9",
        surface: "#F4F6F9",
        subtle: "#E6EAF0",
        border: "#CBD5E1",
        "border-hover": "#94A3B8",
        "border-strong": "#94A3B8",
        zinc: {
          50: "#F4F6F9",
          100: "#E6EAF0",
          200: "#CBD5E1",
          300: "#94A3B8",
          400: "#64748B",
          500: "#475569",
        },
        brand: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          subtle: "#EFF6FF",
          border: "#BFDBFE",
        },
        success: {
          DEFAULT: "#16A34A",
          subtle: "#F0FDF4",
        },
        warning: {
          DEFAULT: "#D97706",
          subtle: "#FFFBEB",
        },
        danger: {
          DEFAULT: "#DC2626",
          subtle: "#FEF2F2",
        },
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04)",
        sm: "0 1px 3px 0 rgba(15, 23, 42, 0.10), 0 1px 2px -1px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(15, 23, 42, 0.04)",
        md: "0 4px 6px -1px rgba(15, 23, 42, 0.10), 0 2px 4px -2px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(15, 23, 42, 0.04)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
