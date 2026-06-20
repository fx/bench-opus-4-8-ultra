import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

// Tailwind maps semantic utility names (bg-primary, text-foreground, rounded-md)
// onto CSS variables. The variables themselves are defined per theme scope in
// src/styles/themes.css, so the same class resolves to marketing or Jira tokens
// depending on the enclosing [data-theme] container. Colors use the
// `hsl(var(--token))` form; tokens that carry an alpha channel (e.g. --border)
// are emitted as full color strings, so they are referenced via `var(--token)`.
const config = {
  darkMode: ["class", '[data-theme="marketing"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        panel: "hsl(var(--panel))",
        page: "hsl(var(--page))",
        border: "var(--border)",
        input: "var(--border)",
        ring: "hsl(var(--primary))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        slop: "hsl(var(--slop))",
        muted: {
          DEFAULT: "hsl(var(--panel))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
      borderRadius: {
        // Each theme defines its own radius scale as variables (see themes.css)
        // rather than deriving md/sm by subtracting fixed pixels from lg — the
        // Jira base radius (4px) is too small for subtraction (it would yield a
        // 0 / negative, invalid radius). Defaults keep the shadcn-style
        // derivation when a theme omits the smaller tokens.
        lg: "var(--radius)",
        md: "var(--radius-md, calc(var(--radius) - 2px))",
        sm: "var(--radius-sm, calc(var(--radius) - 4px))",
      },
      fontFamily: {
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        // Slow, looping drift for the marketing hero aurora blobs. Purely
        // ambient; gated off under reduced motion by the Backdrops component.
        "aurora-drift": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(6%, 4%, 0) scale(1.15)" },
        },
        "aurora-drift-slow": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1.1)" },
          "50%": { transform: "translate3d(-5%, -6%, 0) scale(0.95)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee var(--marquee-duration, 30s) linear infinite",
        "aurora-drift": "aurora-drift 18s ease-in-out infinite",
        "aurora-drift-slow": "aurora-drift-slow 24s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

export default config;
