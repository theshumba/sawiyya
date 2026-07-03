/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Sawiyya brand palette (LOCKED — Brand Identity §2). AA-tuned.
        // ink900 = button hard-shadow deep tone (HANDOFF §1 · teal/ink-900).
        teal: { DEFAULT: "#0F6E6A", deep: "#0A4F4C", ink: "#16302E", ink900: "#0A1F1D" },
        coral: { DEFAULT: "#E8654C", soft: "#F08A75", deep: "#C54F3A" },
        // mid = progress-fill / reward accent (HANDOFF §1 · gold/mid).
        // deep = darkened for H15 (AA contrast): #C89A3D on sand (#F6EFE3) was
        // 2.26:1 for the "HINT" label text; #7F621F holds the same ~42° gold
        // hue at 5.01:1 on sand / 5.36:1 on paper (both ≥ AA 4.5:1).
        gold: { DEFAULT: "#E6B24C", soft: "#F0C879", deep: "#7F621F", mid: "#E6B24C" },
        success: "#1F8A5B",
        danger: "#C0492F",
        sand: "#F6EFE3",
        paper: "#FBF7EF",
        // paper2 = canvas / behind-app background (HANDOFF §1 · paper/2).
        paper2: "#F1E7D6",
        ink: "#16302E",
        muted: "#5C726F",
        line: "#EDE3D2",
      },
      transitionTimingFunction: {
        // Named easings — HANDOFF §Motion. Use as ease-spring / ease-standard / …
        spring: "cubic-bezier(.34,1.56,.64,1)",
        standard: "cubic-bezier(.4,0,.2,1)",
        enter: "cubic-bezier(0,0,.2,1)",
        exit: "cubic-bezier(.4,0,1,1)",
      },
      fontFamily: {
        // Readex Pro = dual-script UI/body. Rubik = display + numbers.
        sans: ["Readex Pro", "system-ui", "sans-serif"],
        display: ["Rubik", "system-ui", "sans-serif"],
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
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        // Celebration confetti — linear fall + spin (HANDOFF §Motion · ~1.4s).
        "confetti": {
          "0%": { transform: "translateY(-10%) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(160px) rotate(430deg)", opacity: "0" },
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
        "shimmer": "shimmer 1.6s linear infinite",
        "confetti": "confetti 1.4s linear forwards",
        "float": "float 2.6s ease-in-out infinite",
        "pop": "pop .4s cubic-bezier(.34,1.56,.64,1) both",
      },
    },
  },
  plugins: [],
};
