/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#4CAF50", // الأخضر
        secondary: "#683A2F", // البني الغامق
        "bg-green": "#F7FEF4", // الخلفية الفاتحة
        "text-muted": "#4B4B4B", // الرمادي للوصف
        "header-footer": "#E3D1C8", // اللون البيج للهيدر والفوتر
        "featured-bg": "rgba(141, 73, 58, 0.25)", // لون البوكس المميز شفافية 25%
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      fontSize: {
        h1: ["56px", { lineHeight: "1.2", fontWeight: "900" }],
        h2: ["48px", { lineHeight: "1.3", fontWeight: "800" }],
        h3: ["28px", { lineHeight: "1.4", fontWeight: "700" }], // Bold
        h4: ["24px", { lineHeight: "1.5", fontWeight: "600" }],
        base: ["18px", { lineHeight: "1.6", fontWeight: "400" }], // Regular
      },
    },
  },
  plugins: [],
};
