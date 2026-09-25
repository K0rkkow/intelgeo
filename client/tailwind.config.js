/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        intel: {
          bg: "#050507",
          bg2: "#08080a",
          surface: "#0c0c0e",
          surface2: "#121214",
          surface3: "#1c1c1f",
          line: "#232326",
          border: "#2a2a2e",
          muted: "#9a9da3",
          muted2: "#6b6e77",
          text: "#f8f7f5",
          dim: "#e8e6e1",
          red: "#ff1a1a",
          redHover: "#e10600",
          redSoft: "#ff3b30",
        },
        level: {
          easy: "#22c55e",
          normal: "#eab308",
          hard: "#f97316",
          expert: "#ff1a1a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Geist Mono", "monospace"],
      },
      boxShadow: {
        mac: "0 8px 30px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.25)",
        macHover: "0 12px 40px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.3)",
      },
    },
  },
  plugins: [],
};
