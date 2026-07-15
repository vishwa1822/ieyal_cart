/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-family)", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        primary: "var(--color-primary)",
        "primary-dark": "var(--color-primary-dark)",
        "primary-light": "var(--color-primary-light)",
        ink: "var(--color-ink)",
        "ink-light": "var(--color-ink-light)",
        accent: "var(--color-accent)",
        surface: "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        muted: "var(--color-text-muted)",
        faint: "var(--color-text-faint)",
        danger: "var(--color-danger)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
      },
      borderRadius: {
        card: "var(--radius-card)",
        btn: "var(--radius-btn)",
        lg2: "var(--radius-lg)",
      },
      maxWidth: {
        desktop: "var(--content-max)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm2: "var(--shadow-sm)",
        premium: "var(--shadow-md)",
        "premium-lg": "var(--shadow-lg)",
        glow: "var(--shadow-glow)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.35s ease-out",
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [],
};
