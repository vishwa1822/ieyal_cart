/* ────────────────────────────────────────────────────────────────────────
   SectionDivider — quiet, on-brand seams between sections instead of a
   blank hard cut. Three variants, all currentColor so they inherit the
   ieyal palette automatically:
     - "wave"   soft single-crest wave, for surface → bg transitions
     - "curve"  gentle organic curve, asymmetric so it doesn't feel stamped
     - "gradient" no shape at all — just a soft fade, for the subtlest seam
   Usage: <SectionDivider variant="wave" tone="ink" flip /> sits between
   two <section> elements; `tone` picks the fill color, `flip` mirrors it.
   ──────────────────────────────────────────────────────────────────── */
export default function SectionDivider({ variant = "wave", tone = "bg", flip = false }) {
  if (variant === "gradient") {
    return <div className="iy-divider-gradient" aria-hidden="true" />;
  }

  const toneClass = tone === "ink" ? "iy-divider--ink" : tone === "surface" ? "iy-divider--surface" : "";
  const transform = flip ? "scale(1,-1)" : undefined;

  return (
    <div className={`iy-divider ${toneClass}`} aria-hidden="true" style={{ transform }}>
      {variant === "wave" ? (
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path
            fill="currentColor"
            d="M0,32 C240,72 480,0 720,24 C960,48 1200,80 1440,40 L1440,80 L0,80 Z"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path
            fill="currentColor"
            d="M0,48 C360,8 1080,88 1440,24 L1440,80 L0,80 Z"
          />
        </svg>
      )}
    </div>
  );
}
