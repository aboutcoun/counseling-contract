import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c1c1a",
        paper: "#fbfaf7",
        line: "#dedad2",
        accent: "#2f4b3c",
        alert: "#a8412f",
      },
      fontFamily: {
        serif: ["Noto Serif KR", "serif"],
        sans: ["Pretendard", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
