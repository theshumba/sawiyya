/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Sawiyya brand palette (LOCKED, Brand Identity §2). AA-tuned.
        // teal.deep (#0A4F4C) is BOTH the deep surface tone and the hard bottom
        // edge every teal spring/extruded button draws (src/styles.css).
        // ink900 is documentation-only today: nothing references it.
        teal: { DEFAULT: "#0F6E6A", deep: "#0A4F4C", ink: "#16302E", ink900: "#0A1F1D" },
        // deep = the AA-safe FOREGROUND coral (H15). edge = the darker tone the
        // extruded/spring shadows sit on, one step under the face.
        coral: { DEFAULT: "#E8654C", soft: "#F08A75", deep: "#B54834", edge: "#9C3D2C" },
        // mid = progress-fill / reward accent (HANDOFF §1 · gold/mid).
        // deep = darkened for H15 (AA contrast): #C89A3D on sand (#F6EFE3) was
        // 2.26:1 for the "HINT" label text; #7F621F holds the same ~42° gold
        // hue at 5.01:1 on sand / 5.36:1 on paper (both ≥ AA 4.5:1).
        // edge = the pre-H15 #C89A3D, kept ONLY as the gold button's bottom
        // edge, where it is a shadow and never carries text.
        gold: { DEFAULT: "#E6B24C", soft: "#F0C879", deep: "#7F621F", mid: "#E6B24C", edge: "#C89A3D" },
        success: "#1F8A5B",
        sand: "#F6EFE3",
        paper: "#FBF7EF",
        // paper2 = canvas / behind-app background (HANDOFF §1 · paper/2).
        paper2: "#F1E7D6",
        ink: "#16302E",
        // H15: #5C726F measured 4.49:1 on sand — a hair under AA 4.5; #566B68
        // holds the same desaturated teal-grey at 4.97:1 sand / 5.31:1 paper.
        muted: "#566B68",
        line: "#EDE3D2",
      },
      transitionTimingFunction: {
        // Named easings (HANDOFF §Motion). Use as ease-spring / ease-standard.
        spring: "cubic-bezier(.34,1.56,.64,1)",
        standard: "cubic-bezier(.4,0,.2,1)",
      },
      fontFamily: {
        // Readex Pro = dual-script UI/body. Rubik = display + numbers.
        sans: ["Readex Pro", "system-ui", "sans-serif"],
        display: ["Rubik", "system-ui", "sans-serif"],
        // The brand vendors no monospace face (src/fonts.css ships Readex Pro,
        // Rubik and Material Symbols only), so `font-mono` was falling through
        // to Tailwind's default system stack: SF Mono on iPhone, Roboto Mono on
        // Android, Consolas on Windows. Every `font-mono` site in this app is a
        // small uppercase eyebrow/badge label, which is exactly what Eyebrow
        // renders in Rubik, so point the utility at the display face and the
        // labels look the same on every device.
        mono: ["Rubik", "system-ui", "sans-serif"],
      },
      borderRadius: {
        // Soft geometry — generous radii everywhere.
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        bowl: "2.5rem",
      },
      boxShadow: {
        soft: "0 18px 40px -22px rgba(15,110,106,.45)",
        lift: "0 26px 50px -22px rgba(15,110,106,.5)",
        gold: "0 12px 28px -10px rgba(230,178,76,.55)",
        coral: "0 12px 24px -12px rgba(232,101,76,.6)",
        // skeuomorphic card edge — one token for the chunky bottom border (was inline #D9D2C7)
        chunky: "0 6px 0 0 #D9D2C7",
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(.8)", opacity: "0" },
          "60%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "rise": {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(230,178,76,.45)" },
          "100%": { boxShadow: "0 0 0 18px rgba(230,178,76,0)" },
        },
        // Mascot / idle gentle bob.
        "float": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-7px)" },
        },
        // Overshoot scale-in for checks, badges, sparkles.
        "pop": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "60%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "pop-in": "pop-in .45s cubic-bezier(.2,.9,.3,1.4) both",
        "rise": "rise .5s ease both",
        "pulse-ring": "pulse-ring 1.4s ease-out infinite",
        "float": "float 2.6s ease-in-out infinite",
        "pop": "pop .4s cubic-bezier(.34,1.56,.64,1) both",
      },
    },
  },
  plugins: [],
};
