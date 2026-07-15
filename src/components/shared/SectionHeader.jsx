import useReveal from "@/hooks/useReveal";

// ────────────────────────────────────────────────────────────────────────
// SectionHeader — the one heading pattern for every section across the
// public homepage and the authenticated app: small uppercase eyebrow,
// serif display title, optional supporting copy. Reuse this instead of
// hand-rolling `<h2>` + `<span>` combos per page.
// `align` defaults to left (dashboards/lists); pass "center" for
// marketing-style sections.
// ────────────────────────────────────────────────────────────────────────
export function SectionHeader({ eyebrow, title, subtitle, align = "left", className = "", action }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={`iy-reveal flex items-end justify-between gap-4 ${align === "center" ? "flex-col text-center max-w-xl mx-auto" : ""} ${className}`}
    >
      <div>
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
            {eyebrow}
          </span>
        )}
        <h2 className="font-display mt-1 text-xl sm:text-2xl lg:text-3xl font-medium text-[var(--color-ink)] tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export default SectionHeader;
